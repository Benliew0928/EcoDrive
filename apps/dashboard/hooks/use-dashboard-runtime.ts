"use client";

import { useEffect } from "react";
import { useDashboardStore } from "../lib/dashboard-store";
import type { ProcessedTelemetry } from "../types/dashboard";

export function useDashboardRuntime() {
  const receiveTelemetry = useDashboardStore((state) => state.receiveTelemetry);
  const setConnectionStatus = useDashboardStore((state) => state.setConnectionStatus);
  const wsUrl = process.env.NEXT_PUBLIC_ECODRIVE_WS_URL;

  useEffect(() => {
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
  }, [receiveTelemetry, setConnectionStatus, wsUrl]);
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
