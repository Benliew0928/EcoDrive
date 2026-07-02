"use client";

import { useEffect } from "react";
import { useDashboardStore } from "../lib/dashboard-store";
import type { ProcessedTelemetry } from "../types/dashboard";

export function useDashboardRuntime(enabled = true) {
  const receiveTelemetry = useDashboardStore((state) => state.receiveTelemetry);
  const setConnectionStatus = useDashboardStore((state) => state.setConnectionStatus);
  const wsUrl = process.env.NEXT_PUBLIC_ECODRIVE_WS_URL;

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

    let socket: WebSocket | null = new WebSocket(wsUrl);
    setConnectionStatus("connecting");

    socket.addEventListener("open", () => setConnectionStatus("live"));
    socket.addEventListener("error", () => setConnectionStatus("error"));
    socket.addEventListener("close", () => setConnectionStatus("disconnected"));
    socket.addEventListener("message", (message) => {
      const telemetry = parseTelemetryPacket(message.data);

      if (!telemetry) {
        console.warn("Ignored malformed EcoDrive telemetry packet.");
        return;
      }

      receiveTelemetry(telemetry);
    });

    return () => {
      socket?.close();
      socket = null;
    };
  }, [enabled, receiveTelemetry, setConnectionStatus, wsUrl]);
}

function parseSimulatorTelemetryMessage(data: unknown): ProcessedTelemetry | null {
  if (!data || typeof data !== "object") return null;

  const message = data as { type?: unknown; telemetry?: unknown };
  if (message.type !== "ecodrive:simulator-telemetry") return null;

  return parseTelemetryPacket(message.telemetry);
}

function parseTelemetryPacket(data: unknown): ProcessedTelemetry | null {
  try {
    const parsed = typeof data === "string" ? JSON.parse(data) : data;
    if (!isTelemetryPacket(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function isTelemetryPacket(value: unknown): value is ProcessedTelemetry {
  if (!value || typeof value !== "object") return false;

  const packet = value as ProcessedTelemetry;
  return (
    hasOptionalNumber(packet.ecoScore) &&
    hasOptionalNumber(packet.speedKmh) &&
    hasOptionalNumber(packet.hardBrakes) &&
    hasOptionalNumber(packet.coinsEarned) &&
    hasOptionalNumber(packet.totalCoins) &&
    hasOptionalNumber(packet.energyKwh) &&
    hasOptionalNumber(packet.co2SavedKg) &&
    hasOptionalNumber(packet.timestamp) &&
    hasOptionalNumber(packet.distanceKm) &&
    hasOptionalNumber(packet.batteryPercent) &&
    hasOptionalNumber(packet.rangeKm) &&
    hasOptionalNumber(packet.regenKw) &&
    hasOptionalNumber(packet.motorKw) &&
    hasOptionalNumber(packet.throttle) &&
    hasOptionalNumber(packet.brake) &&
    hasOptionalNumber(packet.steering)
  );
}

function hasOptionalNumber(value: unknown) {
  return value === undefined || typeof value === "number";
}
