/**
 * EcoDrive+ Cloud Bridge
 *
 * Connects the public Cloudflare relay to the ESP32 over USB serial.
 *
 * Public path:
 *   Simulator website -> Cloudflare relay -> this bridge -> ESP32 USB serial
 *   ESP32/bridge telemetry -> Cloudflare relay -> Dashboard website
 *
 * Usage:
 *   set ECODRIVE_RELAY_WS_URL=wss://ecodrive-relay.<domain>/ws
 *   set ECODRIVE_SESSION=demo-main
 *   set ECODRIVE_TOKEN=<optional-token>
 *   npm run bridge:cloud --workspace @ecodrive/server -- COM5
 *
 * Mock test without ESP32:
 *   set ECODRIVE_BRIDGE_MOCK=1
 *   npm run bridge:cloud --workspace @ecodrive/server
 */

import { SerialPort } from "serialport";
import WebSocket from "ws";
import {
  buildRelayWebSocketUrl,
  createBridgeHardwareMessage,
  createDashboardTelemetryMessage,
  createTelemetryFromSimulatorInput,
  defaultSessionId,
  ledStateForSimulatorInput,
  ledStateToCommand,
  parseEcoDriveMessage
} from "@ecodrive/protocol";

const BAUD_RATE = 115200;
const EXPLICIT_PORT = process.argv.find((arg) => /^COM\d+$/i.test(arg)) ?? null;
const MOCK_MODE = process.env.ECODRIVE_BRIDGE_MOCK === "1" || process.argv.includes("--mock");
const RELAY_WS_URL = process.env.ECODRIVE_RELAY_WS_URL ?? "ws://127.0.0.1:8787/ws";
const SESSION = process.env.ECODRIVE_SESSION ?? defaultSessionId;
const TOKEN = process.env.ECODRIVE_TOKEN || process.env.ECODRIVE_DEMO_TOKEN || undefined;

let serial = null;
let socket = null;
let reconnectTimer = null;
let lastSentCommand = "";
let lastLedState = "off";
let serialPortName = MOCK_MODE ? "MOCK" : "";

async function main() {
  if (MOCK_MODE) {
    console.log("[Bridge] Running in mock mode. No ESP32 serial port will be opened.");
  } else {
    serialPortName = await findEsp32Port();
    if (!serialPortName) {
      console.error(
        [
          "",
          "[Bridge] No ESP32 serial port found.",
          "1. Plug the ESP32 into USB.",
          "2. Check Device Manager for the COM port.",
          "3. Run: npm run bridge:cloud --workspace @ecodrive/server -- COM5",
          "4. For cloud-only testing, run with ECODRIVE_BRIDGE_MOCK=1."
        ].join("\n")
      );
      process.exit(1);
    }

    serial = await openSerial(serialPortName);
    await delay(1800);
    console.log(`[Bridge] ESP32 serial ready on ${serialPortName} at ${BAUD_RATE} baud.`);
  }

  connectRelay();
}

async function findEsp32Port() {
  if (EXPLICIT_PORT) {
    console.log(`[Bridge] Using explicit serial port: ${EXPLICIT_PORT}`);
    return EXPLICIT_PORT;
  }

  const ports = await SerialPort.list();
  console.log("[Bridge] Available serial ports:");
  for (const port of ports) {
    console.log(`  ${port.path} manufacturer=${port.manufacturer || "?"} vendorId=${port.vendorId || "?"} productId=${port.productId || "?"}`);
  }

  const cp2102 = ports.find(
    (port) =>
      (port.vendorId?.toLowerCase() === "10c4" && port.productId?.toLowerCase() === "ea60") ||
      port.manufacturer?.toLowerCase().includes("silicon") ||
      port.manufacturer?.toLowerCase().includes("cp210")
  );
  if (cp2102) return cp2102.path;

  return ports.find((port) => !port.path.includes("Bluetooth") && port.vendorId)?.path ?? null;
}

