# EcoDrive+ Champion Build Plan
## Drive Green. Earn Green. Grow Green.

EcoDrive+ is a live EV sustainability platform that turns driving behaviour into visible climate impact. The final demo combines a polished web dashboard with an ESP32 C++ hardware prototype, so judges can see sensor data move from a physical device into real-time carbon savings, route advice, rewards, and a gamified green city.

This plan assumes enough time and resources to build a complete demo-ready codebase while still keeping the pitch believable for the MBOT Fuel Not Found Hackathon 2026.

---

## 1. Winning Position

Most EV dashboard ideas stop at displaying numbers. EcoDrive+ is designed as a behaviour-change system:

1. **Sense** driving behaviour with ESP32, MPU6050, GPS, LEDs, OLED, and buzzer.
2. **Score** eco-driving locally with transparent formulas that judges can understand.
3. **Explain** the impact through real-time carbon savings and route energy estimates.
4. **Reward** better driving with EcoCoins, city growth, streaks, and achievements.
5. **Scale** from one driver to campus fleets, community challenges, and urban planning insights.

The core pitch line:

> EcoDrive+ does not only tell drivers they saved carbon. It lets them see it, feel it, prove it, and build something with it.

---

## 2. Judging Criteria Strategy

| Criteria | Marks | EcoDrive+ Strategy |
|---|---:|---|
| Problem Definition & Understanding | 15 | Frame the problem as a visibility and behaviour feedback gap in EV usage, not merely a missing dashboard feature. |
| Creativity & Innovation | 20 | Combine sensor feedback, carbon accounting, route energy simulation, city-building gamification, and community carbon goals. |
| Technical Execution | 25 | Show a working ESP32 C++ prototype streaming to a live website with WebSocket/MQTT-style data, formulas, and dashboard updates. |
| Presentation & Communication | 20 | Use a structured demo: calm driving, harsh acceleration, hard braking, route choice, city reward, leaderboard movement. |
| Sustainability & Impact | 20 | Translate every trip into kg CO2 saved, kWh avoided, money saved, and campus-wide reduction potential. |

---

## 3. Demo-First Product Scope

### 3.1 Must-Build Final Demo

The final demo should be impressive without depending on a real car.

**Hardware unit**
- ESP32 running C++ firmware.
- MPU6050 accelerometer/gyroscope for movement and harsh-event detection.
- NEO-6M GPS if outdoor signal is available; simulated GPS fallback for indoor demo.
- SSD1306 OLED showing eco-score, status, and event alerts.
- WS2812B LED strip showing green/yellow/red behaviour feedback.
- Buzzer for harsh brake or unsafe acceleration.
- Push button to switch demo modes.

**Website**
- Live dashboard receiving telemetry.
- Big eco-score gauge.
- Trip metrics: speed, distance, kWh estimate, CO2 saved, EcoCoins earned.
- Live event feed: acceleration, harsh brake, smooth segment, reward.
- Route comparison: fastest route vs eco route.
- Eco-City mini simulation (with passive coin yield for real-life rewards).
- Community leaderboard and campus challenge.
- Fleet/control-room view for judges to see scalability.

**Backend**
- Node.js with TypeScript for fast real-time demo development.
- WebSocket server for browser updates.
- MQTT-compatible adapter for ESP32 messages, or direct WebSocket/HTTP fallback.
- SQLite for local demo persistence, with seed data for trips, users, city state, and leaderboard.

### 3.2 Nice-To-Have Expansion

- Weather-aware route energy adjustment.
- Green charging station finder.
- Trip replay heatmap.
- Digital carbon certificate PDF.
- Admin dashboard for campus EV fleet.
- AI-ready insight layer for future personalized coaching.

---

## 4. Recommended Technology Stack

| Layer | Choice | Why It Fits Demo and Pitch |
|---|---|---|
| Firmware | C++ with Arduino framework / PlatformIO | Best for ESP32 demo, sensors, OLED, LEDs, and judges familiar with Arduino workshop. |
| Website | Next.js + TypeScript | Fast to build, polished for pitching, easy API/WebSocket integration. |
| UI | React, Tailwind CSS, Recharts, Leaflet, Three.js optional | Strong visual dashboard, charts, maps, and possible 3D/2.5D city. |
| Backend | Node.js + TypeScript + Express/Fastify + WebSocket | One language for web/backend, real-time telemetry is simple to show. |
| Database | SQLite + Prisma or Drizzle | Reliable local demo, no internet dependency, easy seeding. |
| Hardware Protocol | JSON over WiFi, WebSocket or MQTT-style topics | Easy to inspect and explain during judging. |
| Maps | Leaflet + OpenStreetMap tiles | Free, flexible route visuals. |
| Deployment | Local laptop demo + optional Vercel/cloud mirror | Local reliability with public showcase option. |

