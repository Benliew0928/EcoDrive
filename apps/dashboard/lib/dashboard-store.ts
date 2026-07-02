"use client";

import { create } from "zustand";
import { createDashboardEvent } from "./dashboard-data";
import type { ConnectionStatus, DashboardState, ProcessedTelemetry } from "../types/dashboard";

type DashboardActions = {
  setConnectionStatus: (connectionStatus: ConnectionStatus) => void;
  receiveTelemetry: (telemetry: ProcessedTelemetry) => void;
  clearTelemetry: () => void;
  spendCoins: (amount: number) => boolean;
};

const initialState: DashboardState = {
  connectionStatus: "not_configured",
  telemetry: null,
  eventFeed: [],
  lastPacketAt: null,
  lastActionMessage: "Waiting for simulator telemetry.",
  walletCoins: 1250, // Give them some starting coins for the demo
  globalScore: 24500 // Demo global ranking score
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
        lastActionMessage: "Live simulator telemetry received.",
        // If telemetry provides a totalCoins override, use it. Otherwise accumulate coinsEarned.
        walletCoins: telemetry.totalCoins ?? (state.walletCoins + (telemetry.coinsEarned ?? 0)),
        globalScore: state.globalScore + (telemetry.coinsEarned ?? 0)
      };
    }),
  spendCoins: (amount) => {
    let success = false;
    set((state) => {
      if (state.walletCoins >= amount) {
        success = true;
        return { walletCoins: state.walletCoins - amount };
      }
      return state;
    });
    return success;
  },
  clearTelemetry: () => set(initialState)
}));

function statusMessage(connectionStatus: ConnectionStatus) {
  if (connectionStatus === "connecting") return "Connecting to simulator telemetry.";
  if (connectionStatus === "live") return "Live simulator telemetry connected.";
  if (connectionStatus === "error") return "Telemetry connection error.";
  if (connectionStatus === "disconnected") return "Telemetry disconnected.";
  return "Set NEXT_PUBLIC_ECODRIVE_WS_URL to connect live simulator telemetry.";
}
