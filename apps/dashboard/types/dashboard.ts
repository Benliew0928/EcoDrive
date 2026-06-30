export type RouteId = "eco" | "fast" | "balanced";

export type DriveEventType =
  | "launch_ready"
  | "route_selected"
  | "smooth_segment"
  | "smooth_streak"
  | "harsh_brake"
  | "aggressive_acceleration"
  | "overspeed"
  | "regen_success"
  | "fast_route_warning"
  | "reverse_mode"
  | "finish_loop";

export type LedState = "green" | "amber" | "red" | "blue";

export type ConnectionStatus = "demo" | "connecting" | "live" | "error";

export type ProcessedTelemetry = {
  deviceId: string;
  ecoScore: number;
  speedKmh: number;
  event: DriveEventType;
  hardBrakes: number;
  coinsEarned: number;
  totalCoins: number;
  energyKwh: number;
  co2SavedKg: number;
  ledState: LedState;
  timestamp: number;
  distanceKm: number;
  batteryPercent: number;
  rangeKm: number;
  regenKw: number;
  motorKw: number;
  routeChoice: RouteId | "unknown";
};

export type RouteOption = {
  id: RouteId;
  label: string;
  badge: string;
  etaMin: number;
  distanceKm: number;
  energyKwh: number;
  co2Kg: number;
  coinsBonus: number;
  color: string;
  description: string;
  coordinates: Array<[number, number]>;
};

export type DriveEvent = {
  id: string;
  event: DriveEventType;
  label: string;
  severity: "good" | "info" | "warning" | "danger";
  timestamp: number;
};

export type Reward = {
  id: string;
  title: string;
  description: string;
  cost: number;
  category: "food" | "parking" | "charging";
  redeemed: boolean;
};

export type Redemption = {
  id: string;
  rewardId: string;
  title: string;
  cost: number;
  qrToken: string;
  redeemedAt: number;
};

export type CityAsset = {
  id: string;
  label: string;
  cost: number;
  yieldPerDay: number;
  bonusWith: string[];
  color: string;
};

export type CityCell = {
  assetId: string | null;
  placedAt: number | null;
};

export type Challenge = {
  id: string;
  title: string;
  targetKg: number;
  progressKg: number;
  rewardCoins: number;
  joined: boolean;
};

export type FleetVehicle = {
  id: string;
  name: string;
  status: "live" | "idle" | "warning";
  ecoScore: number;
  speedKmh: number;
  alert: string;
  updatedAt: number;
};

export type HardwareFeedback = {
  led: string;
  oled: string;
  buzzer: string;
  color: LedState;
};

export type Wallet = {
  rawCoins: number;
  yieldCoins: number;
};

export type DashboardState = {
  activeRouteId: RouteId | null;
  connectionStatus: ConnectionStatus;
  demoRunning: boolean;
  demoTickIndex: number;
  telemetry: ProcessedTelemetry;
  eventFeed: DriveEvent[];
  wallet: Wallet;
  cityCells: CityCell[];
  selectedCityAssetId: string;
  rewards: Reward[];
  redemptionHistory: Redemption[];
  activeQrToken: string | null;
  challenges: Challenge[];
  fleetVehicles: FleetVehicle[];
  lastActionMessage: string;
};
