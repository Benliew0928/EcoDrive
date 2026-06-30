import type {
  Challenge,
  CityAsset,
  CityCell,
  DriveEventType,
  FleetVehicle,
  HardwareFeedback,
  ProcessedTelemetry,
  Reward,
  RouteOption
} from "../types/dashboard";

export const routeOptions: RouteOption[] = [
  {
    id: "eco",
    label: "Lake 18 Eco Route",
    badge: "Recommended",
    etaMin: 20,
    distanceKm: 2.8,
    energyKwh: 2.1,
    co2Kg: 0.62,
    coinsBonus: 50,
    color: "#37e58f",
    description: "Smoother internal loop around Lake 18 and Lake 19 with fewer hard-brake points.",
    coordinates: [
      [4.3391, 101.1438],
      [4.3384, 101.1432],
      [4.3373, 101.1422],
      [4.3361, 101.1415],
      [4.3353, 101.1424],
      [4.3357, 101.1441],
      [4.3371, 101.1452],
      [4.3385, 101.1448]
    ]
  },
  {
    id: "fast",
    label: "Academic Fast Line",
    badge: "Fastest",
    etaMin: 16,
    distanceKm: 2.2,
    energyKwh: 2.8,
    co2Kg: 0.91,
    coinsBonus: 10,
    color: "#f5b84b",
    description: "Shorter academic spine with stop-start clusters near faculty blocks and workshop zones.",
    coordinates: [
      [4.3391, 101.1438],
      [4.3382, 101.1441],
      [4.3371, 101.1445],
      [4.3359, 101.1442],
      [4.3354, 101.1432],
      [4.3362, 101.1424],
      [4.3378, 101.1431]
    ]
  },
  {
    id: "balanced",
    label: "Balanced Campus Route",
    badge: "Backup",
    etaMin: 18,
    distanceKm: 2.5,
    energyKwh: 2.4,
    co2Kg: 0.75,
    coinsBonus: 25,
    color: "#38bdf8",
    description: "Middle route for demo comparison when the judge asks for a compromise option.",
    coordinates: [
      [4.3391, 101.1438],
      [4.3383, 101.1436],
      [4.3374, 101.1432],
      [4.3364, 101.1427],
      [4.3358, 101.1434],
      [4.3369, 101.1444],
      [4.3384, 101.1442]
    ]
  }
];

export const initialTelemetry: ProcessedTelemetry = {
  deviceId: "ecodrive-demo-01",
  ecoScore: 84,
  speedKmh: 0,
  event: "launch_ready",
  hardBrakes: 0,
  coinsEarned: 0,
  totalCoins: 245,
  energyKwh: 0.18,
  co2SavedKg: 1.42,
  ledState: "green",
  timestamp: Date.now(),
  distanceKm: 0,
  batteryPercent: 82,
  rangeKm: 438,
  regenKw: 18,
  motorKw: 42,
  routeChoice: "unknown"
};

export const cityAssets: CityAsset[] = [
  { id: "park", label: "Park", cost: 80, yieldPerDay: 8, bonusWith: ["school", "recycle"], color: "#37e58f" },
  { id: "solar", label: "Solar", cost: 140, yieldPerDay: 14, bonusWith: ["charger", "wind"], color: "#f5b84b" },
  { id: "charger", label: "EV hub", cost: 120, yieldPerDay: 12, bonusWith: ["solar", "recycle"], color: "#38bdf8" },
  { id: "recycle", label: "Recycle", cost: 100, yieldPerDay: 10, bonusWith: ["park", "charger"], color: "#8ee7c1" },
  { id: "wind", label: "Wind", cost: 130, yieldPerDay: 13, bonusWith: ["solar"], color: "#b7f5ff" },
  { id: "school", label: "School", cost: 160, yieldPerDay: 16, bonusWith: ["park"], color: "#f7d58a" }
];

export const initialCityCells: CityCell[] = Array.from({ length: 64 }, (_, index) => ({
  assetId: index === 9 ? "park" : index === 18 ? "solar" : index === 19 ? "charger" : null,
  placedAt: index === 9 || index === 18 || index === 19 ? Date.now() - 180000 : null
}));

export const initialRewards: Reward[] = [
  {
    id: "coffee",
    title: "Campus coffee",
    description: "Redeem one drink at the demo marketplace counter.",
    cost: 100,
    category: "food",
    redeemed: false
  },
  {
    id: "parking",
    title: "Parking discount",
    description: "Simulated RM2 campus parking credit for smooth drivers.",
    cost: 180,
    category: "parking",
    redeemed: false
  },
  {
    id: "charging",
    title: "EV charging credit",
    description: "Unlock clean charging credit after sustained eco streaks.",
    cost: 320,
    category: "charging",
    redeemed: false
  }
];

