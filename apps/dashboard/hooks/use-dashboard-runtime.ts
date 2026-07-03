"use client";

import { useEffect } from "react";
import {
  buildRelayWebSocketUrl,
  defaultSessionId,
  parseEcoDriveMessage,
  parseTelemetry
} from "@ecodrive/protocol";
import { useDashboardStore } from "../lib/dashboard-store";
import type { ProcessedTelemetry } from "../types/dashboard";

export function useDashboardRuntime(enabled = true) {
  const receiveTelemetry = useDashboardStore((state) => state.receiveTelemetry);
  const setConnectionStatus = useDashboardStore((state) => state.setConnectionStatus);
  const wsUrl = process.env.NEXT_PUBLIC_ECODRIVE_WS_URL;
  const sessionId = process.env.NEXT_PUBLIC_ECODRIVE_SESSION ?? defaultSessionId;
  const relayToken = process.env.NEXT_PUBLIC_ECODRIVE_TOKEN;

  useEffect(() => {
    if (!enabled) return;

    const receiveSimulatorMessage = (event: MessageEvent) => {
      const telemetry = parseSimulatorTelemetryMessage(event.data);
      if (!telemetry) return;
      receiveTelemetry(telemetry);
    };

    window.addEventListener("message", receiveSimulatorMessage);
    return () => window.removeEventListener("message", receiveSimulatorMessage);
  }, [enabled, receiveTelemetry]);

  useEffect(() => {
    if (!enabled) return;

    if (!wsUrl) {
      setConnectionStatus("not_configured");
      return;
    }

    let socket: WebSocket | null = new WebSocket(
      buildRelayWebSocketUrl(wsUrl, {
        role: "dashboard",
        session: sessionId,
        token: relayToken
      })
    );
    setConnectionStatus("connecting");

    socket.addEventListener("open", () => {
      setConnectionStatus("connecting");
      socket?.send(
        JSON.stringify({
          type: "client.hello",
          session: sessionId,
          role: "dashboard",
          sentAt: Date.now()
        })
      );
    });
    socket.addEventListener("error", () => setConnectionStatus("error"));
    socket.addEventListener("close", () => setConnectionStatus("disconnected"));
    socket.addEventListener("message", (message) => {
      const packet = parseEcoDriveMessage(message.data);

      if (!packet) {
        console.warn("Ignored malformed EcoDrive relay packet.");
        return;
      }

      if (packet.type === "dashboard.telemetry") {
        receiveTelemetry(packet.telemetry);
        return;
      }

      if (packet.type === "session.status") {
        setConnectionStatus((packet.clients.bridge ?? 0) > 0 ? "live" : "connecting");
        return;
      }

      if (packet.type === "bridge.hardware") {
        setConnectionStatus(packet.hardware.connected ? "live" : "disconnected");
        return;
      }

      if (packet.type === "relay.error") {
        setConnectionStatus("error");
        console.warn(`EcoDrive relay error: ${packet.code} - ${packet.message}`);
      }
    });

    return () => {
      socket?.close();
      socket = null;
    };
  }, [enabled, receiveTelemetry, relayToken, sessionId, setConnectionStatus, wsUrl]);
}

function parseSimulatorTelemetryMessage(data: unknown): ProcessedTelemetry | null {
  if (!data || typeof data !== "object") return null;

  const message = data as { type?: unknown; telemetry?: unknown };
  if (message.type !== "ecodrive:simulator-telemetry") return null;

  return parseTelemetryPacket(message.telemetry);
}

function parseTelemetryPacket(data: unknown): ProcessedTelemetry | null {
  return parseTelemetry(data);
}
