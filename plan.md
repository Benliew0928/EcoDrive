# EcoDrive+ Champion Build Plan
## Drive Green. Earn Green. Grow Green.

EcoDrive+ is a live EV sustainability platform that turns driving behaviour into visible climate impact. The final demo uses a **two-app architecture** designed specifically for hackathon pitching: an interactive **Driving Simulator** on an iPad feeds real-time input to an **ESP32 hardware brain**, which processes eco-scores and triggers physical feedback (LEDs, buzzer, OLED), then forwards the results to a **Main Dashboard web app** on a laptop screen showing gamification, rewards, and leaderboards.

This plan is built to produce a working demo system for the MBOT Fuel Not Found Hackathon 2026 pitching stage.

---

## 1. Winning Position

Most EV dashboard ideas stop at displaying numbers. EcoDrive+ is designed as a behaviour-change system, and the demo proves the full loop end-to-end:

1. **Drive** using an interactive iPad simulator that feels like an F1 racing game.
2. **Process** the driving input through a real ESP32 microcontroller that calculates eco-scores locally.
3. **Feel** instant physical feedback: green LEDs for smooth driving, red LEDs and buzzer for harsh braking.
4. **See** the results live on the Main Dashboard: eco-score gauge, EcoCoins earned, carbon saved.
5. **Play** by investing EcoCoins into an Eco-City Builder that generates passive Yield Coins.
6. **Redeem** Yield Coins in a Rewards Marketplace for real-life rewards like coffee discounts.
7. **Compete** on a Community Leaderboard that ranks drivers by carbon impact.

The core pitch line:

> EcoDrive+ does not only tell drivers they saved carbon. It lets them see it, feel it, prove it, and build something with it.

---

## 2. Judging Criteria Strategy

| Criteria | Marks | EcoDrive+ Strategy |
|---|---:|---|
| Problem Definition & Understanding | 15 | Frame the problem as a visibility and behaviour feedback gap in EV usage, not merely a missing dashboard feature. |
| Creativity & Innovation | 20 | Two-app architecture with hardware-in-the-loop: driving simulator feeds ESP32 which feeds dashboard. Plus city-building gamification and real-life rewards. |
| Technical Execution | 25 | Show a working ESP32 receiving live data from a driving simulator, processing eco-scores, driving physical outputs, and streaming results to a dashboard web app — all in real-time. |
| Presentation & Communication | 20 | Two-screen live demo: iPad driving game + laptop dashboard updating simultaneously while ESP32 LEDs and buzzer react on the table. |
| Sustainability & Impact | 20 | Translate every trip into kg CO2 saved, kWh avoided, money saved, and campus-wide reduction potential. |

---

## 3. Two-App Demo System Scope

### 3.1 Overview

The pitching demo consists of three connected components:

```text
┌─────────────────────────────┐
│  APP 1: Driving Simulator   │  ← iPad (horizontal, like F1 game)
│  - 2D driving game view      │
│  - Virtual gas pedal         │
│  - Virtual brake pedal       │
│  - Sends raw input via WiFi  │
└──────────────┬──────────────┘
               │ JSON over WiFi (WebSocket)
               │ { "throttle": 0.7, "brake": 0.0, "speed": 52.3 }
               v
┌─────────────────────────────┐
│  ESP32 (The Car Brain)      │  ← Physical hardware on table
│  - Receives simulator input  │
│  - Computes eco-score locally │
│  - Drives LED strip (G/Y/R)  │
│  - Triggers buzzer on harsh  │
│  - Updates OLED display       │
│  - Forwards processed data    │
└──────────────┬──────────────┘
               │ JSON over WiFi (WebSocket)
               │ { "ecoScore": 84, "coinsEarned": 5, "event": "smooth" }
               v
┌─────────────────────────────┐
│  APP 2: Main Dashboard      │  ← Laptop/Monitor
│  - Eco-Route Planner (map)    │
│  - Live eco-score gauge       │
│  - Trip metrics & event feed  │
│  - Eco-City Builder           │
│  - Rewards Marketplace        │
│  - Community Leaderboard      │
│  - Fleet Command Centre       │
└─────────────────────────────┘
```

