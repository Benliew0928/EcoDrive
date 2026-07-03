export const defaultSessionId = "demo-main";

export const relayRoles = ["simulator", "dashboard", "bridge"] as const;
export type RelayRole = (typeof relayRoles)[number];

export const ledStates = ["green", "amber", "red", "blue", "off"] as const;
export type LedState = (typeof ledStates)[number];

export const routeChoices = ["unknown", "eco", "fast", "balanced"] as const;
export type RouteChoice = (typeof routeChoices)[number];

export const driveEvents = [
  "smooth_segment",
  "smooth_streak",
  "harsh_brake",
  "aggressive_acceleration",
  "overspeed",
  "regen_success",
  "route_selected",
  "finish_loop",
  "launch_ready",
  "fast_route_warning",
  "idle"
] as const;
export type DriveEventType = (typeof driveEvents)[number];

export const simulatorEvents = [...driveEvents, "route_fork", "reverse_mode"] as const;
export type SimulatorEventType = (typeof simulatorEvents)[number];

export type ClientCounts = Partial<Record<RelayRole, number>>;

export type SimulatorInput = {
  throttle: number;
  brake: number;
  steering: number;
  speedKmh: number;
  ecoScore: number;
  routeChoice: RouteChoice;
  event: SimulatorEventType;
  distanceMeters?: number;
};

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
  ledState?: LedState;
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

export type BridgeHardwareState = {
  connected: boolean;
  serialPort?: string;
  ledState: LedState;
  lastCommand?: string;
};

export type RelayEnvelopeBase = {
  session: string;
  sentAt: number;
};

export type ClientHelloMessage = RelayEnvelopeBase & {
  type: "client.hello";
  role: RelayRole;
};

export type SimulatorInputMessage = RelayEnvelopeBase & {
  type: "sim.input";
  input: SimulatorInput;
};

export type DashboardTelemetryMessage = RelayEnvelopeBase & {
  type: "dashboard.telemetry";
  telemetry: ProcessedTelemetry;
};

export type BridgeHardwareMessage = RelayEnvelopeBase & {
  type: "bridge.hardware";
  hardware: BridgeHardwareState;
};

export type SessionStatusMessage = RelayEnvelopeBase & {
  type: "session.status";
  clients: ClientCounts;
  bridge?: BridgeHardwareState;
};

export type RelayErrorMessage = RelayEnvelopeBase & {
  type: "relay.error";
  code: "bad_request" | "unauthorized" | "bridge_unavailable" | "unsupported_message";
  message: string;
};

export type HeartbeatMessage = RelayEnvelopeBase & {
  type: "heartbeat";
};

export type EcoDriveMessage =
  | ClientHelloMessage
  | SimulatorInputMessage
  | DashboardTelemetryMessage
  | BridgeHardwareMessage
  | SessionStatusMessage
  | RelayErrorMessage
  | HeartbeatMessage;

const ledCommands: Record<LedState, string> = {
  amber: "A",
  blue: "B",
  green: "G",
  off: "X",
  red: "R"
};

const driveEventMap: Record<SimulatorEventType, DriveEventType> = {
  aggressive_acceleration: "aggressive_acceleration",
  fast_route_warning: "fast_route_warning",
  finish_loop: "finish_loop",
  harsh_brake: "harsh_brake",
  idle: "idle",
  launch_ready: "launch_ready",
  overspeed: "overspeed",
  regen_success: "regen_success",
  reverse_mode: "idle",
  route_fork: "route_selected",
  route_selected: "route_selected",
  smooth_segment: "smooth_segment",
  smooth_streak: "smooth_streak"
};

export function isRelayRole(value: unknown): value is RelayRole {
  return typeof value === "string" && relayRoles.includes(value as RelayRole);
}

export function isLedState(value: unknown): value is LedState {
  return typeof value === "string" && ledStates.includes(value as LedState);
}

export function isRouteChoice(value: unknown): value is RouteChoice {
  return typeof value === "string" && routeChoices.includes(value as RouteChoice);
}

export function isSimulatorEvent(value: unknown): value is SimulatorEventType {
  return typeof value === "string" && simulatorEvents.includes(value as SimulatorEventType);
}

export function isDriveEvent(value: unknown): value is DriveEventType {
  return typeof value === "string" && driveEvents.includes(value as DriveEventType);
}

export function ledStateToCommand(state: LedState) {
  return ledCommands[state];
}

export function normalizeDriveEvent(event: SimulatorEventType | DriveEventType | undefined): DriveEventType {
  if (!event) return "idle";
  if (isSimulatorEvent(event)) return driveEventMap[event];
  return "idle";
}

export function ledStateForSimulatorInput(input: SimulatorInput): LedState {
  if (input.event === "harsh_brake" || input.event === "overspeed" || input.event === "aggressive_acceleration") return "red";
  if (input.event === "fast_route_warning" || input.routeChoice === "fast") return "amber";
  if (input.event === "launch_ready") return "blue";
  if (Math.abs(input.speedKmh) < 0.5 && input.throttle < 0.02 && input.brake < 0.02) return "blue";
  return "green";
}

