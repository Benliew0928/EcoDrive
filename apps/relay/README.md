# EcoDrive+ Cloud Relay

Cloudflare Worker + Durable Object relay for the public demo.

Endpoint:

```text
wss://<worker-host>/ws?session=demo-main&role=simulator
wss://<worker-host>/ws?session=demo-main&role=dashboard
wss://<worker-host>/ws?session=demo-main&role=bridge
```

Roles:

- `simulator` sends `sim.input`.
- `bridge` receives `sim.input`, drives the ESP32 over USB serial, then sends `dashboard.telemetry` and `bridge.hardware`.
- `dashboard` receives `dashboard.telemetry`, `bridge.hardware`, and `session.status`.

Local development:

```bash
npm --workspace @ecodrive/protocol run build
npm --workspace @ecodrive/relay run dev
```

Deploy:

```bash
npm --workspace @ecodrive/relay run deploy
```

Set `DEMO_TOKEN` as a Cloudflare Worker secret if you want to prevent unknown clients from joining the session.
For the current demo, use this value:

```text
beauty_and_the_beast
```
