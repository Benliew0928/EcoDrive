# EcoDrive+ Project Structure

This scaffold follows the current champion plan:

```text
EcoDrive+
  apps/
    dashboard/        Static cockpit HMI web app for laptop or car display
    simulator/        Future iPad driving simulator, design-first for now
    server/           Future local WebSocket relay for the live demo
  firmware/
    src/              Empty ESP32 C++ module placeholders
  packages/
    protocol/         Future shared packet contracts
    ui/               Future shared UI tokens and components
  docs/
    project-structure.md
    simulator-design-concepts.md
```

## Dashboard Routes

The dashboard is scaffolded as a Next.js static UI shell with one route per cockpit mode:

- `/` - Drive
- `/route` - Eco Route
- `/energy` - Energy and Charging
- `/carbon-twin` - CarbonTwin forest
- `/city` - Eco-City Builder
- `/rewards` - Rewards Marketplace
- `/community` - Community Challenge
- `/fleet` - Fleet Diagnostics

The UI has no live data, WebSocket behavior, scoring logic or game state yet. It exists to lock the visual hierarchy and pitch structure.

## Firmware Placeholders

The C++ files are intentionally empty:

```text
firmware/src/main.cpp
firmware/src/input/SimulatorReceiver.cpp
firmware/src/scoring/EcoScore.cpp
firmware/src/feedback/OledView.cpp
firmware/src/feedback/LedFeedback.cpp
firmware/src/feedback/BuzzerFeedback.cpp
firmware/src/output/TelemetryForwarder.cpp
firmware/src/network/WifiManager.cpp
```

These names mirror the plan so the embedded work can start without debating folders later.

