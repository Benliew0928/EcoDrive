# EcoDrive+ Public Demo Deployment Plan

This document replaces the old local-hotspot demo assumption in `plan.md` Step 11 with the real public demonstration approach:

- public Simulator website for the judge device,
- public Dashboard website for the presenter laptop,
- Cloudflare Worker + Durable Object as the live relay,
- presenter laptop as the USB bridge to the ESP32,
- ESP32 remains the visible hardware brain that drives LEDs and buzzer.

The goal is not to guess localhost ports. The goal is one shared live cloud session that every device can join.

---

## 1. Requirement Summary

### Real Demo Requirement

The final demo should work like this:

1. The judge opens the Simulator on an iPad, tablet, or another laptop using a public URL.
2. The presenter laptop opens the Dashboard using a public URL.
3. The ESP32 is plugged into the presenter laptop by USB.
4. The presenter laptop runs a small bridge process that connects the USB ESP32 to the cloud relay.
5. Simulator input travels through the relay to the bridge and then to the ESP32.
6. ESP32 hardware feedback is visible on the table.
7. Processed state/telemetry travels back through the relay to the public Dashboard.
8. The Dashboard updates live in front of the judges.

### New Architecture

```text
Judge device
Public Simulator site
        |
        | wss://
        v
Cloudflare Worker + Durable Object session relay
        |
        | wss:// outbound
        v
Presenter laptop bridge
        |
        | USB serial
        v
ESP32 hardware
        |
        | USB serial status/debug
        v
Presenter laptop bridge
        |
        | wss://
        v
Cloudflare relay
        |
        v
Public Dashboard site
```

### Why This Replaces The Old Approach

The old `plan.md` Step 11 assumed:

- local WiFi hotspot,
- local laptop WebSocket server,
- ESP32 WiFi/WebSocket client firmware,
- browser-to-ESP32 communication on the same network.

That is not enough for the clarified demo, because the judge device and Dashboard need to work from public deployed websites. The new approach keeps the ESP32 in the loop but moves the session coordination to Cloudflare.

---

## 2. Current Progress Audit

### What Already Exists

| Area | Current status | Evidence | Meaning |
|---|---:|---|---|
| Dashboard app | Mostly built | `apps/dashboard` | Public UI already exists and has a runtime hook for WebSocket telemetry. |
| Simulator app | Mostly built | `apps/simulator` | First-person driving UI exists with keyboard, touch, and controller support. |
| Embedded car dashboard | Built locally | `apps/simulator/components/simulator-game.tsx` | Simulator can embed Dashboard UI, but URL handling must be changed for deployed URLs. |
| Dashboard telemetry store | Built | `apps/dashboard/lib/dashboard-store.ts` | Can receive and display telemetry packets. |
| Dashboard WebSocket hook | Partially built | `apps/dashboard/hooks/use-dashboard-runtime.ts` | Already reads `NEXT_PUBLIC_ECODRIVE_WS_URL`, but message protocol should be aligned with the cloud relay. |
| ESP32 hardware firmware | Tested functional, serial-based | `firmware/src/ecodrive_esp32/ecodrive_esp32.ino` | Firmware accepts single-character serial commands: `G`, `R`, `A`, `B`, `X`. |
| Local serial bridge | Built | `apps/server/serial-bridge.mjs` | Connects WebSocket input to ESP32 USB serial, but currently hosts local `ws://localhost:3200`. |
| Cloud relay | Built, not deployed | `apps/relay` | Cloudflare Worker + Durable Object relay is implemented and typechecked. |
| Public deploy config | Built, manual Cloudflare setup pending | `apps/dashboard/next.config.mjs`, `apps/simulator/next.config.mjs` | Dashboard and Simulator now static-export to `out` folders for Cloudflare Pages. |
| Shared protocol package | Built | `packages/protocol` | Source of truth for relay roles, messages, parsers, LED commands, and telemetry helpers. |

### Key Correction

The firmware is not currently a WiFi WebSocket firmware. It is a stable USB serial firmware. Therefore the safest demo path is:

```text
Cloud relay <-> laptop bridge <-> ESP32 serial firmware
```

