# Phase 6 Cloudflare Deployment And Testing Guide

This guide starts where the implementation work stops. The code is prepared for public deployment, but Cloudflare account setup, Pages project creation, Worker deployment, secrets, and final public testing need your manual operation.

Official docs used for this setup:

- Cloudflare Workers WebSockets: https://developers.cloudflare.com/workers/runtime-apis/websockets/
- Cloudflare Durable Objects WebSockets: https://developers.cloudflare.com/durable-objects/best-practices/websockets/
- Durable Object migrations: https://developers.cloudflare.com/durable-objects/reference/durable-objects-migrations/
- Static Next.js on Cloudflare Pages: https://developers.cloudflare.com/pages/framework-guides/nextjs/deploy-a-static-nextjs-site/

---

## 1. What Has Been Prepared

The repo now has:

- shared protocol package: `packages/protocol`,
- Cloudflare relay Worker + Durable Object: `apps/relay`,
- cloud USB bridge for ESP32: `apps/server/cloud-bridge.mjs`,
- static-export Dashboard: `apps/dashboard/out` after build,
- static-export Simulator: `apps/simulator/out` after build,
- relay-aware Dashboard WebSocket hook,
- relay-aware Simulator telemetry publisher.

Successful local verification commands:

```powershell
npm run protocol:build
npm run relay:typecheck
npm run dashboard:build
npm run simulator:build
```

Important: because the Dashboard and Simulator are now configured for static export, do not use `npx next start` for the final deployment build. Cloudflare Pages should serve the generated `out` folders.

---

## 2. Cloudflare Relay Deployment

### 2.1 Login To Cloudflare From Your Laptop

From PowerShell:

```powershell
cd C:\EcoDriveNew
npx wrangler login
```

Your browser will open. Login to the Cloudflare account you want to use for the demo.

### 2.2 Optional Demo Token

Choose a short token for the demo session, for example:

```text
beauty_and_the_beast
```

This token is not a high-security secret because it will also be used by public frontend environment variables. Its purpose is mainly to stop random accidental connections.

Set it on the Worker:

```powershell
cd C:\EcoDriveNew\apps\relay
npx wrangler secret put DEMO_TOKEN
```

Paste the token when prompted.

If you do not want a token, skip this step and leave all `NEXT_PUBLIC_ECODRIVE_TOKEN` / `ECODRIVE_TOKEN` values empty.

### 2.3 Deploy The Relay Worker

```powershell
cd C:\EcoDriveNew
npm run relay:deploy
```

After deployment, copy the Worker URL. It should look like:

```text
https://ecodrive-relay.<your-account>.workers.dev
```

Your WebSocket URL will be:

```text
wss://ecodrive-relay.<your-account>.workers.dev/ws
```

Health check:

```text
https://ecodrive-relay.<your-account>.workers.dev/health
```

Expected result:

```json
{"ok":true,"service":"ecodrive-relay"}
```

---

## 3. Dashboard Pages Deployment

### 3.1 Create The Dashboard Pages Project

In Cloudflare Dashboard:

1. Go to **Workers & Pages**.
2. Click **Create application**.
3. Choose **Pages**.
4. Connect your GitHub repo: `Kendrew1119/EcoDrive`.
5. Create a Pages project named:

```text
ecodrive-dashboard
```

Use these build settings:

| Setting | Value |
|---|---|
| Production branch | `main` |
| Build command | `npm run dashboard:build` |
| Build output directory | `apps/dashboard/out` |
| Root directory | `/` |

### 3.2 Dashboard Environment Variables

Add these environment variables in the Pages project settings:

| Variable | Value |
|---|---|
| `NODE_VERSION` | `22` |
| `NEXT_PUBLIC_ECODRIVE_WS_URL` | `wss://ecodrive-relay.<your-account>.workers.dev/ws` |
| `NEXT_PUBLIC_ECODRIVE_SESSION` | `demo-main` |
| `NEXT_PUBLIC_ECODRIVE_TOKEN` | your demo token, or leave blank if no Worker token |

Save and deploy.

After deploy, copy the Dashboard URL:

```text
https://ecodrive-dashboard.pages.dev
```

---

## 4. Simulator Pages Deployment

### 4.1 Create The Simulator Pages Project

In Cloudflare Dashboard:

1. Go to **Workers & Pages**.
2. Click **Create application**.
3. Choose **Pages**.
4. Connect the same GitHub repo.
5. Create a Pages project named:

```text
ecodrive-simulator
```

Use these build settings:

| Setting | Value |
|---|---|
| Production branch | `main` |
| Build command | `npm run simulator:build` |
| Build output directory | `apps/simulator/out` |
| Root directory | `/` |

### 4.2 Simulator Environment Variables

Add these environment variables:

| Variable | Value |
|---|---|
| `NODE_VERSION` | `22` |
| `NEXT_PUBLIC_ECODRIVE_RELAY_WS_URL` | `wss://ecodrive-relay.<your-account>.workers.dev/ws` |
| `NEXT_PUBLIC_ECODRIVE_SESSION` | `demo-main` |
| `NEXT_PUBLIC_ECODRIVE_TOKEN` | your demo token, or leave blank if no Worker token |
| `NEXT_PUBLIC_DASHBOARD_URL` | `https://ecodrive-dashboard.pages.dev` |

Save and deploy.

After deploy, copy the Simulator URL:

```text
https://ecodrive-simulator.pages.dev
```