### 3.2 App 1: Driving Simulator (iPad)

A web app optimised for iPad landscape (like an F1 racing game). This app is purely for driving — no menus, no route selection, no dashboard. Just the road and the pedals.

- **Driving Game Screen**: 2D top-down road view with the car moving forward automatically. Two large touch zones at the bottom: gas pedal (right) and brake pedal (left). Speed indicator. The road has curves, traffic lights, and stop zones that test driving smoothness.
- **Data Output**: Every 200ms, sends a JSON packet to the ESP32 over WiFi WebSocket containing throttle position, brake force, current speed, and steering angle.

### 3.3 ESP32 Hardware Unit

The ESP32 acts as the "car brain" sitting on the table during the pitch:

- **Input**: Receives raw driving data from the Simulator App via WiFi WebSocket.
- **Processing**: Computes the eco-score locally using the same formulas as a real EV would. This proves embedded computing capability.
- **Physical Output**:
  - SSD1306 OLED showing live eco-score and event alerts.
  - WS2812B LED strip showing green/yellow/red behaviour feedback.
  - Buzzer for harsh brake or unsafe acceleration warnings.
- **Data Output**: Forwards the processed telemetry (eco-score, coins earned, events, carbon saved) to the Main Dashboard via WiFi WebSocket.

### 3.4 App 2: Main Dashboard (Laptop/Monitor)

A web app running on a laptop or external monitor:

- Eco-Route Planner with integrated map API (Leaflet/Google Maps) showing route comparison.
- Live dashboard receiving processed telemetry from ESP32.
- Big eco-score gauge.
- Trip metrics: speed, distance, kWh estimate, CO2 saved, EcoCoins earned.
- Live event feed: acceleration, harsh brake, smooth segment, reward.
- Eco-City Builder (with passive coin yield for real-life rewards).
- Rewards Marketplace for redeeming Yield Coins.
- Community leaderboard and campus challenge.
- Fleet/control-room view for judges to see scalability.

### 3.5 Nice-To-Have Expansion

- 3D first-person driving view instead of 2D top-down.
- Weather effects on the simulator road.
- Trip replay heatmap.
- Digital carbon certificate PDF.
- AI-ready insight layer for future personalized coaching.

---

## 4. Recommended Technology Stack

| Layer | Choice | Why It Fits Demo and Pitch |
|---|---|---|
| Simulator App | Next.js or plain HTML/JS + Canvas/Phaser.js | Fast to build a 2D driving game, responsive on iPad Safari. |
| Dashboard App | Next.js + TypeScript | Polished dashboard, easy WebSocket integration. |
| UI | React, Tailwind CSS, Recharts, Leaflet | Strong visual dashboard, charts, maps, city grid. |
| Backend/Relay | Node.js + WebSocket server | Bridges ESP32 ↔ Dashboard communication. Can also serve both apps. |
| Database | SQLite or in-memory JSON | Reliable local demo, no internet dependency, easy seeding. |
| Firmware | C++ with Arduino framework / PlatformIO | Best for ESP32 demo, OLED, LEDs, buzzer, WiFi WebSocket client. |
| Hardware Protocol | JSON over WiFi WebSocket | Easy to inspect and explain during judging. |
| Maps | Leaflet + OpenStreetMap tiles | Free, flexible route visuals. |
| Deployment | Local laptop serving both web apps + ESP32 on same WiFi | All local, no internet dependency during pitch. |

---

## 5. System Architecture (Detailed Data Flow)

