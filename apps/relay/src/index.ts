import {
  createRelayErrorMessage,
  createSessionStatusMessage,
  defaultSessionId,
  isRelayRole,
  parseEcoDriveMessage,
  type BridgeHardwareMessage,
  type BridgeHardwareState,
  type DashboardTelemetryMessage,
  type EcoDriveMessage,
  type RelayRole,
  type SimulatorInputMessage
} from "@ecodrive/protocol";

export interface Env {
  ECODRIVE_SESSION: DurableObjectNamespace;
  ALLOWED_ORIGINS?: string;
  DEMO_TOKEN?: string;
}

type ClientAttachment = {
  clientId: string;
  connectedAt: number;
  role: RelayRole;
  session: string;
};

const corsHeaders = {
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Origin": "*"
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return json({ ok: true, service: "ecodrive-relay" });
    }

    if (url.pathname !== "/ws") {
      return json({ ok: false, error: "Use /ws for EcoDrive relay WebSocket connections." }, 404);
    }

    if (request.headers.get("Upgrade") !== "websocket") {
      return json({ ok: false, error: "Expected WebSocket upgrade." }, 426);
    }

    const role = url.searchParams.get("role");
    if (!isRelayRole(role)) {
      return json({ ok: false, error: "Missing or invalid role. Use simulator, dashboard, or bridge." }, 400);
    }

    const token = url.searchParams.get("token");
    if (env.DEMO_TOKEN && token !== env.DEMO_TOKEN) {
      return json({ ok: false, error: "Invalid demo token." }, 401);
    }

    const session = sanitizeSessionId(url.searchParams.get("session") ?? defaultSessionId);
    url.searchParams.set("session", session);
    url.searchParams.set("role", role);

    const id = env.ECODRIVE_SESSION.idFromName(session);
    const object = env.ECODRIVE_SESSION.get(id);

    return object.fetch(new Request(url.toString(), request));
  }
};

export class EcoDriveSession {
  constructor(
    private readonly state: DurableObjectState,
    private readonly env: Env
  ) {}

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.headers.get("Upgrade") !== "websocket") {
      const session = sanitizeSessionId(url.searchParams.get("session") ?? defaultSessionId);
      return json({
        ok: true,
        session,
        clients: this.countClients(),
        lastTelemetry: await this.state.storage.get<DashboardTelemetryMessage>("lastTelemetry"),
        bridge: await this.state.storage.get<BridgeHardwareState>("bridge")
      });
    }

    const role = url.searchParams.get("role");
    if (!isRelayRole(role)) {
      return json({ ok: false, error: "Invalid role." }, 400);
    }

    const session = sanitizeSessionId(url.searchParams.get("session") ?? defaultSessionId);
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    const attachment: ClientAttachment = {
      clientId: crypto.randomUUID(),
      connectedAt: Date.now(),
      role,
      session
    };

    server.serializeAttachment(attachment);
    this.state.acceptWebSocket(server);

    this.send(server, createSessionStatusMessage(this.countClients(), session, await this.state.storage.get("bridge")));

    const lastTelemetry = await this.state.storage.get<DashboardTelemetryMessage>("lastTelemetry");
    if (role === "dashboard" && lastTelemetry) {
      this.send(server, lastTelemetry);
    }

    await this.broadcastStatus(session);

    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }

  async webSocketMessage(socket: WebSocket, rawMessage: string | ArrayBuffer) {
    const attachment = this.readAttachment(socket);
    if (!attachment) return;

    const message = parseEcoDriveMessage(typeof rawMessage === "string" ? rawMessage : new TextDecoder().decode(rawMessage));
    if (!message || message.session !== attachment.session) {
      this.send(socket, createRelayErrorMessage("bad_request", "Malformed packet or wrong session.", attachment.session));
      return;
    }

    if (message.type === "heartbeat") {
      this.send(socket, { ...message, sentAt: Date.now() });
      return;
    }

    if (message.type === "client.hello") {
      await this.broadcastStatus(attachment.session);
      return;
    }

    if (message.type === "sim.input") {
      await this.handleSimulatorInput(socket, attachment, message);
      return;
    }

    if (message.type === "dashboard.telemetry") {
      await this.handleDashboardTelemetry(attachment, message);
      return;
    }

    if (message.type === "bridge.hardware") {
      await this.handleBridgeHardware(attachment, message);
      return;
    }

    this.send(socket, createRelayErrorMessage("unsupported_message", `Unsupported message: ${message.type}`, attachment.session));
  }

  async webSocketClose(socket: WebSocket) {
    const attachment = this.readAttachment(socket);
    if (!attachment) return;
    await this.broadcastStatus(attachment.session);
  }

  async webSocketError(socket: WebSocket) {
    const attachment = this.readAttachment(socket);
    if (!attachment) return;
    await this.broadcastStatus(attachment.session);
  }

  private async handleSimulatorInput(
    socket: WebSocket,
    attachment: ClientAttachment,
    message: SimulatorInputMessage
  ) {
    if (attachment.role !== "simulator") {
      this.send(socket, createRelayErrorMessage("unauthorized", "Only simulator clients can send sim.input.", attachment.session));
      return;
    }

    const bridgeCount = this.sendToRole("bridge", message);
    if (bridgeCount === 0) {
      this.send(socket, createRelayErrorMessage("bridge_unavailable", "No ESP32 bridge is connected.", attachment.session));
    }
  }

  private async handleDashboardTelemetry(attachment: ClientAttachment, message: DashboardTelemetryMessage) {
    if (attachment.role !== "bridge") return;

    await this.state.storage.put("lastTelemetry", message);
    this.sendToRole("dashboard", message);
    this.sendToRole("simulator", message);
  }

  private async handleBridgeHardware(attachment: ClientAttachment, message: BridgeHardwareMessage) {
    if (attachment.role !== "bridge") return;

    await this.state.storage.put("bridge", message.hardware);
    this.sendToRole("dashboard", message);
    this.sendToRole("simulator", message);
    await this.broadcastStatus(attachment.session);
  }

  private async broadcastStatus(session: string) {
    const bridge = await this.state.storage.get<BridgeHardwareState>("bridge");
    this.broadcast(createSessionStatusMessage(this.countClients(), session, bridge));
  }

  private broadcast(message: EcoDriveMessage) {
    for (const socket of this.state.getWebSockets()) {
      this.send(socket, message);
    }
  }

  private sendToRole(role: RelayRole, message: EcoDriveMessage) {
    let count = 0;
    for (const socket of this.state.getWebSockets()) {
      const attachment = this.readAttachment(socket);
      if (attachment?.role !== role) continue;
      this.send(socket, message);
      count++;
    }
    return count;
  }

  private send(socket: WebSocket, message: EcoDriveMessage) {
    try {
      socket.send(JSON.stringify(message));
    } catch {
      socket.close(1011, "send failed");
    }
  }

  private countClients() {
    const counts: Partial<Record<RelayRole, number>> = {};
    for (const socket of this.state.getWebSockets()) {
      const attachment = this.readAttachment(socket);
      if (!attachment) continue;
      counts[attachment.role] = (counts[attachment.role] ?? 0) + 1;
    }
    return counts;
  }

  private readAttachment(socket: WebSocket): ClientAttachment | null {
    const attachment = socket.deserializeAttachment() as ClientAttachment | null;
    if (!attachment || !isRelayRole(attachment.role) || typeof attachment.session !== "string") return null;
    return attachment;
  }
}

function sanitizeSessionId(session: string) {
  return session.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64) || defaultSessionId;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}