---

## 5. Cloud-Only Test Before ESP32

Use this first. It proves the public websites and relay work before touching hardware.

### 5.1 Start Mock Bridge

```powershell
cd C:\EcoDriveNew
$env:ECODRIVE_RELAY_WS_URL="wss://ecodrive-relay.<your-account>.workers.dev/ws"
$env:ECODRIVE_SESSION="demo-main"
$env:ECODRIVE_TOKEN="beauty_and_the_beast"
$env:ECODRIVE_BRIDGE_MOCK="1"
npm run bridge:cloud
```

If you did not configure a token, remove the token line:

```powershell
Remove-Item Env:\ECODRIVE_TOKEN -ErrorAction SilentlyContinue
```

### 5.2 Open Public Sites

On presenter laptop:

```text
https://ecodrive-dashboard.pages.dev
```

On judge iPad / second laptop:

```text
https://ecodrive-simulator.pages.dev
```

Drive in the simulator.

Expected result:

- bridge terminal shows session counts,
- simulator console may show relay status,
- dashboard status changes from connecting to live,
- dashboard telemetry updates as you drive.

---

## 6. Real ESP32 Hardware Test

### 6.1 Prepare The ESP32

1. Plug ESP32 into the presenter laptop by USB.
2. Confirm the COM port in Windows Device Manager.
3. Make sure the tested firmware is already flashed:

```text
C:\EcoDriveNew\firmware\src\ecodrive_esp32\ecodrive_esp32.ino
```

### 6.2 Start Real Bridge

Close the mock bridge first. Then run:

```powershell
cd C:\EcoDriveNew
Remove-Item Env:\ECODRIVE_BRIDGE_MOCK -ErrorAction SilentlyContinue
$env:ECODRIVE_RELAY_WS_URL="wss://ecodrive-relay.<your-account>.workers.dev/ws"
$env:ECODRIVE_SESSION="demo-main"
$env:ECODRIVE_TOKEN="beauty_and_the_beast"
npm run bridge:cloud -- COM5
```

Replace `COM5` with your actual ESP32 port.

If you did not configure a token:

```powershell
Remove-Item Env:\ECODRIVE_TOKEN -ErrorAction SilentlyContinue
```

### 6.3 Hardware Expected Behavior

| Simulator action | ESP32 result | Dashboard result |
|---|---|---|
| Idle / ready | Blue/ready style state | Connecting/live status |
| Smooth driving | Green LED | Eco score remains high |
| Fast route / caution | Amber command | Warning/caution telemetry |
| Harsh brake / overspeed | Red LED + buzzer | Warning event appears |
| Disconnect bridge | Hardware off/disconnected | Dashboard shows disconnected/connecting |

---

## 7. Final Demo Startup Checklist

Use this order during judging:

1. Connect laptop to stable internet.
2. Plug ESP32 into USB.
3. Start bridge:

```powershell
cd C:\EcoDriveNew
$env:ECODRIVE_RELAY_WS_URL="wss://ecodrive-relay.<your-account>.workers.dev/ws"
$env:ECODRIVE_SESSION="demo-main"
$env:ECODRIVE_TOKEN="beauty_and_the_beast"
npm run bridge:cloud -- COM5
```

4. Open public Dashboard on presenter laptop.
5. Open public Simulator on judge iPad or second laptop.
6. Drive once smoothly.
7. Brake harshly once.
8. Show Dashboard and ESP32 reacting together.

---

## 8. Troubleshooting

### Dashboard Stuck On Connecting

Likely causes:

- bridge is not running,
- token mismatch,
- Dashboard Pages env vars were changed but not redeployed,
- wrong relay URL.

Check:

```text
https://ecodrive-relay.<your-account>.workers.dev/health
```

### Simulator Shows Bridge Unavailable

The relay is live, but the bridge role is not connected.

Start:

```powershell
npm run bridge:cloud -- COM5
```

### ESP32 Does Not React

Check:

- correct COM port,
- ESP32 firmware flashed,
- bridge terminal prints `[ESP32] EcoDrive+ ESP32 ready`,
- no other serial monitor is using the same COM port.

### In-Car Dashboard Screen Is Blank

The simulator was built without `NEXT_PUBLIC_DASHBOARD_URL`.

Fix:

1. Add/update `NEXT_PUBLIC_DASHBOARD_URL` in the Simulator Pages project.
2. Redeploy Simulator.

### 401 Or Invalid Token

The Worker `DEMO_TOKEN` and the frontend/bridge token do not match.

Fix one of these:

- update Worker secret with `npx wrangler secret put DEMO_TOKEN`,
- update Pages env vars and redeploy,
- update PowerShell `$env:ECODRIVE_TOKEN`.

### Pages Build Fails

Check these settings:

| Setting | Dashboard | Simulator |
|---|---|---|
| Build command | `npm run dashboard:build` | `npm run simulator:build` |
| Output directory | `apps/dashboard/out` | `apps/simulator/out` |
| Root directory | `/` | `/` |
| `NODE_VERSION` | `22` | `22` |

---

## 9. What To Tell Judges

The honest technical explanation:

> The simulator and dashboard are deployed public websites. They join the same Cloudflare WebSocket session. A Durable Object keeps the live session state. The laptop bridge connects that cloud session to the ESP32 over USB serial, so the ESP32 still acts as the visible hardware feedback brain. The Dashboard only updates from telemetry coming back through the relay path.