This avoids rewriting working ESP32 hardware code before the demo.

---

## 3. Target Components

### 3.1 Public Simulator

Responsibility:

- render the driving game,
- collect keyboard, touch, and controller inputs,
- send simulator input packets to the relay,
- receive optional session/connection status from relay,
- embed the deployed Dashboard URL inside the in-car dashboard screen.

Required environment variables:

```bash
NEXT_PUBLIC_ECODRIVE_RELAY_WS_URL=wss://ecodrive-relay.<domain>/ws
NEXT_PUBLIC_DASHBOARD_URL=https://ecodrive-dashboard.<domain>
NEXT_PUBLIC_ECODRIVE_SESSION=demo-main
```

### 3.2 Public Dashboard

Responsibility:

- connect to the same relay session,
- receive processed telemetry/state packets,
- update Drive, Route, City, Rewards, and Social screens,
- show connection state clearly.

Required environment variables:

```bash
NEXT_PUBLIC_ECODRIVE_WS_URL=wss://ecodrive-relay.<domain>/ws?session=demo-main&role=dashboard
```

### 3.3 Cloudflare Relay

Responsibility:

- accept WebSocket connections from simulator, dashboard, and bridge,
- group connections by `session`,
- validate `role` and optional demo token,
- forward simulator input to the bridge,
- forward bridge/ESP32 telemetry to dashboards and simulator,
- keep last known telemetry for late-joining dashboards.

Recommended stack:

- Cloudflare Worker for the public WebSocket endpoint,
- Durable Object for one live session room,
- Wrangler for deploy.

Why Durable Object:

- one session needs one coordination point,
- multiple clients must share state,
- WebSockets are long-lived,
- hibernation can reduce cost while keeping connections alive.

Reference docs:

- Cloudflare Workers WebSockets: https://developers.cloudflare.com/workers/runtime-apis/websockets/
- Durable Objects WebSockets: https://developers.cloudflare.com/durable-objects/best-practices/websockets/
- Next.js on Cloudflare Workers/OpenNext: https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/
- Static Next.js on Cloudflare Pages: https://developers.cloudflare.com/pages/framework-guides/nextjs/

### 3.4 Laptop Bridge

Responsibility:

- connect outward to the Cloudflare relay using `wss://`,
- connect to ESP32 over USB serial,
- map simulator behavior to ESP32 commands,
- forward hardware state/telemetry back to the relay,
- keep the ESP32 alive even though the websites are public.

This evolves the existing `apps/server/serial-bridge.mjs`.

Current local behavior:

```text
Simulator -> ws://localhost:3200 -> serial bridge -> ESP32
```

Required public behavior:

```text
Cloudflare relay -> laptop bridge -> USB serial -> ESP32
Laptop bridge -> Cloudflare relay -> Dashboard
```

### 3.5 ESP32 Firmware

Current protocol:

| Command | Meaning |
|---|---|
| `G` | Smooth driving, green LED on |
| `R` | Harsh warning, red LED + buzzer |
| `A` | Caution, short beep |
| `B` | Launch/ready, green blink |
| `X` | All outputs off |

The current firmware can stay as-is for the first public demo. Later, WiFi/WebSocket firmware can be added as an upgrade, but it is not required to achieve the clarified demo.

---

## 4. Protocol Design

Create shared protocol types in `packages/protocol`.

### Connection URL

```text
wss://ecodrive-relay.<domain>/ws?session=demo-main&role=simulator
wss://ecodrive-relay.<domain>/ws?session=demo-main&role=dashboard
wss://ecodrive-relay.<domain>/ws?session=demo-main&role=bridge
```

Optional token:

```text
&token=beauty_and_the_beast
```

### Simulator Input Packet

Sent from Simulator to relay, then relay to bridge.

```json
{
  "type": "sim.input",
  "session": "demo-main",
  "sentAt": 1783075200000,
  "input": {
    "throttle": 0.72,
    "brake": 0,
    "steering": -0.18,
    "speedKmh": 42,
    "routeChoice": "eco",
    "event": "smooth_streak"
  }
}
```

