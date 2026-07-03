import type { DriveEventType, ProcessedTelemetry } from "@ecodrive/protocol";

export type { DriveEventType, ProcessedTelemetry, RouteChoice } from "@ecodrive/protocol";

export type ConnectionStatus = "not_configured" | "connecting" | "live" | "error" | "disconnected";

export type DashboardEvent = {
  id: string;
  event: DriveEventType;
  label: string;
  severity: "good" | "warning" | "danger" | "neutral";
  timestamp: number;
};

export type DashboardState = {
  connectionStatus: ConnectionStatus;
  telemetry: ProcessedTelemetry | null;
  eventFeed: DashboardEvent[];
  lastPacketAt: number | null;
  lastActionMessage: string;
  walletCoins: number;
  globalScore: number;
};