```text
Laptop (Main Dashboard App)
  - Eco-Route Planner: user picks Eco-Route on map
  - Signals iPad to start driving game

Ipad (Driving Simulator App)
  - Driving game starts
  - Sends every 200ms:
    { "throttle": 0.0-1.0, "brake": 0.0-1.0, "speed": km/h, "steering": -1.0 to 1.0 }
         |
         | WiFi WebSocket to ESP32
         v
ESP32 Firmware
  - SimulatorReceiver listens on WebSocket
  - EcoScore engine processes:
    - acceleration smoothness from throttle changes
    - braking harshness from brake force
    - speed consistency from speed variance
  - Computes eco-score (0-100) locally
  - Drives physical outputs:
    - LED: green (85+), yellow (65-84), amber (45-64), red (<45)
    - Buzzer: beep on harsh brake
    - OLED: score + event text
  - Calculates EcoCoins earned, CO2 saved
  - Forwards processed telemetry to Dashboard:
    { "ecoScore": 84, "coinsEarned": 5, "co2SavedKg": 0.12, "event": "smooth_segment" }
         |
         | WiFi WebSocket to Backend/Dashboard
         v
Backend WebSocket Server (on laptop)
  - Relays ESP32 telemetry to Dashboard App
  - Manages game state (city, coins, leaderboard)
         |
         v
Laptop (Main Dashboard App)
  - Switches from Route Planner to Live Drive Dashboard
  - Live eco-score gauge updates
  - Trip metrics update
  - Event feed scrolls
  - EcoCoins balance increases
  - Eco-City, Marketplace, Leaderboard all live
```

---

## 6. ESP32 Firmware Plan

### 6.1 Hardware Components

| Component | Purpose |
|---|---|
| ESP32 | Main controller, WiFi WebSocket client/server. |
| SSD1306 OLED | Show live eco-score and event alerts received from processing. |
| WS2812B LED strip | Ambient colour feedback: green, yellow, orange, red based on eco-score. |
| Buzzer | Short warning tones for harsh braking events. |

> **Note**: MPU6050 and GPS are NOT used in the demo. The ESP32 receives driving data from the Simulator App instead of physical sensors. This is intentional — it proves the same processing pipeline works whether data comes from real sensors or a simulator.

### 6.2 C++ Module Design

```text
/firmware
  src/
    main.cpp
    input/SimulatorReceiver.cpp     ← NEW: listens for WebSocket data from iPad
    scoring/EcoScore.cpp            ← Same eco-score logic
    feedback/OledView.cpp           ← Same OLED output
    feedback/LedFeedback.cpp        ← Same LED output
    feedback/BuzzerFeedback.cpp     ← Same buzzer output
    output/TelemetryForwarder.cpp   ← NEW: sends processed data to Dashboard
    network/WifiManager.cpp         ← WiFi connection management
```

### 6.3 Local Eco-Score Formula

```text
eco_score =
  smoothness_score * 0.40 +
  braking_score    * 0.25 +
  speed_score      * 0.20 +
  cornering_score  * 0.15

smoothness_score = clamp(100 - throttle_change_rate * 18, 0, 100)
braking_score    = clamp(100 - harsh_brakes_count * 28, 0, 100)
speed_score      = clamp(100 - speed_variance_ratio * 90, 0, 100)
cornering_score  = clamp(100 - steering_jerk * 20, 0, 100)
```

Why this works for judging:
- It is transparent and explainable.
- It runs on-device, proving real embedded logic.
- The same formula would work with real sensor data in production.

### 6.4 Simulator Input Packet (iPad → ESP32)

```json
{
  "throttle": 0.65,
  "brake": 0.0,
  "speed": 52.3,
  "steering": 0.12,
  "timestamp": 1719648000
}
```

### 6.5 Processed Telemetry Packet (ESP32 → Dashboard)

```json
{
  "deviceId": "ecodrive-demo-01",
  "ecoScore": 84,
  "speedKmh": 52.3,
  "event": "smooth_segment",
  "hardBrakes": 0,
  "coinsEarned": 5,
  "totalCoins": 245,
  "energyKwh": 0.18,
  "co2SavedKg": 0.92,
  "ledState": "green",
  "timestamp": 1719648000
}
```

### 6.6 Hardware Feedback States

