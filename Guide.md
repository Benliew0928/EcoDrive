# EcoDrive+ Team Guide

This guide is for Ben and teammates to set up, run, deploy, and test EcoDrive+ from a fresh PC.

Active repo:

```text
https://github.com/Benliew0928/EcoDrive
```

Active local folder used by Ben:

```text
C:\EcoDriveNew
```

Demo token:

```text
beauty_and_the_beast
```

The token is a lightweight demo session password. It is not a private production secret because it is also used by public frontend env vars.

---

## 1. What The Project Contains

```text
apps/dashboard    Public dashboard website
apps/simulator    Public first-person EV simulator game
apps/relay        Cloudflare Worker + Durable Object WebSocket relay
apps/server       Laptop bridge that connects Cloudflare relay to ESP32 over USB serial
packages/protocol Shared message types and helpers
firmware          ESP32 Arduino firmware
docs              Detailed planning/deployment documents
```

Final demo flow:

```text
iPad / judge laptop Simulator
        |
        | Cloudflare WebSocket
        v
Cloudflare relay Worker + Durable Object
        |
        | Cloud WebSocket
        v
Presenter laptop bridge
        |
        | USB serial
        v
ESP32 LEDs / buzzer
        |
        | bridge telemetry back to cloud
        v
Public Dashboard on presenter laptop
```

---

## 2. Fresh PC Setup

Install these first:

- Git
- Node.js 22 LTS or newer
- Chrome or Edge
- Cloudflare Wrangler through `npx`, no global install required
- ESP32 USB driver if Windows does not detect the board, usually CP2102 or CH340

Clone the repo:

```powershell
cd C:\
mkdir EcoDriveNew
cd C:\EcoDriveNew
git clone https://github.com/Benliew0928/EcoDrive .
```

Install dependencies:

```powershell
cd C:\EcoDriveNew
npm install
```

If you see:

```text
'tsc' is not recognized
```

run:

```powershell
npm install
```

That error means `node_modules` is missing.

---

## 3. Important Commands

Run these from the repo root:

```powershell
cd C:\EcoDriveNew
```

Build shared protocol:

```powershell
npm run protocol:build
```

Build dashboard:

```powershell
npm run dashboard:build
```

Build simulator:

```powershell
npm run simulator:build
```

Check relay TypeScript:

```powershell
npm run relay:typecheck
```

Deploy relay:

```powershell
npm run relay:deploy
```

Start cloud bridge:

```powershell
npm run bridge:cloud -- COM5
```

Replace `COM5` with the actual ESP32 COM port.

---

## 4. Local Development

Use local development when editing UI.

Terminal 1, dashboard:

```powershell
cd C:\EcoDriveNew
npm run dashboard:dev
```

Terminal 2, simulator:

```powershell
cd C:\EcoDriveNew
npm run simulator:dev
```

Next.js will print local URLs. Usually:

```text
http://localhost:3000
http://localhost:3001
```

Do not depend on these ports for the real demo. The real demo uses public Cloudflare URLs.

---

## 5. Environment Variables

Cloudflare relay URL format:

```text
wss://ecodrive-relay.<your-account>.workers.dev/ws
```

Example after relay deploy:

```text
wss://ecodrive-relay.benliew0928.workers.dev/ws
```

Dashboard env vars:

```text
NEXT_PUBLIC_ECODRIVE_WS_URL=wss://ecodrive-relay.<your-account>.workers.dev/ws
NEXT_PUBLIC_ECODRIVE_SESSION=demo-main
NEXT_PUBLIC_ECODRIVE_TOKEN=beauty_and_the_beast
```

Simulator env vars:

```text
NEXT_PUBLIC_ECODRIVE_RELAY_WS_URL=wss://ecodrive-relay.<your-account>.workers.dev/ws
NEXT_PUBLIC_ECODRIVE_SESSION=demo-main
NEXT_PUBLIC_ECODRIVE_TOKEN=beauty_and_the_beast
NEXT_PUBLIC_DASHBOARD_URL=https://ecodrive-dashboard.pages.dev
```

Bridge env vars:

```powershell
$env:ECODRIVE_RELAY_WS_URL="wss://ecodrive-relay.<your-account>.workers.dev/ws"
$env:ECODRIVE_SESSION="demo-main"
$env:ECODRIVE_TOKEN="beauty_and_the_beast"
```

Worker secret:

```text
Secret name:  DEMO_TOKEN
Secret value: beauty_and_the_beast
```

Do not accidentally create a secret named `beauty_and_the_beast`. The name must be `DEMO_TOKEN`.

---

## 6. Cloudflare Relay Setup

Login:

```powershell
cd C:\EcoDriveNew
npx wrangler login
```

