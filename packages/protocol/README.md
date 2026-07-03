# EcoDrive+ Protocol Package

Shared message contracts for the public hardware-in-the-loop demo.

This package defines the WebSocket messages used by:

- the public Simulator,
- the public Dashboard,
- the Cloudflare relay Worker/Durable Object,
- the presenter laptop bridge that connects to the ESP32 by USB serial.

Core packet types:

- `sim.input` - simulator controls and local driving state,
- `dashboard.telemetry` - processed telemetry shown in the dashboard,
- `bridge.hardware` - ESP32 bridge/serial/LED status,
- `session.status` - connected client counts for the live demo session,
- `relay.error` - recoverable relay errors.

Build with:

```bash
npm --workspace @ecodrive/protocol run build
```
