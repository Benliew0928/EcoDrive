"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createDashboardEvent } from "./dashboard-data";
import type { ConnectionStatus, DashboardState, ProcessedTelemetry } from "../types/dashboard";

type DashboardActions = {
  setConnectionStatus: (connectionStatus: ConnectionStatus) => void;
  receiveTelemetry: (telemetry: ProcessedTelemetry) => void;
  clearTelemetry: () => void;
  spendCoins: (amount: number) => boolean;
};

type DashboardInternalState = {
  spentCoins: number;
  hasHydrated: boolean;
  setHasHydrated: (hasHydrated: boolean) => void;
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

export const useDashboardStore = create<DashboardState & DashboardActions & DashboardInternalState>()(
  persist(
    (set) => ({
      ...initialState,
      spentCoins: 0,
      hasHydrated: false,
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
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
            walletCoins:
              telemetry.totalCoins != null
                ? Math.max(0, telemetry.totalCoins - state.spentCoins)
                : state.walletCoins + (telemetry.coinsEarned ?? 0),
            globalScore: state.globalScore + (telemetry.coinsEarned ?? 0)
          };
        }),
      spendCoins: (amount) => {
        let success = false;
        set((state) => {
          if (state.walletCoins >= amount) {
            success = true;
            return {
              walletCoins: state.walletCoins - amount,
              spentCoins: state.spentCoins + amount
            };
          }
          return state;
        });
        return success;
      },
      clearTelemetry: () => set({ ...initialState, spentCoins: 0 })
    }),
    {
      name: "ecodrive-wallet-v2",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        walletCoins: state.walletCoins,
        spentCoins: state.spentCoins,
        globalScore: state.globalScore
      }),
      skipHydration: true,
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true)
    }
  )
);

function statusMessage(connectionStatus: ConnectionStatus) {
  if (connectionStatus === "connecting") return "Connecting to simulator telemetry.";
  if (connectionStatus === "live") return "Live simulator telemetry connected.";
  if (connectionStatus === "error") return "Telemetry connection error.";
  if (connectionStatus === "disconnected") return "Telemetry disconnected.";
  return "Set NEXT_PUBLIC_ECODRIVE_WS_URL to connect live simulator telemetry.";
}
