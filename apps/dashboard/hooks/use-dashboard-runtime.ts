"use client";

import { useEffect } from "react";
import { useDashboardStore } from "../lib/dashboard-store";
import type { ProcessedTelemetry } from "../types/dashboard";

export function useDashboardRuntime() {
  const connectionStatus = useDashboardStore((state) => state.connectionStatus);
  const demoRunning = useDashboardStore((state) => state.demoRunning);
  const tickDemo = useDashboardStore((state) => state.tickDemo);
  const receiveTelemetry = useDashboardStore((state) => state.receiveTelemetry);
  const setConnectionStatus = useDashboardStore((state) => state.setConnectionStatus);
  const wsUrl = process.env.NEXT_PUBLIC_ECODRIVE_WS_URL;

  useEffect(() => {
    if (!wsUrl) {
      setConnectionStatus("demo");
      return;
    }

    let socket: WebSocket | null = new WebSocket(wsUrl);
    setConnectionStatus("connecting");

    socket.addEventListener("open", () => setConnectionStatus("live"));
    socket.addEventListener("error", () => setConnectionStatus("error"));
    socket.addEventListener("close", () => setConnectionStatus("demo"));
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
  }, [receiveTelemetry, setConnectionStatus, wsUrl]);

  useEffect(() => {
    if (!demoRunning || connectionStatus === "live") return;

    const interval = window.setInterval(() => tickDemo(), 1000);
    return () => window.clearInterval(interval);
  }, [connectionStatus, demoRunning, tickDemo]);
}

function parseTelemetryPacket(data: unknown): ProcessedTelemetry | null {
  try {
    const parsed = typeof data === "string" ? JSON.parse(data) : data;

    if (!isTelemetryPacket(parsed)) return null;

    return {
      deviceId: parsed.deviceId,
      ecoScore: parsed.ecoScore,
      speedKmh: parsed.speedKmh,
      event: parsed.event,
      hardBrakes: parsed.hardBrakes,
      coinsEarned: parsed.coinsEarned,
      totalCoins: parsed.totalCoins,
      energyKwh: parsed.energyKwh,
      co2SavedKg: parsed.co2SavedKg,
      ledState: parsed.ledState,
      timestamp: parsed.timestamp,
      distanceKm: parsed.distanceKm ?? 0,
      batteryPercent: parsed.batteryPercent ?? 82,
      rangeKm: parsed.rangeKm ?? 438,
      regenKw: parsed.regenKw ?? 0,
      motorKw: parsed.motorKw ?? 0,
      routeChoice: parsed.routeChoice ?? "unknown"
    };
  } catch {
    return null;
  }
}

function isTelemetryPacket(value: unknown): value is ProcessedTelemetry {
  if (!value || typeof value !== "object") return false;

  const packet = value as Partial<ProcessedTelemetry>;
  return (
    typeof packet.deviceId === "string" &&
    typeof packet.ecoScore === "number" &&
    typeof packet.speedKmh === "number" &&
    typeof packet.event === "string" &&
    typeof packet.hardBrakes === "number" &&
    typeof packet.coinsEarned === "number" &&
    typeof packet.totalCoins === "number" &&
    typeof packet.energyKwh === "number" &&
    typeof packet.co2SavedKg === "number" &&
    typeof packet.ledState === "string" &&
    typeof packet.timestamp === "number"
  );
}