---

## 5. System Architecture

```text
ESP32 Sensor Unit
  - MPU6050 @ 20 Hz
  - GPS @ 1 Hz or simulator mode
  - Eco-score computed locally
  - OLED, LED strip, buzzer feedback
        |
        | JSON telemetry every 500 ms to 2 s
        v
Realtime Gateway
  - WebSocket/MQTT adapter
  - validates packets
  - stores trip events
        |
        v
Impact Engine
  - eco-score breakdown
  - carbon saved vs petrol baseline
  - kWh estimate
  - EcoCoin reward rules
  - route energy comparison
        |
        v
Next.js Demo Website
  - driver dashboard
  - route planner
  - Eco-City builder
  - leaderboard
  - fleet dashboard
```

---

## 6. ESP32 Firmware Plan

### 6.1 Hardware Components

| Component | Purpose |
|---|---|
| ESP32 | Main controller and WiFi communication. |
| MPU6050 | Detect acceleration, harsh braking, sharp turning, and vibration. |
| NEO-6M GPS | Track speed, distance, and route position when signal is available. |
| SSD1306 OLED | Show live eco-score and warnings. |
| WS2812B LED strip | Ambient colour feedback: green, yellow, orange, red. |
| Buzzer | Short warning tones for harsh events. |
| Push button | Switch between live sensor, indoor simulator, and judge-interactive mode. |

### 6.2 C++ Module Design

```text
/firmware
  src/
    main.cpp
    sensors/Mpu6050Reader.cpp
    sensors/GpsReader.cpp
    scoring/EcoScore.cpp
    feedback/OledView.cpp
    feedback/LedFeedback.cpp
    feedback/BuzzerFeedback.cpp
    network/TelemetryClient.cpp
    demo/DemoMode.cpp
```

### 6.3 Local Eco-Score Formula

```text
eco_score =
  smoothness_score * 0.40 +
  braking_score    * 0.25 +
  speed_score      * 0.20 +
  cornering_score  * 0.15

smoothness_score = clamp(100 - acceleration_std_dev * 18, 0, 100)
braking_score    = clamp(100 - hard_brakes_per_km * 28, 0, 100)
speed_score      = clamp(100 - speed_variance_ratio * 90, 0, 100)
cornering_score  = clamp(100 - sharp_turns_per_km * 20, 0, 100)
```

Why this works for judging:
- It is transparent and explainable.
- It runs on-device, reducing latency.
- It demonstrates real embedded logic, not just a website simulation.

### 6.4 Telemetry Packet

```json
{
  "deviceId": "ecodrive-demo-01",
  "mode": "sensor",
  "timestamp": 1719648000,
  "speedKmh": 48.2,
  "distanceM": 1340,
  "accel": { "x": 0.14, "y": -0.06, "z": 9.79 },
  "gyro": { "x": 0.01, "y": 0.02, "z": 0.04 },
  "gps": { "lat": 4.3394, "lng": 101.1428, "alt": 120.0 },
  "ecoScore": 84,
  "event": "smooth_segment",
  "hardBrakes": 0,
  "hardAccels": 1,
  "energyKwh": 0.18,
  "co2SavedKg": 0.92
}
```

### 6.5 Hardware Feedback States

| Eco-Score / Event | LED | OLED | Buzzer |
|---|---|---|---|
| 85-100 | Green pulse | "Excellent driving" | Soft success chirp at milestone only |
| 65-84 | Yellow-green | "Good, stay smooth" | None |
| 45-64 | Amber | "Ease acceleration" | Optional short beep |
| Below 45 | Red | "Aggressive driving" | Warning beep |
| Harsh brake | Red flash | "Hard brake detected" | Double beep |
| Judge mode reward | Green sparkle | "+ EcoCoins" | Celebration chirp |

---

## 7. Website Demonstration Pages

The website should open directly into the working dashboard, not a marketing landing page.

### 7.1 Live Drive Dashboard

Purpose: show the hardware-to-software connection instantly.

Required UI:
- Real-time eco-score gauge.
- Connection status pill: ESP32 live / simulator / offline.
- Speed, distance, energy used, CO2 saved, EcoCoins.
- Driving advice panel.
- Sensor stream mini chart.
- Event feed.
- OLED/LED virtual mirror showing what the hardware is displaying.

### 7.2 Eco Route Planner

Purpose: show technical depth beyond sensor display.