export function createEnvelopeBase(session = defaultSessionId): RelayEnvelopeBase {
  return {
    session,
    sentAt: Date.now()
  };
}

export function createSimulatorInputMessage(input: SimulatorInput, session = defaultSessionId): SimulatorInputMessage {
  return {
    ...createEnvelopeBase(session),
    type: "sim.input",
    input: sanitizeSimulatorInput(input)
  };
}

export function createDashboardTelemetryMessage(
  telemetry: ProcessedTelemetry,
  session = defaultSessionId
): DashboardTelemetryMessage {
  return {
    ...createEnvelopeBase(session),
    type: "dashboard.telemetry",
    telemetry: sanitizeTelemetry(telemetry)
  };
}

export function createBridgeHardwareMessage(
  hardware: BridgeHardwareState,
  session = defaultSessionId
): BridgeHardwareMessage {
  return {
    ...createEnvelopeBase(session),
    type: "bridge.hardware",
    hardware
  };
}

export function createSessionStatusMessage(
  clients: ClientCounts,
  session = defaultSessionId,
  bridge?: BridgeHardwareState
): SessionStatusMessage {
  return {
    ...createEnvelopeBase(session),
    type: "session.status",
    clients,
    bridge
  };
}

export function createRelayErrorMessage(
  code: RelayErrorMessage["code"],
  message: string,
  session = defaultSessionId
): RelayErrorMessage {
  return {
    ...createEnvelopeBase(session),
    type: "relay.error",
    code,
    message
  };
}

export function createTelemetryFromSimulatorInput(
  input: SimulatorInput,
  options: { deviceId?: string; totalCoinsBase?: number; timestamp?: number } = {}
): ProcessedTelemetry {
  const timestamp = options.timestamp ?? Date.now();
  const speedAbs = Math.abs(input.speedKmh);
  const distanceKm = Math.max(0, input.distanceMeters ?? 0) / 1000;
  const smoothnessFactor = clampNumber(input.ecoScore / 100, 0.35, 1);
  const regenKw = input.brake > 0.12 && speedAbs > 8 ? clampNumber(input.brake * 38, 0, 40) * smoothnessFactor : 0;
  const motorKw = input.throttle * (58 + speedAbs * 0.55) - regenKw * 0.35;
  const energyKwh = Math.max(0, distanceKm * (0.13 + speedAbs * 0.0026 + input.throttle * 0.09) - regenKw * 0.00012);
  const co2SavedKg = Math.max(0, distanceKm * 0.11 * smoothnessFactor);
  const eventBonus = input.event === "regen_success" ? 50 : input.event === "smooth_streak" ? 32 : input.event === "finish_loop" ? 80 : 0;
  const coinsEarned = Math.max(0, Math.round(distanceKm * 180 + Math.max(0, input.ecoScore - 70) * 1.6 + eventBonus));

  return {
    deviceId: options.deviceId ?? "esp32-demo-bridge",
    ecoScore: input.ecoScore,
    speedKmh: input.speedKmh,
    event: normalizeDriveEvent(input.event),
    hardBrakes: input.event === "harsh_brake" ? 1 : 0,
    coinsEarned,
    totalCoins: (options.totalCoinsBase ?? 1240) + coinsEarned,
    energyKwh,
    co2SavedKg,
    ledState: ledStateForSimulatorInput(input),
    timestamp,
    distanceKm,
    batteryPercent: clampNumber(88 - energyKwh * 3.6 + regenKw * 0.012, 42, 98),
    rangeKm: clampNumber(418 - distanceKm * 4.2 - energyKwh * 9, 190, 430),
    regenKw,
    motorKw,
    routeChoice: input.routeChoice,
    throttle: input.throttle,
    brake: input.brake,
    steering: input.steering
  };
}