| Eco-Score / Event | LED | OLED | Buzzer |
|---|---|---|---|
| 85-100 | Green pulse | "Excellent driving" | Soft success chirp at milestone only |
| 65-84 | Yellow-green | "Good, stay smooth" | None |
| 45-64 | Amber | "Ease acceleration" | Optional short beep |
| Below 45 | Red | "Aggressive driving" | Warning beep |
| Harsh brake | Red flash | "Hard brake detected" | Double beep |
| Coin milestone | Green sparkle | "+ EcoCoins" | Celebration chirp |

---

## 7. App 1: Driving Simulator Pages (iPad)

The iPad app is purely a driving game — no route selection, no menus, no dashboard. Just the road and the pedals.

### 7.1 Driving Game Screen

Purpose: simulate driving behaviour that feeds real data to the ESP32.

Required UI:
- 2D top-down road view with the car moving forward automatically.
- Road has curves, traffic lights, intersections, and smooth highway sections.
- Left zone: brake pedal (large touch area). Press harder = harder braking.
- Right zone: gas pedal (large touch area). Press harder = faster acceleration.
- Top HUD: current speed, distance travelled, mini eco-score indicator.
- Visual feedback: screen edges flash red on harsh brake, green pulse on smooth driving.

---

## 8. App 2: Main Dashboard Pages (Laptop/Monitor)

The dashboard opens to the Eco-Route Planner first, then transitions to the Live Drive Dashboard once a route is selected.

### 8.1 Eco-Route Planner

Purpose: show route intelligence and map integration using a real map API.

Required UI:
- Integrated map (Leaflet + OpenStreetMap or Google Maps API).
- Origin/destination input.
- Two route overlays: Route A (red, fast, high emissions) and Route B (green, eco, lower emissions).
- Route comparison cards: time, distance, estimated CO2, EcoCoin bonus.
- "Select Eco-Route & Start Driving" button that transitions to the Live Drive Dashboard and signals the iPad to start the driving game.

### 8.2 Live Drive Dashboard

Purpose: show the hardware-to-software connection instantly.

Required UI:
- Real-time eco-score gauge (updates as ESP32 sends data).
- Connection status pill: ESP32 connected / disconnected.
- Speed, distance, energy used, CO2 saved, EcoCoins.
- Driving advice panel.
- Live event feed.
- Hardware mirror: virtual OLED/LED showing what the physical ESP32 is displaying.

### 8.3 Eco-City Builder (Investment Mechanics)

Purpose: strongest creative differentiator and long-term retention.

Required UI:
- 8x8 city grid.
- Building palette: park, solar farm, wind turbine, EV charging hub, recycling centre, eco-school.
- EcoCoin balance (Raw vs Yield).
- Passive income meter (Generates Yield Coins for real-life rewards like coffee discounts).
- Adjacency bonuses highlighted when placing buildings.
- City stage progress: Barren Land to Eco-Metropolis.

### 8.4 Rewards Marketplace

Purpose: prove that game coins have real-world value.

Required UI:
- Available rewards: campus coffee, parking discount, EV charging credit.
- Yield Coin balance and cost per reward.
- "Redeem" button that generates a simulated QR code.
- Redemption history.

### 8.5 Community Challenge & Leaderboard

Purpose: show social behaviour change and sustainability impact.

Required UI:
- Leaderboard: weekly eco-score, CO2 saved, smoothest driver.
- UTAR Green Week group progress.
- Friend comparison.
- Campus carbon map preview.

### 8.6 Fleet Command Centre

Purpose: make the project feel scalable and commercially relevant.

Required UI:
- Fleet cards for campus shuttle EVs.
- Average eco-score, total CO2 saved, alerts, active trips.
- Risk map: areas with harsh braking clusters.

---

## 9. Core Product Mechanics

### 9.1 Impact Engine

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

### 9.2 EcoCoin Reward Rules

