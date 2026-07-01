export type RouteChoice = "eco" | "fast" | "balanced" | "unknown";

export type DriveEventType =
  | "smooth_segment"
  | "smooth_streak"
  | "harsh_brake"
  | "aggressive_acceleration"
  | "overspeed"
  | "regen_success"
  | "route_selected"
  | "finish_loop"
  | "launch_ready"
  | "fast_route_warning"
  | "idle";

export type ConnectionStatus = "not_configured" | "connecting" | "live" | "error" | "disconnected";

export type ProcessedTelemetry = {
  deviceId?: string;
  ecoScore?: number;
  speedKmh?: number;
  event?: DriveEventType;
  hardBrakes?: number;
  coinsEarned?: number;
  totalCoins?: number;
  energyKwh?: number;
  co2SavedKg?: number;
  ledState?: "green" | "amber" | "red" | "blue";
  timestamp?: number;
  distanceKm?: number;
  batteryPercent?: number;
  rangeKm?: number;
  regenKw?: number;
  motorKw?: number;
  routeChoice?: RouteChoice;
  throttle?: number;
  brake?: number;
  steering?: number;
};

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
};
