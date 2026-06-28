# EcoDrive+ In-Car Cockpit HMI Redesign

This is the replacement direction for the earlier website-like dashboard. The new design should feel like a real EV centre display, closer to Tesla/BYD-style vehicle HMIs: wide, drive-first, calm, premium, and directly usable from inside the car.

Figma target file:

https://www.figma.com/design/NwdK59w16LMZqLZWMvuPQX

Status:

- Figma write attempt was blocked by the Starter-plan MCP tool-call limit.
- The old file is still present.
- This document defines the redesigned cockpit system to recreate when Figma writes are available again.

## Design Brief

Create a premium in-car EV dashboard for EcoDrive+.

It should not look like a generic website or admin dashboard. It should look like a real car cockpit screen:

- widescreen 16:9 HMI,
- persistent top vehicle status bar,
- persistent bottom climate / drive mode dock,
- large map and vehicle visualization,
- clean dark glass surfaces,
- strong live telemetry signals,
- minimal text while driving,
- clear mode switching between drive, route, energy, forest, city, community, and fleet.

The gamified features should feel embedded into the car experience, not like separate web pages.

## Frame Setup

All redesigned frames should live on Figma page:

`01 Website Screens`

Create six 1600 x 900 frames:

1. `Cockpit HMI / 01 Drive`
2. `Cockpit HMI / 02 Eco Route`
3. `Cockpit HMI / 03 Energy & Charging`
4. `Cockpit HMI / 04 Eco-City`
5. `Cockpit HMI / 05 Community`
6. `Cockpit HMI / 06 Fleet Diagnostics`

Arrange them in a 2-column grid to the right of the existing old frames.

## Global Layout

Each frame uses the same cockpit shell.

### Top Vehicle Status Bar

Height: 72px.

Content:

- left: clock, EcoDrive+ title, current mode subtitle,
- center: speed `84 km/h`, gear `D`,
- right: `ESP32 SENSOR LIVE` pill,
- subtle bottom border,
- dark glass background.

### Bottom Vehicle Dock

Height: 94px.

Content:

- left: climate controls: `22.5 C`, `AUTO`, `AC`, front defog,
- center: mode chips:
  - Drive
  - Route
  - Energy
  - City
  - Community
  - Fleet
- right: range and battery: `438 km`, `82% battery`.

Each mode chip should be clickable in Figma prototype mode and navigate to the corresponding frame using Smart Animate.

### Visual Style

Use:

- base background: near-black green, `#050909`,
- panels: `#0A1213`, `#0E1717`, `#101A1A`,
- eco green: `#37E58F`,
- telemetry cyan: `#38BDF8`,
- warning amber: `#F5B84B`,
- danger red: `#FF5B5B`,
- text: `#F5FFFA`,
- muted text: `#8EA5A0`,
- border: `#263B3A`.

Avoid:

- generic website sidebars,
- marketing cards,
- oversized explanatory copy,
- emoji,
- cartoon UI,
- soft SaaS dashboard styling.

## Screen 1: Drive

Primary purpose:

Show the core driving experience and ESP32 telemetry in a real cockpit layout.

Main zones:

- Large map on the left with eco route line and live vehicle marker.
- Central vehicle visualization with sensor aura.
- Large eco-score ring: `84`, label `ECO SCORE`.
- Metrics:
  - Battery: `82%`
  - Range: `438 km`
  - CO2 saved: `1.42 kg`
  - EcoCoins: `245`
- MPU6050 live signal scope.
- Eco co-pilot recommendation:
  - `Hold current throttle. Regen window is optimal and route is trending 12% below target energy.`
- Hardware feedback mirror:
  - `LED: green pulse`
  - `OLED: Excellent driving | Score 84`
  - `Buzzer: idle`

Interaction:

- Bottom dock chips navigate to other modes.
- Eco co-pilot `AUTO ECO` chip appears active.

## Screen 2: Eco Route

Primary purpose:

Show energy-first navigation that feels like an EV route planner.

Main zones:

- Wide map with eco route and fastest route overlays.
- Route comparison control panel:
  - Eco route: `2.1 kWh`
  - Fastest: `2.8 kWh`
  - CO2 saved: `0.7 kg`
  - Time delta: `4 min`