| Action | Reward |
|---|---:|
| Complete trip | 10 coins |
| Eco-score above 70 | +15 coins |
| Eco-score above 90 | +30 coins |
| 5-minute smooth streak | +5 coins |
| No harsh brake trip | +20 coins |
| Community challenge contribution | +20 coins |
| First trip of the day | +5 coins |
| Chose Eco-Route over Fast Route | +50 coins |

### 9.3 Eco-City Adjacency Rules

| Pairing | Bonus | Sustainability Message |
|---|---:|---|
| Solar Farm + EV Charger | +25% charger income | Clean charging infrastructure |
| Park + Eco-Home | +15% home income | Greener neighbourhoods |
| Recycling Centre + Factory Conversion | +40% factory income | Circular economy |
| Bike Lane + Any Building | +5% adjacent income | Low-carbon mobility |
| School + Research Lab | +30% both | Education drives innovation |

---

## 10. Pitch Demo Script (Two-Screen Setup)

### Setup

- iPad placed horizontally on the table (Driving Simulator App open).
- ESP32 board with LED strip, OLED, and buzzer visible on the table next to the iPad.
- Laptop/monitor behind showing the Main Dashboard App.
- All three connected to the same WiFi hotspot.

### Scene 1: The Problem

Show a normal EV dashboard mock on the laptop: battery, speed, range. Ask:

> "Where is the carbon impact? Where is the behaviour feedback?"

### Scene 2: Eco-Route Selection (Dashboard)

Open the Eco-Route Planner on the Dashboard laptop. Show two routes on the integrated map.

Expected result:
- Route A: 18 mins, high emissions, 0 bonus EcoCoins.
- Route B: 20 mins, low emissions, +50 bonus EcoCoins.
- Tap "Select Eco-Route & Start Driving." The driving game starts on the iPad automatically.

### Scene 3: Smooth Driving (iPad → ESP32 → Dashboard)

Press the gas pedal gently on the iPad driving game. The car moves forward smoothly.

Expected result:
- iPad shows smooth driving, speed climbing steadily.
- ESP32 receives data: LED turns green, OLED says "Excellent driving."
- Dashboard on laptop: eco-score gauge climbs to 90+, EcoCoins tick up, event feed shows "smooth segment."

### Scene 4: Harsh Braking (iPad → ESP32 → Dashboard)

Slam the brake pedal on the iPad. The car screeches to a stop.

Expected result:
- iPad screen edges flash red.
- ESP32: LED flashes red, buzzer beeps twice, OLED says "Hard brake detected."
- Dashboard on laptop: eco-score drops instantly, event feed shows "harsh brake," driving advice changes to "Brake gently."

### Scene 5: Recovery

Release brake and press gas smoothly again.

Expected result:
- ESP32: LED returns to green, OLED says "Smooth again."
- Dashboard: score recovers, EcoCoins awarded for a smooth streak.

### Scene 6: Eco-City Builder (Dashboard)

Switch to Eco-City Builder on the Dashboard.

Expected result:
- Use the Raw EcoCoins earned from driving to build a Solar Farm.
- Passive Yield Coin income increases.
- Adjacency bonus appears when placed next to an EV Charger.

### Scene 7: Rewards Marketplace (Dashboard)

Navigate to the Rewards Marketplace on the Dashboard.

Expected result:
- Show accumulated Yield Coins.
- Tap "Redeem" on a campus coffee reward.
- A simulated QR code appears.

### Scene 8: Community Leaderboard (Dashboard)

Pull up the Community Leaderboard.

Expected result:
- Driver's ranking has moved up.
- UTAR Green Week progress increases.
- Fleet dashboard shows campus-level CO2 saved.

---

## 11. Implementation Roadmap (Demo-Focused)

### Phase 1: Communication Backbone

- Set up WiFi hotspot and WebSocket server on laptop.
- Build ESP32 WiFi + WebSocket client firmware (receive and forward).
- Test: send a JSON packet from a browser → ESP32 receives → ESP32 forwards to another browser.

### Phase 2: ESP32 Processing & Feedback