export function parseJsonMessage(data: unknown): unknown {
  if (typeof data !== "string") return data;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function parseEcoDriveMessage(data: unknown): EcoDriveMessage | null {
  const value = parseJsonMessage(data);
  if (!isRecord(value) || typeof value.type !== "string" || typeof value.session !== "string") return null;

  if (value.type === "client.hello" && isRelayRole(value.role)) {
    return {
      session: value.session,
      sentAt: readNumber(value.sentAt, Date.now()),
      type: "client.hello",
      role: value.role
    };
  }

  if (value.type === "sim.input") {
    const input = parseSimulatorInput(value.input);
    if (!input) return null;
    return {
      session: value.session,
      sentAt: readNumber(value.sentAt, Date.now()),
      type: "sim.input",
      input
    };
  }

  if (value.type === "dashboard.telemetry") {
    const telemetry = parseTelemetry(value.telemetry);
    if (!telemetry) return null;
    return {
      session: value.session,
      sentAt: readNumber(value.sentAt, Date.now()),
      type: "dashboard.telemetry",
      telemetry
    };
  }

  if (value.type === "bridge.hardware") {
    const hardware = parseBridgeHardware(value.hardware);
    if (!hardware) return null;
    return {
      session: value.session,
      sentAt: readNumber(value.sentAt, Date.now()),
      type: "bridge.hardware",
      hardware
    };
  }

  if (value.type === "session.status" && isRecord(value.clients)) {
    return {
      session: value.session,
      sentAt: readNumber(value.sentAt, Date.now()),
      type: "session.status",
      clients: readClientCounts(value.clients),
      bridge: parseBridgeHardware(value.bridge) ?? undefined
    };
  }

  if (value.type === "relay.error" && typeof value.code === "string" && typeof value.message === "string") {
    return {
      session: value.session,
      sentAt: readNumber(value.sentAt, Date.now()),
      type: "relay.error",
      code: isRelayErrorCode(value.code) ? value.code : "unsupported_message",
      message: value.message
    };
  }

  if (value.type === "heartbeat") {
    return {
      session: value.session,
      sentAt: readNumber(value.sentAt, Date.now()),
      type: "heartbeat"
    };
  }

  return null;
}

export function parseSimulatorInput(value: unknown): SimulatorInput | null {
  if (!isRecord(value)) return null;

  return {
    throttle: clampNumber(readNumber(value.throttle), 0, 1),
    brake: clampNumber(readNumber(value.brake), 0, 1),
    steering: clampNumber(readNumber(value.steering), -1, 1),
    speedKmh: readNumber(value.speedKmh),
    ecoScore: clampNumber(readNumber(value.ecoScore, 80), 0, 100),
    routeChoice: isRouteChoice(value.routeChoice) ? value.routeChoice : "unknown",
    event: isSimulatorEvent(value.event) ? value.event : "idle",
    distanceMeters: hasNumber(value.distanceMeters) ? Math.max(0, value.distanceMeters) : undefined
  };
}

export function parseTelemetry(value: unknown): ProcessedTelemetry | null {
  if (!isRecord(value)) return null;

  const telemetry: ProcessedTelemetry = {};
  copyNumber(value, telemetry, "ecoScore");
  copyNumber(value, telemetry, "speedKmh");
  copyNumber(value, telemetry, "hardBrakes");
  copyNumber(value, telemetry, "coinsEarned");
  copyNumber(value, telemetry, "totalCoins");
  copyNumber(value, telemetry, "energyKwh");
  copyNumber(value, telemetry, "co2SavedKg");
  copyNumber(value, telemetry, "timestamp");
  copyNumber(value, telemetry, "distanceKm");
  copyNumber(value, telemetry, "batteryPercent");
  copyNumber(value, telemetry, "rangeKm");
  copyNumber(value, telemetry, "regenKw");
  copyNumber(value, telemetry, "motorKw");
  copyNumber(value, telemetry, "throttle");
  copyNumber(value, telemetry, "brake");
  copyNumber(value, telemetry, "steering");

  if (typeof value.deviceId === "string") telemetry.deviceId = value.deviceId;
  if (isDriveEvent(value.event)) telemetry.event = value.event;
  if (isLedState(value.ledState)) telemetry.ledState = value.ledState;
  if (isRouteChoice(value.routeChoice)) telemetry.routeChoice = value.routeChoice;

  return telemetry;
}

export function parseBridgeHardware(value: unknown): BridgeHardwareState | null {
  if (!isRecord(value) || typeof value.connected !== "boolean") return null;

  return {
    connected: value.connected,
    serialPort: typeof value.serialPort === "string" ? value.serialPort : undefined,
    ledState: isLedState(value.ledState) ? value.ledState : "off",
    lastCommand: typeof value.lastCommand === "string" ? value.lastCommand : undefined
  };
}

export function buildRelayWebSocketUrl(
  baseUrl: string,
  options: { session?: string; role?: RelayRole; token?: string } = {}
) {
  const url = new URL(baseUrl);
  url.searchParams.set("session", options.session ?? url.searchParams.get("session") ?? defaultSessionId);
  if (options.role) url.searchParams.set("role", options.role);
  if (options.token) url.searchParams.set("token", options.token);
  return url.toString();
}

function sanitizeSimulatorInput(input: SimulatorInput): SimulatorInput {
  return parseSimulatorInput(input) ?? {
    throttle: 0,
    brake: 0,
    steering: 0,
    speedKmh: 0,
    ecoScore: 80,
    routeChoice: "unknown",
    event: "idle"
  };
}

function sanitizeTelemetry(telemetry: ProcessedTelemetry): ProcessedTelemetry {
  return parseTelemetry(telemetry) ?? {};
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function readNumber(value: unknown, fallback = 0) {
  return hasNumber(value) ? value : fallback;
}

function copyNumber(source: Record<string, unknown>, target: ProcessedTelemetry, key: keyof ProcessedTelemetry) {
  const value = source[key];
  if (hasNumber(value)) {
    target[key] = value as never;
  }
}

function readClientCounts(clients: Record<string, unknown>): ClientCounts {
  const counts: ClientCounts = {};
  for (const role of relayRoles) {
    const value = clients[role];
    if (hasNumber(value)) counts[role] = Math.max(0, Math.floor(value));
  }
  return counts;
}

function isRelayErrorCode(value: string): value is RelayErrorMessage["code"] {
  return value === "bad_request" || value === "unauthorized" || value === "bridge_unavailable" || value === "unsupported_message";
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