Set Worker secret:

```powershell
cd C:\EcoDriveNew\apps\relay
npx wrangler secret put DEMO_TOKEN
```

When prompted, enter:

```text
beauty_and_the_beast
```

Deploy relay:

```powershell
cd C:\EcoDriveNew
npm run relay:deploy
```

After deploy, Wrangler prints a URL like:

```text
https://ecodrive-relay.<your-account>.workers.dev
```

Health check:

```text
https://ecodrive-relay.<your-account>.workers.dev/health
```

Expected:

```json
{"ok":true,"service":"ecodrive-relay"}
```

The WebSocket URL is:

```text
wss://ecodrive-relay.<your-account>.workers.dev/ws
```

---

## 7. Cloudflare Pages Setup

Create two Cloudflare Pages projects from the GitHub repo.

### Dashboard Pages Project

Project name:

```text
ecodrive-dashboard
```

Build settings:

| Setting | Value |
|---|---|
| Build command | `npm run dashboard:build` |
| Output directory | `apps/dashboard/out` |
| Root directory | `/` |
| Production branch | `main` |

Environment variables:

| Variable | Value |
|---|---|
| `NODE_VERSION` | `22` |
| `NEXT_PUBLIC_ECODRIVE_WS_URL` | `wss://ecodrive-relay.<your-account>.workers.dev/ws` |
| `NEXT_PUBLIC_ECODRIVE_SESSION` | `demo-main` |
| `NEXT_PUBLIC_ECODRIVE_TOKEN` | `beauty_and_the_beast` |

### Simulator Pages Project

Project name:

```text
ecodrive-simulator
```

Build settings:

| Setting | Value |
|---|---|
| Build command | `npm run simulator:build` |
| Output directory | `apps/simulator/out` |
| Root directory | `/` |
| Production branch | `main` |

Environment variables:

| Variable | Value |
|---|---|
| `NODE_VERSION` | `22` |
| `NEXT_PUBLIC_ECODRIVE_RELAY_WS_URL` | `wss://ecodrive-relay.<your-account>.workers.dev/ws` |
| `NEXT_PUBLIC_ECODRIVE_SESSION` | `demo-main` |
| `NEXT_PUBLIC_ECODRIVE_TOKEN` | `beauty_and_the_beast` |
| `NEXT_PUBLIC_DASHBOARD_URL` | `https://ecodrive-dashboard.pages.dev` |

If your Pages URL is different, use the real Dashboard Pages URL.

---

## 8. Testing Without ESP32

This proves cloud relay, simulator, and dashboard work before hardware.

Start mock bridge:

```powershell
cd C:\EcoDriveNew
$env:ECODRIVE_RELAY_WS_URL="wss://ecodrive-relay.<your-account>.workers.dev/ws"
$env:ECODRIVE_SESSION="demo-main"
$env:ECODRIVE_TOKEN="beauty_and_the_beast"
$env:ECODRIVE_BRIDGE_MOCK="1"
npm run bridge:cloud
```

Open dashboard on presenter laptop:

```text
https://ecodrive-dashboard.pages.dev
```

Open simulator on iPad or another laptop:

```text
https://ecodrive-simulator.pages.dev
```

Expected:

- bridge terminal shows connected clients,
- Dashboard status becomes live,
- driving in Simulator updates Dashboard telemetry,
- harsh brake/aggressive acceleration events appear when driving roughly.

Stop mock bridge with `Ctrl+C`.

Clear mock mode before real hardware:

```powershell
Remove-Item Env:\ECODRIVE_BRIDGE_MOCK -ErrorAction SilentlyContinue
```

---

## 9. Testing With ESP32

Flash or confirm this firmware is on the board:

```text
C:\EcoDriveNew\firmware\src\ecodrive_esp32\ecodrive_esp32.ino
```

Plug ESP32 into USB.

Find COM port:

1. Open Windows Device Manager.
2. Check **Ports (COM & LPT)**.
3. Look for CP210x, CH340, USB Serial, or similar.
4. Note the COM number, for example `COM5`.

Start bridge:

```powershell
cd C:\EcoDriveNew
Remove-Item Env:\ECODRIVE_BRIDGE_MOCK -ErrorAction SilentlyContinue
$env:ECODRIVE_RELAY_WS_URL="wss://ecodrive-relay.<your-account>.workers.dev/ws"
$env:ECODRIVE_SESSION="demo-main"
$env:ECODRIVE_TOKEN="beauty_and_the_beast"
npm run bridge:cloud -- COM5
```

Expected terminal output:

```text
[Bridge] ESP32 serial ready on COM5
[Bridge] Connected to Cloudflare relay.
```

Expected hardware behavior:

| Simulator action | ESP32 |
|---|---|
| idle / ready | blue/ready command |
| smooth driving | green LED |
| fast route / caution | amber command |
| harsh brake / overspeed | red LED + buzzer |
| bridge closed | outputs off |

---

## 10. Demo-Day Startup

Use this exact order:

1. Connect presenter laptop to stable internet.
2. Plug ESP32 into presenter laptop.
3. Start bridge:

```powershell
cd C:\EcoDriveNew
$env:ECODRIVE_RELAY_WS_URL="wss://ecodrive-relay.<your-account>.workers.dev/ws"
$env:ECODRIVE_SESSION="demo-main"
$env:ECODRIVE_TOKEN="beauty_and_the_beast"
npm run bridge:cloud -- COM5
```

4. Open Dashboard on presenter laptop.
5. Open Simulator on iPad or judge laptop.
6. Drive smoothly first.
7. Brake hard to show red/buzzer warning.
8. Accelerate hard to show aggressive behavior warning.
9. Show Dashboard reacting live.

---

## 11. iPad Simulator Tips

Use landscape orientation.

If controls are hidden:

- tap the small device icon button in the simulator toolbar,
- it switches between PC mode and touch mode.

If Safari or Chrome shows a large browser bar:

- rotate to landscape again,
- refresh once,
- avoid split-screen mode,
- use the latest deployed Simulator build.

The simulator has mobile viewport and safe-area fixes, but iPad browser chrome can still reduce vertical space. The controls are designed to stay above the bottom safe area.

---

## 12. Git Workflow

Check changes:

```powershell
git status
```

Commit:

```powershell
git add .
git commit -m "Your message"
```

Push:

```powershell
git push
```

If Cloudflare Pages is connected to GitHub, pushing to `main` triggers redeploy.

If push is rejected because remote has new commits:

```powershell
git pull --rebase --autostash origin main
git push
```

If there are merge conflicts, stop and ask before deleting files.

---

## 13. Troubleshooting

### `tsc` is not recognized

Run:

```powershell
cd C:\EcoDriveNew
npm install
```

### `Missing script: relay:deploy`

You are probably inside `apps/relay`.

Either run:

```powershell
cd C:\EcoDriveNew
npm run relay:deploy
```

or from `apps/relay`:

```powershell
npm run deploy
```

### Dashboard stuck on connecting

Check:

- bridge is running,
- relay URL is correct,
- token matches `beauty_and_the_beast`,
- Pages env vars were saved and redeployed,
- Worker secret name is `DEMO_TOKEN`.

### Simulator says bridge unavailable

The simulator reached Cloudflare, but the laptop bridge is not connected.

Start bridge:

```powershell
cd C:\EcoDriveNew
npm run bridge:cloud -- COM5
```

### ESP32 does not react

Check:

- correct COM port,
- no Arduino Serial Monitor is using the port,
- ESP32 firmware is flashed,
- bridge terminal shows ESP32 startup messages,
- USB cable supports data, not only charging.

### Cloudflare Pages builds old UI

Check:

- you pushed latest code to GitHub,
- Pages project is using branch `main`,
- env vars were saved for the correct Pages project,
- redeploy completed successfully.

### Token mismatch

Use this exact value everywhere:

```text
beauty_and_the_beast
```

Worker secret:

```text
DEMO_TOKEN=beauty_and_the_beast
```

Dashboard and Simulator Pages:

```text
NEXT_PUBLIC_ECODRIVE_TOKEN=beauty_and_the_beast
```

Bridge:

```powershell
$env:ECODRIVE_TOKEN="beauty_and_the_beast"
```

---

## 14. Quick Command Cheat Sheet

```powershell
cd C:\EcoDriveNew
npm install
npm run relay:typecheck
npm run dashboard:build
npm run simulator:build
npm run relay:deploy
```

Mock bridge:

```powershell
cd C:\EcoDriveNew
$env:ECODRIVE_RELAY_WS_URL="wss://ecodrive-relay.<your-account>.workers.dev/ws"
$env:ECODRIVE_SESSION="demo-main"
$env:ECODRIVE_TOKEN="beauty_and_the_beast"
$env:ECODRIVE_BRIDGE_MOCK="1"
npm run bridge:cloud
```

Real ESP32 bridge:

```powershell
cd C:\EcoDriveNew
Remove-Item Env:\ECODRIVE_BRIDGE_MOCK -ErrorAction SilentlyContinue
$env:ECODRIVE_RELAY_WS_URL="wss://ecodrive-relay.<your-account>.workers.dev/ws"
$env:ECODRIVE_SESSION="demo-main"
$env:ECODRIVE_TOKEN="beauty_and_the_beast"
npm run bridge:cloud -- COM5
```