function openSerial(path) {
  return new Promise((resolve, reject) => {
    const port = new SerialPort({
      path,
      baudRate: BAUD_RATE,
      autoOpen: false
    });

    port.on("error", (error) => {
      console.error(`[Bridge] Serial error: ${error.message}`);
    });

    port.on("data", (data) => {
      const text = data.toString().trim();
      if (text) console.log(`[ESP32] ${text}`);
    });

    port.open((error) => {
      if (error) reject(error);
      else resolve(port);
    });
  });
}

function connectRelay() {
  const relayUrl = buildRelayWebSocketUrl(RELAY_WS_URL, {
    role: "bridge",
    session: SESSION,
    token: TOKEN
  });

  console.log(`[Bridge] Connecting to relay: ${redactToken(relayUrl)}`);
  socket = new WebSocket(relayUrl);

  socket.on("open", () => {
    console.log("[Bridge] Connected to Cloudflare relay.");
    lastSentCommand = "";
    sendJson({
      type: "client.hello",
      session: SESSION,
      role: "bridge",
      sentAt: Date.now()
    });
    sendHardwareStatus(true);
  });

  socket.on("message", async (raw) => {
    const message = parseEcoDriveMessage(raw.toString());
    if (!message) {
      console.warn("[Bridge] Ignored malformed relay message.");
      return;
    }

    if (message.type === "sim.input") {
      await handleSimulatorInput(message.input);
      return;
    }

    if (message.type === "session.status") {
      console.log(
        `[Bridge] Session ${message.session}: simulator=${message.clients.simulator ?? 0}, dashboard=${message.clients.dashboard ?? 0}, bridge=${message.clients.bridge ?? 0}`
      );
      return;
    }

    if (message.type === "relay.error") {
      console.warn(`[Bridge] Relay error: ${message.code} - ${message.message}`);
    }
  });

  socket.on("close", () => {
    console.warn("[Bridge] Relay disconnected. Reconnecting in 2 seconds...");
    socket = null;
    reconnectTimer = setTimeout(connectRelay, 2000);
  });

  socket.on("error", (error) => {
    console.warn(`[Bridge] Relay socket error: ${error.message}`);
    socket?.close();
  });
}

async function handleSimulatorInput(input) {
  const ledState = ledStateForSimulatorInput(input);
  const command = ledStateToCommand(ledState);

  if (command !== lastSentCommand) {
    await writeSerialCommand(command);
    lastSentCommand = command;
    lastLedState = ledState;
    console.log(`[Bridge] ${ledState.toUpperCase()} -> ESP32 command ${command}`);
    sendHardwareStatus(true);
  }

  const telemetry = createTelemetryFromSimulatorInput(input, {
    deviceId: MOCK_MODE ? "mock-bridge" : "esp32-demo-bridge",
    totalCoinsBase: 1240
  });

  sendJson(createDashboardTelemetryMessage(telemetry, SESSION));
}

function writeSerialCommand(command) {
  if (MOCK_MODE) return Promise.resolve();

  return new Promise((resolve) => {
    if (!serial || !serial.writable) {
      console.warn("[Bridge] Serial port is not writable.");
      resolve();
      return;
    }

    serial.write(command, (error) => {
      if (error) console.error(`[Bridge] Serial write error: ${error.message}`);
      resolve();
    });
  });
}

function sendHardwareStatus(connected) {
  sendJson(
    createBridgeHardwareMessage(
      {
        connected,
        serialPort: serialPortName,
        ledState: connected ? lastLedState : "off",
        lastCommand: lastSentCommand || "X"
      },
      SESSION
    )
  );
}

function sendJson(message) {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify(message));
}

function shutdown() {
  console.log("\n[Bridge] Shutting down.");
  if (reconnectTimer) clearTimeout(reconnectTimer);
  sendHardwareStatus(false);

  Promise.resolve(writeSerialCommand("X")).finally(() => {
    socket?.close();
    serial?.close();
    process.exit(0);
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function redactToken(url) {
  try {
    const nextUrl = new URL(url);
    if (nextUrl.searchParams.has("token")) nextUrl.searchParams.set("token", "***");
    return nextUrl.toString();
  } catch {
    return url;
  }
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

main().catch((error) => {
  console.error("[Bridge] Fatal error:", error);
  process.exit(1);
});