- Implement eco-score calculation from simulator input.
- Add OLED display output.
- Add LED strip colour changes.
- Add buzzer triggers.
- Test: send throttle/brake data → ESP32 lights up correctly and forwards processed score.

### Phase 3: Driving Simulator App (iPad)

- Build 2D driving game with gas/brake touch zones (no route selection — that's on Dashboard).
- Connect to ESP32 via WebSocket.
- Test: drive on iPad → ESP32 reacts in real-time.

### Phase 4: Main Dashboard App (Laptop)

- Build Eco-Route Planner with Leaflet/Google Maps API integration.
- Build live eco-score gauge and trip metrics.
- Build event feed.
- Build Eco-City Builder grid.
- Build Rewards Marketplace.
- Build Community Leaderboard.
- Connect to ESP32 output via WebSocket.
- Test: full pipeline — select route on Dashboard → iPad starts driving → ESP32 reacts → Dashboard updates.

### Phase 5: Pitch Polish

- Seed realistic demo scenarios (leaderboard data, city state, reward catalog).
- Add smooth animations and transitions.
- Prepare backup: if ESP32 fails, Dashboard can fall back to a software simulator.
- Rehearse 15-20 minute presentation with two-screen setup.
- Prepare Q&A explanations for architecture, formulas, and the two-app design choice.

---

## 12. What Is Live vs Simulated

Judges value honesty. The final presentation should clearly state:

| Component | Demo Status |
|---|---|
| Driving Simulator input | Live (real user input on iPad) |
| ESP32 eco-score processing | Live, locally computed on the microcontroller |
| OLED/LED/buzzer feedback | Live, driven by ESP32 |
| WebSocket data pipeline | Live, real-time WiFi communication |
| Dashboard updates | Live, receiving real data from ESP32 |
| Eco-City game state | Live in app based on coins earned |
| Route energy comparison | Simulated using real formula and route-like sample data |
| Leaderboard/fleet data | Seeded demo data plus live current user update |
| Future AI coaching | Not built; positioned as future improvement |

---

## 13. Proposal Structure

The PDF proposal should use one cover page plus five content pages:

1. **Cover Page:** Project name, team name, tagline, theme fit.
2. **Page 1:** Problem statement and target users.
3. **Page 2:** Solution overview and two-app architecture.
4. **Page 3:** Technical implementation, data pipeline diagram, stack.
5. **Page 4:** Expected live demo with two-screen setup.
6. **Page 5:** Impact, future improvements, conclusion.

---

## 14. UI Design Scope

### Simulator App (iPad) — 1 screen:

1. Driving Game (gas/brake pedals only)

### Dashboard App (Laptop) — 6 screens:

1. Eco-Route Planner (integrated map API)
2. Live Drive Dashboard
3. Eco-City Builder
4. Rewards Marketplace
5. Community Leaderboard
6. Fleet Command Centre

Design direction:
- Simulator: dark racing-game aesthetic, large touch targets, neon accent colours.
- Dashboard: professional cockpit-style, dark glass surface with clear high-contrast data.
- Eco green: `#37E58F`. Telemetry cyan: `#38BDF8`. Warning amber: `#F5B84B`. Danger red: `#FF5B5B`.
- Cards with small radii, dense information, and strong hierarchy.

---

## 15. Why This Can Score High

EcoDrive+ is strong because its two-app demo architecture creates a jaw-dropping live presentation:

- The iPad driving game makes the demo interactive and fun for judges.
- The ESP32 hardware on the table proves real embedded systems processing.
- The physical LED and buzzer reactions create a visceral "wow" moment.
- The Dashboard web app proves full-stack software execution.
- The complete data pipeline (Simulator → ESP32 → Dashboard) proves technical depth.
- Carbon calculations prove sustainability relevance.
- The Eco-City Builder and Rewards Marketplace prove creativity.
- Community leaderboard and fleet views prove impact beyond one driver.
- Clear live vs simulated disclosure builds judge trust.

The demo spine is simple and reliable: drive on the iPad, watch the ESP32 react on the table, then see everything update live on the Dashboard.
