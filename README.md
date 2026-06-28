# EcoDrive+
### Drive Green. Earn Green. Grow Green.

EcoDrive+ is a demo-ready EV sustainability platform for the MBOT Fuel Not Found Hackathon 2026. It combines an ESP32 C++ hardware unit with a real-time website dashboard to make eco-driving behaviour visible, measurable, and rewarding.

The core demo idea is simple: move the ESP32 prototype, watch the dashboard react, then show how driving behaviour becomes an eco-score, carbon savings, hardware feedback, EcoCoins, a growing CarbonTwin forest, and an Eco-City.

## Project Direction

EcoDrive+ is designed to score strongly across problem understanding, creativity, technical execution, presentation, and sustainability impact.

Key differentiators:

- Real ESP32 sensor prototype instead of only a software mockup.
- C++ firmware that calculates a local eco-score from motion data.
- Live web dashboard for a polished pitching session.
- Transparent carbon and energy calculations.
- CarbonTwin forest and Eco-City Builder gamification.
- Community challenges and fleet command centre for wider impact.

## Main Modules

### 1. Live Drive Dashboard

Shows live eco-score, speed, trip distance, energy estimate, CO2 saved, EcoCoins earned, hardware status, sensor stream, and driving advice.

### 2. ESP32 Eco-Feedback Unit

Uses ESP32 with MPU6050, optional NEO-6M GPS, OLED display, WS2812B LED strip, buzzer, and a mode button. The unit gives immediate feedback:

- Green LED for smooth driving.
- Amber/red LED for inefficient or aggressive driving.
- Buzzer for harsh braking.
- OLED status for score, warning, and reward messages.

### 3. Impact Engine

Converts telemetry into:

- eco-score,
- kWh estimate,
- CO2 saved versus petrol baseline,
- range impact,
- EcoCoin rewards,
- route energy comparison.

### 4. CarbonTwin Forest

Efficient trips grow a virtual forest. Trees evolve from saplings to mature trees, and cumulative carbon savings unlock wildlife and rare biomes.

### 5. Eco-City Builder

Drivers spend EcoCoins on an 8x8 sustainable city grid. Buildings include parks, solar farms, EV charging hubs, recycling centres, wind turbines, and eco-schools. Adjacency bonuses teach real sustainability concepts such as clean charging and circular economy.

### 6. Community and Fleet Mode

Leaderboards, UTAR Green Week challenges, campus carbon goals, and a fleet command centre show how EcoDrive+ can scale beyond one driver.

## Recommended Stack

| Layer | Technology |
|---|---|
| Firmware | C++ with Arduino framework or PlatformIO |
| Hardware | ESP32, MPU6050, NEO-6M GPS, SSD1306 OLED, WS2812B LED, buzzer |
| Website | Next.js, React, TypeScript, Tailwind CSS |
| Backend | Node.js, TypeScript, WebSocket server |
| Database | SQLite for local demo persistence |
| Visuals | Recharts, Leaflet/OpenStreetMap, optional Three.js |

## Repository Contents

- `plan.md` - improved champion build plan.
- `proposal.md` - source text for the proposal.
- `output/pdf/TeamEcoDrive_Proposal.pdf` - generated proposal PDF.
- `cockpit-hmi-redesign.md` - cockpit-style Figma/UI redesign direction.
- `apps/dashboard` - static Next.js cockpit HMI screen scaffold.
- `apps/simulator` - future iPad driving simulator shell, design-first for now.
- `apps/server` - future local WebSocket relay shell.
- `firmware` - ESP32 PlatformIO scaffold with empty C++ module placeholders.
- `docs/project-structure.md` - current repository structure.
- `docs/simulator-design-concepts.md` - simulator stack recommendation and concept directions.
- `question/MBOT Hackathon Participant Handbook.pdf` - hackathon handbook.

## Demo Flow

1. Show the limitation of normal EV dashboards.
2. Connect the ESP32 and open the Live Drive Dashboard.
3. Hold the board steady to show smooth driving.
4. Jolt the board to trigger hard-brake feedback.
5. Return to smooth movement and earn EcoCoins.
6. Show CarbonTwin forest and Eco-City growth.
7. Show community challenge and fleet impact views.
