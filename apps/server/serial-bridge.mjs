/**
 * EcoDrive+ Serial Bridge
 * ─────────────────────────────────────────────────────────────────
 * Bridges the simulator (WebSocket on ws://localhost:3200) to the
 * ESP32 (USB serial).
 *
 * The simulator sends JSON messages like:
 *   { "type": "ledState", "state": "green" }
 *
 * This bridge maps the state to a single character and writes it
 * to the ESP32's serial port.
 *
 * Usage:
 *   1. npm install serialport ws    (one-time)
 *   2. node serial-bridge.mjs       (or: node serial-bridge.mjs COM5)
 *
 * The COM port can be passed as a CLI argument or auto-detected.
 */

import { SerialPort } from "serialport";
import { WebSocketServer } from "ws";

// ── Configuration ────────────────────────────────────────────────
const BAUD_RATE = 115200;
const WS_PORT = 3200;
const EXPLICIT_PORT = process.argv[2] || null; // e.g. "COM5"

// ── LED state → serial command mapping ───────────────────────────
const STATE_TO_COMMAND = {
  green: "G",
  red: "R",
  amber: "A",
  blue: "B",
  off: "X",
};

// ── Auto-detect ESP32 COM port ───────────────────────────────────
async function findEsp32Port() {
  if (EXPLICIT_PORT) {
    console.log(`Using explicit port: ${EXPLICIT_PORT}`);
    return EXPLICIT_PORT;
  }

  const ports = await SerialPort.list();
  console.log("\nAvailable serial ports:");
  ports.forEach((p) => {
    console.log(
      `  ${p.path}  manufacturer=${p.manufacturer || "?"}  vendorId=${p.vendorId || "?"}  productId=${p.productId || "?"}`
    );
  });

  // Look for Silicon Labs CP2102 (vendorId 10C4, productId EA60)
  const cp2102 = ports.find(
    (p) =>
      (p.vendorId?.toLowerCase() === "10c4" &&
        p.productId?.toLowerCase() === "ea60") ||
      (p.manufacturer && p.manufacturer.toLowerCase().includes("silicon")) ||
      (p.manufacturer && p.manufacturer.toLowerCase().includes("cp210"))
  );

  if (cp2102) {
    console.log(`\nAuto-detected ESP32 on: ${cp2102.path}`);
    return cp2102.path;
  }

  // Fallback: try the first non-Bluetooth COM port
  const fallback = ports.find(
    (p) => !p.path.includes("Bluetooth") && p.vendorId
  );
  if (fallback) {
    console.log(
      `\nCP2102 not found specifically; falling back to: ${fallback.path}`
    );
    return fallback.path;
  }

  return null;
}

// ── Main ─────────────────────────────────────────────────────────
async function main() {
  const comPort = await findEsp32Port();

  if (!comPort) {
    console.error(
      "\n❌ No ESP32 serial port found!\n" +
        "   1. Make sure the ESP32 is plugged in via USB\n" +
        "   2. Install the CP2102 driver: https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers\n" +
        "   3. Or specify the port manually:  node serial-bridge.mjs COM5\n"
    );
    process.exit(1);
  }

  // ── Open serial port ──────────────────────────────────────────
  const serial = new SerialPort({
    path: comPort,
    baudRate: BAUD_RATE,
    autoOpen: false,
  });

  serial.on("error", (err) => {
    console.error(`Serial error: ${err.message}`);
  });

  serial.on("data", (data) => {
    // Log anything the ESP32 sends back (debug output)
    const text = data.toString().trim();
    if (text) console.log(`  [ESP32] ${text}`);
  });

  await new Promise((resolve, reject) => {
    serial.open((err) => {
      if (err) {
        console.error(`❌ Failed to open ${comPort}: ${err.message}`);
        reject(err);
      } else {
        console.log(`✅ Serial port ${comPort} opened at ${BAUD_RATE} baud`);
        resolve();
      }
    });
  });

  // Give ESP32 time to reset after serial connection
  await new Promise((r) => setTimeout(r, 2000));

  // ── WebSocket server ──────────────────────────────────────────
  const wss = new WebSocketServer({ port: WS_PORT });
  let lastSentCommand = "";
  let clientCount = 0;

  console.log(`✅ WebSocket server listening on ws://localhost:${WS_PORT}`);
  console.log(`\nBridge is running. Waiting for simulator connection...\n`);

  wss.on("connection", (ws, req) => {
    clientCount++;
    console.log(
      `🔗 Simulator connected (${clientCount} client${clientCount > 1 ? "s" : ""})`
    );

    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());

        if (msg.type === "ledState" && msg.state) {
          const command = STATE_TO_COMMAND[msg.state] || "X";

          // Only send if the state actually changed (avoid flooding serial)
          if (command !== lastSentCommand) {
            serial.write(command, (err) => {
              if (err) {
                console.error(`Serial write error: ${err.message}`);
              }
            });
            lastSentCommand = command;

            const label =
              msg.state === "green"
                ? "🟢 GREEN (smooth)"
                : msg.state === "red"
                  ? "🔴 RED (harsh!)"
                  : msg.state === "amber"
                    ? "🟡 AMBER (caution)"
                    : msg.state === "blue"
                      ? "🔵 BLUE (launch)"
                      : "⬛ OFF";
            console.log(`  → ${label}`);
          }
        }
      } catch {
        // Ignore non-JSON or malformed messages
      }
    });

    ws.on("close", () => {
      clientCount--;
      console.log(
        `🔌 Simulator disconnected (${clientCount} client${clientCount !== 1 ? "s" : ""} remaining)`
      );

      // Turn everything off when simulator disconnects
      if (clientCount === 0) {
        serial.write("X");
        lastSentCommand = "X";
        console.log("  → All outputs OFF (no clients)");
      }
    });

    // Send acknowledgment to simulator
    ws.send(JSON.stringify({ type: "bridge:connected", port: comPort }));
  });

  // ── Graceful shutdown ─────────────────────────────────────────
  const shutdown = () => {
    console.log("\nShutting down...");
    serial.write("X"); // Turn everything off
    setTimeout(() => {
      serial.close();
      wss.close();
      process.exit(0);
    }, 300);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
