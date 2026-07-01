"use client";

import { create } from "zustand";
import { createDashboardEvent } from "./dashboard-data";
import type { ConnectionStatus, DashboardState, ProcessedTelemetry } from "../types/dashboard";

type DashboardActions = {
  setConnectionStatus: (connectionStatus: ConnectionStatus) => void;
  receiveTelemetry: (telemetry: ProcessedTelemetry) => void;
  clearTelemetry: () => void;
};

const initialState: DashboardState = {
  connectionStatus: "not_configured",
  telemetry: null,
  eventFeed: [],
  lastPacketAt: null,
  lastActionMessage: "Waiting for simulator telemetry."
};

export const useDashboardStore = create<DashboardState & DashboardActions>()((set) => ({
  ...initialState,
  setConnectionStatus: (connectionStatus) =>
    set({
      connectionStatus,
      lastActionMessage: statusMessage(connectionStatus)
    }),
  receiveTelemetry: (telemetry) =>
    set((state) => {
      const timestamp = telemetry.timestamp ?? Date.now();
      const eventFeed = telemetry.event
        ? [createDashboardEvent(telemetry.event, timestamp), ...state.eventFeed].slice(0, 8)
        : state.eventFeed;

      return {
        telemetry: {
          ...telemetry,
          timestamp
        },
        eventFeed,
        connectionStatus: "live",
        lastPacketAt: timestamp,
        lastActionMessage: "Live simulator telemetry received."
      };
    }),
  clearTelemetry: () => set(initialState)
}));

function statusMessage(connectionStatus: ConnectionStatus) {
  if (connectionStatus === "connecting") return "Connecting to simulator telemetry.";
  if (connectionStatus === "live") return "Live simulator telemetry connected.";
  if (connectionStatus === "error") return "Telemetry connection error.";
  if (connectionStatus === "disconnected") return "Telemetry disconnected.";
  return "Set NEXT_PUBLIC_ECODRIVE_WS_URL to connect live simulator telemetry.";
}