- Segmented control:
  - Eco
  - Fast
  - Balanced
- Explanation:
  - `Eco route avoids stop-start clusters and keeps speed under high-drag range.`

Interaction:

- Segmented route mode visually shows `Eco` active.
- Bottom dock navigation works.

## Screen 3: Energy & Charging

Primary purpose:

Show EV-grade energy flow, regen, charging, carbon intensity, and green charging suggestions.

Main zones:

- Large battery module with `82%`.
- Animated-style flow lines:
  - Regen `+18 kW`
  - Motor `42 kW`
- Metrics:
  - Charge ETA: `22 min`
  - Grid carbon: `0.58 kg/kWh`
  - Trip energy: `0.31 kWh`
- Telemetry chart for energy spikes.
- Green charger recommendation:
  - `Nearest green charger: UTAR Solar Hub`
  - `2.3 km away | estimated grid mix 70% clean | RM 4.80 projected`

## Screen 4: Eco-City (Investment & Rewards)

Primary purpose:

Make the gamification feel like a built-in vehicle reward mode, teaching sustainable investment versus instant gratification.

Main zones:

- Large 8x8 tactical city grid.
- Buildings:
  - park,
  - solar farm,
  - EV charger,
  - recycling,
  - wind,
  - eco-school.
- Header metrics:
  - Raw EcoCoins (For Building): `1,245`
  - Passive Yield Coins (For Real-World Rewards): `68/day`
  - Next Real-World Reward: `Free Campus Coffee (Requires 100 Yield Coins)`
- Building palette cards (costing Raw EcoCoins, but increasing Passive Yield Coins).
- Active adjacency bonus:
  - `Solar Farm + EV Charger gives +25% Yield Coin income.`

Interaction:

- Palette should visually feel drag-ready.
- Highlight adjacency bonus with a green pulse.

## Screen 5: Community

Primary purpose:

Show community sustainability without turning the cockpit into a social media app.

Main zones:

- UTAR Green Week progress:
  - `386 / 500 kg CO2`
  - reward: `100 EcoCoins + rare campus tree`
- Leaderboard:
  - Ben: `91 eco-score`, `12.4 kg CO2`
  - Aina: `88`, `11.8 kg`
  - Wei: `84`, `9.7 kg`
  - Kumar: `82`, `8.9 kg`
  - Team FEGT: `79 avg`, `54 kg weekly`
- Campus carbon map:
  - green smooth-driving routes,
  - amber/red braking hotspot.
- Team challenges:
  - Smooth Operators
  - No Hard Brake Day
  - Million Meter March

## Screen 6: Fleet Diagnostics

Primary purpose:

Show the scalable institutional version for campus EV fleets.

Main zones:

- Metrics:
  - Active EVs: `6`
  - Avg score: `78`
  - CO2 month: `2.3 t`
  - Alerts: `3`
- Fleet table:
  - Shuttle 01: live, score 86, no alerts.
  - Shuttle 02: live, score 73, hard braking.
  - Shuttle 03: idle, score 69, vibration.
  - Shuttle 04: live, score 81, normal.
  - Demo Unit: sensor live, ESP32 connected.
- Fleet risk map.
- Insights:
  - `Vehicle 03 shows unusual vibration. Inspect tyre pressure or hardware mount.`
  - `Gate Road has repeated hard-braking clusters.`
  - `Campus fleet saved 2.3 tonnes CO2 this month versus petrol baseline.`

## Prototype Interaction

For every frame:

- All bottom dock mode chips should navigate to the matching screen.
- Use `ON_CLICK`.
- Navigation: `NAVIGATE`.
- Transition: `SMART_ANIMATE`, ease-out, 0.25s.

Optional interaction polish:

- Route segmented control changes active mode.
- Energy panel expands charger details.
- Eco-City building cards have hover variants showing their Yield Coin generation.

## Why This Is Better

The old UI looked like a website dashboard. This redesign should feel like:

- a real EV centre console,
- a live hardware demo surface,
- a sustainability cockpit,
- and a premium hackathon pitch screen.

Judges should immediately understand: this belongs inside a car, not only on a laptop browser.