Required UI:
- Origin/destination input.
- Map with fastest route and eco route.
- Route comparison cards: time, distance, kWh, estimated CO2, stops, elevation.
- Explanation panel: "Eco route is 4 minutes longer but saves 0.7 kWh."
- Weather and traffic modifiers as future-ready options.

### 7.3 Eco-City Builder (Investment Mechanics)

Purpose: strongest creative differentiator and long-term retention. 

Required UI:
- 8x8 city grid.
- Building palette: park, solar farm, wind turbine, EV charging hub, recycling centre, eco-school.
- EcoCoin balance (Raw vs Yield).
- Passive income meter (Generates Yield Coins for real-life rewards like coffee discounts).
- Adjacency bonuses highlighted when placing buildings.
- City stage progress: Barren Land to Eco-Metropolis.

### 7.5 Community Challenge

Purpose: show social behaviour change and sustainability impact.

Required UI:
- Leaderboard: weekly eco-score, CO2 saved, smoothest driver.
- UTAR Green Week group progress.
- Friend comparison.
- Campus carbon map preview.
- Team mode for 3-5 member hackathon teams.

### 7.6 Fleet Command Centre

Purpose: make the project feel scalable and commercially relevant.

Required UI:
- Fleet cards for campus shuttle EVs.
- Average eco-score, total CO2 saved, alerts, active trips.
- Risk map: areas with harsh braking clusters.
- Maintenance insight: "Vehicle 03 shows unusual vibration."
- Export monthly sustainability report.

### 7.7 Trip Replay and Certificate

Purpose: make impact provable after the trip.

Required UI:
- Timeline replay with green/red driving segments.
- Key moments: harsh brake, smooth streak, high drag speed.
- Before/after improvement card.
- Carbon certificate preview.
- Share/download actions.

---

## 8. Core Product Mechanics

### 8.1 Impact Engine

The Impact Engine converts driving data into sustainability metrics.

```text
EV energy used = base rolling cost + acceleration cost + drag cost + elevation cost - regen credit

CO2 saved =
  petrol_emission_factor_per_km * distance_km
  - EV_energy_kWh * grid_carbon_factor
```

Demo constants can be shown transparently:
- Petrol baseline: 0.192 kg CO2/km.
- Malaysia grid factor: configurable value for demo.
- EV efficiency target: 0.15 kWh/km.

### 8.2 EcoCoin Reward Rules

| Action | Reward |
|---|---:|
| Complete trip | 10 coins |
| Eco-score above 70 | +15 coins |
| Eco-score above 90 | +30 coins |
| 5-minute smooth streak | +5 coins |
| No harsh brake trip | +20 coins |
| Community challenge contribution | +20 coins |
| First trip of the day | +5 coins |

### 8.3 Eco-City Adjacency Rules

| Pairing | Bonus | Sustainability Message |
|---|---:|---|
| Solar Farm + EV Charger | +25% charger income | Clean charging infrastructure |
| Park + Eco-Home | +15% home income | Greener neighbourhoods |
| Recycling Centre + Factory Conversion | +40% factory income | Circular economy |
| Bike Lane + Any Building | +5% adjacent income | Low-carbon mobility |
| School + Research Lab | +30% both | Education drives innovation |

---

## 9. Data Model

### 9.1 Main Entities

```text
User
  id, name, campus, avatar, ecoRank, totalCoins, totalCo2SavedKg

Device
  id, userId, firmwareVersion, lastSeenAt, mode

Trip
  id, userId, startedAt, endedAt, distanceM, avgEcoScore, energyKwh, co2SavedKg

TelemetryEvent
  id, tripId, timestamp, speedKmh, accelX, accelY, accelZ, ecoScore, eventType

CityTile
  id, userId, x, y, buildingType, level, bonusMultiplier

LeaderboardEntry
  id, userId, period, ecoScoreAvg, co2SavedKg, rank

CommunityGoal
  id, title, targetCo2Kg, currentCo2Kg, reward, endsAt
```

---

## 10. Pitch Demo Script

### Scene 1: The Problem

Show a normal EV dashboard mock: battery, speed, range. Ask:

> "Where is the carbon impact? Where is the behaviour feedback?"

### Scene 2: Eco-Route Planner (Map Integration)

Open the Eco-Route Planner map on the iPad. Show two routes to the same destination. 

Expected result:
- Route A shows 18 mins (High emissions, 0 EcoCoins).
- Route B shows 20 mins (Low emissions, +50 EcoCoins).
- Tap to select Route B, transitioning to the Live Drive Dashboard.

### Scene 3: Live Sensor Connection

Activate the iPad virtual pedal simulator. Tap the gas pedal gently (like playing an F1 game).