### Bridge Hardware Command Result

Sent from bridge to relay after it writes to ESP32.

```json
{
  "type": "bridge.hardware",
  "session": "demo-main",
  "sentAt": 1783075200000,
  "hardware": {
    "connected": true,
    "serialPort": "COM5",
    "ledState": "green",
    "lastCommand": "G"
  }
}
```

### Dashboard Telemetry Packet

Sent from bridge or relay to Dashboard.

```json
{
  "type": "dashboard.telemetry",
  "session": "demo-main",
  "sentAt": 1783075200000,
  "telemetry": {
    "deviceId": "esp32-demo-01",
    "ecoScore": 86,
    "speedKmh": 42,
    "event": "smooth",
    "ledState": "green",
    "throttle": 0.72,
    "brake": 0,
    "steering": -0.18,
    "coinsEarned": 12,
    "totalCoins": 1283,
    "energyKwh": 0.14,
    "co2SavedKg": 0.09,
    "timestamp": 1783075200000
  }
}
```

### Status Packet

Broadcast when a role connects/disconnects.

```json
{
  "type": "session.status",
  "session": "demo-main",
  "sentAt": 1783075200000,
  "clients": {
    "simulator": 1,
    "dashboard": 2,
    "bridge": 1
  }
}
```

---

## 5. Phase Tracker

### Phase 0: Freeze The Correct Architecture

| Task | Status | Notes |
|---|---:|---|
| Identify old local-only assumption | Done | Old Step 11 depends on local hotspot and local WebSocket server. |
| Confirm current ESP32 firmware style | Done | Firmware is serial command based. |
| Confirm existing bridge role | Done | Local serial bridge exists and can be upgraded. |
| Choose public relay architecture | Done | Cloudflare Worker + Durable Object + laptop USB bridge. |
| Create this replacement plan | Done | This document is the new source for deployment work. |

Exit criteria:

- Everyone agrees the demo path is public websites + cloud relay + laptop USB bridge.

### Phase 1: Shared Protocol Package

| Task | Status | Notes |
|---|---:|---|
| Add TypeScript packet types | Done | Implemented in `packages/protocol/src/index.ts`. |
| Add validators/parsers | Done | `parseEcoDriveMessage`, `parseSimulatorInput`, and `parseTelemetry`. |
| Add LED mapping helper | Done | `ledStateForSimulatorInput` and `ledStateToCommand`. |
| Use protocol package in simulator | Done | Simulator publishes `sim.input` packets through the protocol package. |
| Use protocol package in dashboard | Done | Dashboard parses `dashboard.telemetry`, `bridge.hardware`, and `session.status`. |
| Use protocol package in bridge | Done | Cloud bridge imports protocol helpers and message builders. |

Exit criteria:

- Simulator, dashboard, relay, and bridge use the same message names and payload shapes.

### Phase 2: Cloudflare Relay

| Task | Status | Notes |
|---|---:|---|
| Create `apps/relay` Worker project | Done | Wrangler project added. |
| Add Durable Object class for sessions | Done | `EcoDriveSession` groups clients by session. |
| Accept WebSocket upgrades at `/ws` | Done | Worker validates `session`, `role`, and optional token. |
| Track client roles | Done | Counts simulator, dashboard, and bridge clients. |
| Forward `sim.input` to bridge | Done | Simulator input is only forwarded to bridge clients. |
| Forward `dashboard.telemetry` to dashboards | Done | Bridge telemetry broadcasts to dashboards and simulator. |
| Store last telemetry snapshot | Done | New dashboard clients receive latest telemetry. |
| Add heartbeat/ping handling | Done | `heartbeat` packets are echoed. |
| Add simple demo token | Done | Optional `DEMO_TOKEN` Worker secret is supported. Demo value: `beauty_and_the_beast`. |
| Test locally with `wrangler dev` | Not run | Typecheck passes; full session test is part of Phase 6 guide. |

Exit criteria:

- Three browser/client connections can join one session and receive correct forwarded packets.

### Phase 3: Laptop Bridge Upgrade

