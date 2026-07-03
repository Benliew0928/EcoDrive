# EcoDrive+ Bridge Server

This app contains laptop-side bridge scripts for the EcoDrive+ demo.

## Public Demo Bridge

`cloud-bridge.mjs` connects the public Cloudflare relay to the ESP32 over USB serial:

```text
Public Simulator -> Cloudflare relay -> laptop bridge -> ESP32
ESP32/laptop bridge -> Cloudflare relay -> Public Dashboard
```

Run after building the protocol package:

```bash
npm --workspace @ecodrive/protocol run build
set ECODRIVE_RELAY_WS_URL=wss://ecodrive-relay.<domain>/ws
set ECODRIVE_SESSION=demo-main
npm --workspace @ecodrive/server run bridge:cloud -- COM5
```

For cloud-only testing before plugging in ESP32:

```bash
set ECODRIVE_BRIDGE_MOCK=1
npm --workspace @ecodrive/server run bridge:cloud
```

## Legacy Local Bridge

`serial-bridge.mjs` is the old local-only bridge that listens on `ws://localhost:3200` and writes `G/R/A/B/X` to the ESP32. Keep it as a fallback tool, but it is not the main public-demo transport anymore.