Expected result:
- The ESP32 receives the simulated acceleration.
- Eco-score stays high.
- LED stays green.
- OLED says "Excellent driving".
- Website shows smooth segment and CO2 saved.

### Scene 4: Harsh Driving Event

Hit the virtual brake pedal hard on the iPad.

Expected result:
- The ESP32 receives the harsh brake event.
- LED flashes red.
- Buzzer beeps.
- OLED shows hard brake warning.
- Website eco-score drops and event feed updates instantly.

### Scene 5: Behaviour Change

Release the brake and tap the gas smoothly again.

Expected result:
- Score recovers.
- Advice changes to "Smooth again".
- EcoCoins are awarded for a smooth streak.

### Scene 6: Sustainability Becomes Visible

Switch to Eco-City Builder.

Expected result:
- EcoCoins allow user to build a solar charger.
- Passive income meter increases, unlocking real-life rewards.
- Adjacency bonus appears.

### Scene 7: Scale the Impact

Switch to Community and Fleet views.

Expected result:
- Leaderboard updates.
- UTAR Green Week progress increases.
- Fleet dashboard shows campus-level CO2 saved.

---

## 11. Implementation Roadmap

### Phase 1: Foundation

- Set up monorepo with `apps/web`, `apps/api`, `firmware`.
- Define telemetry JSON schema.
- Build seed database.
- Create dashboard design system and page shell.
- Implement ESP32 simulator in the backend before hardware is ready.

### Phase 2: Hardware Integration

- Read MPU6050 values.
- Implement local eco-score.
- Add OLED, LED, buzzer states.
- Send telemetry over WiFi.
- Add indoor demo mode for reliable judging.

### Phase 3: Real-Time Website

- WebSocket live dashboard.
- Charts, event feed, and virtual hardware mirror.
- Trip summary and EcoCoin rewards.
- City and forest state updates.

### Phase 4: Wow Features

- Eco route planner simulation.
- Eco-City adjacency system.
- Community leaderboard.
- Fleet command centre.
- Trip replay and carbon certificate.

### Phase 5: Pitch Polish

- Seed realistic demo scenarios.
- Prepare backup video.
- Add "offline simulator" button.
- Rehearse 15-20 minute presentation.
- Prepare Q&A explanations for formulas, hardware, and simulated parts.

---

## 12. What Is Live vs Simulated

Judges value honesty. The final presentation should clearly state:

| Component | Demo Status |
|---|---|
| ESP32 motion detection | Live |
| OLED/LED/buzzer feedback | Live |
| WebSocket dashboard updates | Live |
| Eco-score calculation | Live, locally computed |
| GPS route | Live if signal available, simulated fallback indoors |
| Route energy comparison | Simulated using real formula and route-like sample data |
| Eco-City state updates | Live in app based on telemetry/rewards |
| Leaderboard/fleet data | Seeded demo data plus live current user update |
| Future AI coaching | Not built; positioned as future improvement |

---

## 13. Proposal Structure

The PDF proposal should use one cover page plus five content pages:

1. **Cover Page:** Project name, team name, tagline, theme fit.
2. **Page 1:** Problem statement and target users.
3. **Page 2:** Solution overview and product modules.
4. **Page 3:** Technical implementation, architecture diagram, stack.
5. **Page 4:** Expected live demo and hardware plan.
6. **Page 5:** Impact, future improvements, conclusion.

---

## 14. Figma UI Scope

The Figma website demo should include seven desktop pages:

1. Live Drive Dashboard
2. Eco Route Planner
3. Eco-City Builder
4. Community Challenge
6. Fleet Command Centre
7. Trip Replay & Carbon Certificate

Design direction:
- Professional dashboard, not a marketing landing page.
- Dark cockpit-style surface with clear high-contrast data.
- Green used as a signal, not the whole palette.
- Amber/red warning states for driving behaviour.
- Cyan/blue for route and telemetry.
- Cards with small radii, dense information, and strong hierarchy.
- Components: sidebar, top status bar, metric cards, charts, map panels, event rows, leaderboard rows, building tiles, route comparison cards.

---

## 15. Why This Can Score High

EcoDrive+ is strong because it turns the handbook's expected EV dashboard into a complete sustainability loop:

- Hardware proves the embedded systems requirement.
- C++ firmware proves technical depth.
- Real-time web dashboard proves software execution.
- Carbon calculations prove sustainability relevance.
- Gamification proves creativity.
- Community and fleet views prove impact beyond one driver.
- Clear live vs simulated disclosure builds judge trust.

The project is ambitious, but the demo spine is simple and reliable: move the ESP32, watch the website change, then show how that behaviour becomes measurable carbon impact.