| Task | Status | Notes |
|---|---:|---|
| Convert bridge from local WS server to cloud WS client | Done | Added `apps/server/cloud-bridge.mjs`. |
| Keep serial auto-detection | Built, needs reuse | Current bridge detects CP2102/COM port. |
| Receive `sim.input` from relay | Done | Bridge handles relay `sim.input` packets. |
| Write `G/R/A/B/X` to ESP32 | Done | Reuses serial command mapping through protocol helper. |
| Send `bridge.hardware` status | Done | Bridge reports connected, serial port, LED state, and command. |
| Send `dashboard.telemetry` packets | Done | Bridge creates telemetry from simulator input and broadcasts through relay. |
| Add reconnect logic | Done | Bridge reconnects to relay after disconnect. |
| Add CLI/env config | Done | Supports relay URL, session, token, mock mode, and optional COM port. |
| Add bridge start script | Done | `npm run bridge:cloud -- COM5`. |

Exit criteria:

- With ESP32 plugged into the presenter laptop, simulator input from a public URL changes the physical LEDs/buzzer.

### Phase 4: Simulator Public Relay Integration

| Task | Status | Notes |
|---|---:|---|
| Remove localhost relay dependency | Done | Simulator no longer connects to `ws://localhost:3200`. |
| Add relay connection hook | Done | Connects to `NEXT_PUBLIC_ECODRIVE_RELAY_WS_URL`. |
| Send `sim.input` every 100-200ms | Done | Sends every 160ms. |
| Show connection status | Partial | Logs relay status; visual polish can be added after deployment test. |
| Set dashboard iframe to deployed URL | Done | Uses `NEXT_PUBLIC_DASHBOARD_URL`; no port guessing. |
| Preserve fixed Drive page for car display | Built locally | Keep iframe on Dashboard Drive page unless user taps internal nav. |
| Support iPad touch controls | Built | Current design supports touch. |
| Support keyboard/controller | Built | Current design supports PC/controller. |

Exit criteria:

- A public simulator URL can drive relay packets without requiring same WiFi or localhost.

### Phase 5: Dashboard Public Relay Integration

| Task | Status | Notes |
|---|---:|---|
| Connect to relay by env var | Done | Uses `NEXT_PUBLIC_ECODRIVE_WS_URL`, session, role, and optional token. |
| Parse `dashboard.telemetry` wrapper | Done | Dashboard runtime parses relay protocol packets. |
| Show relay role status | Partial | Main live pill reflects bridge connection; detailed counts can be added later. |
| Keep iframe `postMessage` support | Built | Useful for embedded in-car dashboard. |
| Make public Dashboard default to Drive page | Built | Root page is currently cockpit/drive view. |
| Validate all dashboard pages with live telemetry | Not started | Drive, Route, City, Rewards, Social. |

Exit criteria:

- Public Dashboard updates live from Cloudflare relay while simulator is on a separate public device.

### Phase 6: Deployment

| Task | Status | Notes |
|---|---:|---|
| Decide static Pages vs OpenNext Workers for apps | Not started | Current apps look mostly client-side, but verify build/export first. |
| Add Cloudflare config for Dashboard | Not started | Pages or Workers project. |
| Add Cloudflare config for Simulator | Not started | Pages or Workers project. |
| Add Cloudflare config for Relay | Not started | Wrangler + Durable Object binding. |
| Add production env vars | Not started | Relay URL, Dashboard URL, session, token. |
| Deploy relay first | Not started | Needed before app env vars are final. |
| Deploy dashboard | Not started | Public presenter URL. |
| Deploy simulator | Not started | Public judge URL. |
| Test public URLs from separate devices | Not started | Use phone/iPad on different network if possible. |

Exit criteria:

- Public simulator and public dashboard can communicate through the deployed relay.

### Phase 7: Full Hardware Demo Test