export const initialChallenges: Challenge[] = [
  { id: "smooth-operators", title: "Smooth Operators", targetKg: 500, progressKg: 386, rewardCoins: 100, joined: false },
  { id: "no-hard-brake", title: "No Hard Brake Day", targetKg: 180, progressKg: 122, rewardCoins: 60, joined: false },
  { id: "million-meter", title: "Million Meter March", targetKg: 800, progressKg: 510, rewardCoins: 180, joined: false }
];

export const initialFleetVehicles: FleetVehicle[] = [
  { id: "shuttle-01", name: "Shuttle 01", status: "live", ecoScore: 86, speedKmh: 32, alert: "No alerts", updatedAt: Date.now() },
  { id: "shuttle-02", name: "Shuttle 02", status: "warning", ecoScore: 73, speedKmh: 28, alert: "Hard braking", updatedAt: Date.now() },
  { id: "shuttle-03", name: "Shuttle 03", status: "idle", ecoScore: 69, speedKmh: 0, alert: "Vibration", updatedAt: Date.now() },
  { id: "shuttle-04", name: "Shuttle 04", status: "live", ecoScore: 81, speedKmh: 30, alert: "Normal", updatedAt: Date.now() },
  { id: "demo-unit", name: "Demo Unit", status: "live", ecoScore: 84, speedKmh: 0, alert: "ESP32 connected", updatedAt: Date.now() }
];

export const eventCopy: Record<DriveEventType, { label: string; severity: "good" | "info" | "warning" | "danger" }> = {
  launch_ready: { label: "Launch ready. Select a route and start driving.", severity: "info" },
  route_selected: { label: "Eco route selected. Simulator can begin.", severity: "good" },
  smooth_segment: { label: "Smooth segment. Eco-score climbing.", severity: "good" },
  smooth_streak: { label: "Smooth streak bonus. EcoCoins awarded.", severity: "good" },
  harsh_brake: { label: "Harsh brake detected. Ease off earlier.", severity: "danger" },
  aggressive_acceleration: { label: "Aggressive acceleration detected.", severity: "warning" },
  overspeed: { label: "Overspeed warning. High drag range.", severity: "warning" },
  regen_success: { label: "Regen zone captured. Energy recovered.", severity: "good" },
  fast_route_warning: { label: "Fast route has stop-start risk ahead.", severity: "warning" },
  reverse_mode: { label: "Reverse mode detected.", severity: "info" },
  finish_loop: { label: "Campus lap complete. Telemetry uploaded.", severity: "good" }
};

export const hardwareFeedback: Record<DriveEventType, HardwareFeedback> = {
  launch_ready: { led: "Blue standby", oled: "Ready for route", buzzer: "Idle", color: "blue" },
  route_selected: { led: "Green pulse", oled: "Eco route locked", buzzer: "Soft chirp", color: "green" },
  smooth_segment: { led: "Green pulse", oled: "Excellent driving", buzzer: "Idle", color: "green" },
  smooth_streak: { led: "Green sparkle", oled: "+ EcoCoins", buzzer: "Success chirp", color: "green" },
  harsh_brake: { led: "Red flash", oled: "Hard brake detected", buzzer: "Double beep", color: "red" },
  aggressive_acceleration: { led: "Amber warning", oled: "Ease acceleration", buzzer: "Short beep", color: "amber" },
  overspeed: { led: "Amber warning", oled: "Reduce speed", buzzer: "Short beep", color: "amber" },
  regen_success: { led: "Green sparkle", oled: "Regen captured", buzzer: "Soft chirp", color: "green" },
  fast_route_warning: { led: "Amber warning", oled: "Stop-start zone", buzzer: "Idle", color: "amber" },
  reverse_mode: { led: "Blue pulse", oled: "Reverse mode", buzzer: "Idle", color: "blue" },
  finish_loop: { led: "Green sparkle", oled: "Lap complete", buzzer: "Success chirp", color: "green" }
};

export function createDriveEvent(event: DriveEventType, timestamp = Date.now()) {
  const copy = eventCopy[event];
  return {
    id: `${event}-${timestamp}`,
    event,
    label: copy.label,
    severity: copy.severity,
    timestamp
  };
}

export function feedbackForScore(score: number, event: DriveEventType) {
  if (event !== "smooth_segment") return hardwareFeedback[event];
  if (score >= 85) return hardwareFeedback.smooth_segment;
  if (score >= 65) return { led: "Yellow-green", oled: "Good, stay smooth", buzzer: "Idle", color: "green" as const };
  if (score >= 45) return hardwareFeedback.aggressive_acceleration;
  return { led: "Red warning", oled: "Aggressive driving", buzzer: "Warning beep", color: "red" as const };
}