| Task | Status | Notes |
|---|---:|---|
| Plug ESP32 into presenter laptop | Manual | Confirm COM port. |
| Start cloud bridge | Not started | Bridge must connect to relay and serial. |
| Open public Dashboard on presenter laptop | Manual | Confirm dashboard role connected. |
| Open public Simulator on judge device | Manual | Confirm simulator role connected. |
| Drive smoothly | Not tested | Expect green LED and Dashboard eco score rise. |
| Brake harshly | Not tested | Expect red LED/buzzer and Dashboard event. |
| Disconnect simulator | Not tested | Bridge should turn ESP32 off or idle. |
| Reload Dashboard | Not tested | Dashboard should receive last telemetry snapshot. |
| Test poor WiFi recovery | Not tested | Reconnect logic should restore session. |

Exit criteria:

- End-to-end live loop works for at least 10 minutes without manual refresh.

### Phase 8: Pitch Hardening

| Task | Status | Notes |
|---|---:|---|
| Add QR/session link for judge device | Not started | Fast setup during judging. |
| Add fallback software mode | Planned | If ESP32 fails, relay can still generate demo telemetry. |
| Add bridge health indicator | Not started | Dashboard should clearly show ESP32 connected. |
| Add rehearsal checklist | Not started | Power, USB cable, browser URLs, COM port, WiFi. |
| Add one-command startup for bridge | Not started | Reduce demo stress. |
| Add short architecture explanation slide/script | Not started | Explain public sites + cloud relay + hardware brain. |

Exit criteria:

- Demo can be started repeatedly from a clean laptop boot with simple commands.

---

## 6. Implementation Order

Use this order to avoid breaking the demo while building:

1. Build `packages/protocol` message types and helpers.
2. Build Cloudflare relay locally with mocked clients.
3. Upgrade bridge to connect to relay while still using existing serial firmware.
4. Connect Dashboard to the relay telemetry wrapper.
5. Connect Simulator to send `sim.input` to relay.
6. Deploy relay.
7. Deploy Dashboard and Simulator.
8. Test public cloud loop without ESP32.
9. Test public cloud loop with ESP32 over USB bridge.
10. Add QR/session polish and fallback mode.

---

## 7. Suggested Commands After Implementation

The main scripts are now added. Use `docs/phase6-cloudflare-deployment-guide.md` for Cloudflare website setup and public testing.

### Local Relay Preview

```bash
npm --workspace @ecodrive/relay run dev
```

### Cloud Bridge

```bash
set ECODRIVE_RELAY_WS_URL=wss://ecodrive-relay.<domain>/ws
set ECODRIVE_SESSION=demo-main
set ECODRIVE_ROLE=bridge
node apps/server/cloud-bridge.mjs COM5
```

### Deploy Relay

```bash
npm --workspace @ecodrive/relay run deploy
```

### Deploy Dashboard

```bash
npm --workspace @ecodrive/dashboard run build
```

### Deploy Simulator

```bash
npm --workspace @ecodrive/simulator run build
```

Final deploy commands depend on whether the two Next.js apps are deployed as static Cloudflare Pages sites or as OpenNext Cloudflare Workers.

---

## 8. Demo Readiness Definition

The project is ready for the public hardware demo when all of these are true:

- Public Simulator URL opens on an iPad or second laptop.
- Public Dashboard URL opens on the presenter laptop.
- Both join the same `demo-main` session.
- Laptop bridge connects to Cloudflare relay and ESP32 serial.
- Simulator input changes ESP32 LEDs/buzzer within roughly one second.
- Dashboard receives live telemetry without being on localhost.
- Dashboard remains live after refresh.
- If the ESP32 or bridge disconnects, Dashboard shows a clear disconnected state.
- A fallback software telemetry mode exists for emergencies.

---

## 9. Replacement Note For Original `plan.md`

Original Step 11 should now be interpreted as:

> Build a public real-time relay and deployed websites. The simulator sends live driving input to Cloudflare. A laptop bridge connected to the ESP32 by USB receives those inputs, drives the tested ESP32 firmware, and sends telemetry back through Cloudflare. The public Dashboard subscribes to the same session and updates live.

This preserves the original pitch claim:

```text
Simulator -> ESP32 hardware brain -> Dashboard
```

But changes the transport from:

```text
local WiFi + localhost WebSocket server
```

to:

```text
public Cloudflare WebSocket relay + laptop USB bridge
```
