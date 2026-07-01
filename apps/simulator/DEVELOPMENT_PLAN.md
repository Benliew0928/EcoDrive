# EcoDrive+ Driving Simulator Development Plan

## Current Direction

Simulator name: **Eco GP Route Chase**.

The simulator combines a cinematic EV driving feel with a clean in-car dashboard/HMI. It should feel like a polished driving game cockpit, not a separate website full of fake demo panels, while still teaching why smoother eco-routes save energy.

The dashboard direction is now: **make the dashboard part of the car experience**. The current external dashboard app can be used as a rough visual reference only, but the final demo should prioritize a simple, believable cockpit display inside the simulator. First-person cockpit view can be developed later after the driving, camera, and data model feel stable.

Avoid overusing fake data. The main pitch screen should show only values produced by the simulator or ESP32 pipeline: speed, throttle, brake, steering, eco-score, route choice, battery/range estimate, current event, and hardware connection state. Rewards, city, fleet, and community screens are future optional extras, not the core demo.

## Progress Tracker

| Phase | Status | Owner | Priority | Notes |
|---|---|---|---|---|
| 1. Foundation Setup | Complete | Team EcoDrive | High | Next.js simulator app, dependencies, folder structure |
| 2. Self-Created Demo Map | Complete | Team EcoDrive | High | Fictional neon EV route with eco/fast branches |
| 3. Driving Scene | Complete | Team EcoDrive | High | Third-person EV camera, movement, physics feel |
| 4. Cross-Device Controls | Complete | Team EcoDrive | High | Touch, keyboard, and Xbox-style controller normalized into one control state |
| 5. Touch Pressure Simulation | Complete | Team EcoDrive | High | Pointer pressure, touch force, pedal depth, and hold-time ramping |
| 6. Eco Behavior Model | Complete | Team EcoDrive | High | Harsh brake, aggressive acceleration, overspeed, smooth streaks, regen events |
| 7. ESP32 Packet Integration | Not Started | Team EcoDrive | High | Send normalized JSON every 200ms |
| 8. In-Car Dashboard/HMI | Not Started | Team EcoDrive | High | Simple cockpit display inside simulator, using real simulator/ESP32 telemetry |
| 9. Cockpit View and Visual Polish | Not Started | Team EcoDrive | High | Cleaner UI, first-person cockpit preparation, less fake demo data |
| 10. UTAR Campus Map | In Progress | Team EcoDrive | Medium | Handmade UTAR Kampar loop based on official campus map anchors |

## Detailed Phase Plan

### 1. Foundation Setup

Purpose: create the simulator app foundation without building gameplay yet.

Deliverables:

- Set up the simulator as a Next.js + React + TypeScript app.
- Add React Three Fiber, Drei, Rapier, Zustand, and WebSocket client utilities.
- Create a landscape-first layout that works on iPad, laptop browser, and external monitor.
- Keep the simulator focused on one play screen, not a website with many pages.

Acceptance criteria:

- Simulator app starts locally.
- TypeScript build passes.
- Empty 3D canvas or starter scene renders.
- No ESP32 or dashboard dependency is required to open the simulator.

### 2. Self-Created Demo Map

Purpose: create the first playable fictional map before attempting any real UTAR-inspired environment.

Deliverables:

- Build a fictional neon EV route with two visible branches.
- Add Eco Route branch using green/cyan lighting, smoother turns, and regen zones.
- Add Fast Route branch using red/amber warnings, traffic lights, stop-start zones, and harsher braking risk.
- Add road pieces, barriers, checkpoint gates, route signs, and simple city lighting.
- Use low-poly or stylized-realistic assets to keep iPad performance stable.

Acceptance criteria:

- Player can clearly tell the Eco Route and Fast Route apart.
- Route fork is readable while driving.
- Map has enough visual drama for a pitching session.
- No Google Maps or UTAR imagery is used.

### 3. Driving Scene

Purpose: make the simulator feel like a real driving experience.

Deliverables:

- Add third-person chase camera behind the EV.
- Implement basic acceleration, braking, steering, speed, friction, and road alignment.
- Add simplified physics that feels believable but does not try to become a full racing simulator.
- Add camera shake, green smooth-driving glow, red harsh-brake flash, and route bonus popups.

Acceptance criteria:

- Car can complete the fictional route.
- Acceleration and braking are visually understandable.
- Harsh braking feels different from smooth braking.
- Camera remains stable enough for touch play on iPad.

### 4. Cross-Device Controls

Purpose: allow the simulator to be played on iPad, laptop keyboard, laptop touch screen, and Xbox controller.

Deliverables:

- Touch controls: large gas and brake pedal zones.
- Keyboard controls: `WASD`, arrow keys, and `Space`.
- Xbox controls: right trigger throttle, left trigger brake, left stick steering.
- Normalize all inputs into one internal control state:

```ts
type SimulatorControls = {
  throttle: number; // 0-1
  brake: number; // 0-1
  steering: number; // -1 to 1
};
```

Acceptance criteria:

- iPad can drive using touch only.
- Laptop can drive using keyboard only.
- Xbox controller can drive using analog trigger and stick input.
- HUD shows the active control mode.

### 5. Touch Pressure Simulation

Purpose: simulate throttle and brake force even when real touch pressure is not available.

Deliverables:

- Use `PointerEvent.pressure` when the browser and hardware report real pressure.
- Use `Touch.force` when available.
- Fall back to pedal position and hold-time ramping:
  - deeper touch inside pedal zone means stronger force,
  - holding the pedal ramps force up,
  - lifting the finger decays force smoothly.
- Show live throttle and brake force bars in the HUD.

Acceptance criteria:

- Touch controls never feel purely on/off.
- Devices without pressure support still produce gradual throttle and brake force.
- Judges can see throttle/brake force changing live.

### 6. Eco Behavior Model

Purpose: detect driving behavior that the ESP32 and dashboard can score.

Deliverables:

- Detect harsh braking.
- Detect aggressive acceleration.
- Detect smooth driving streaks.
- Detect overspeed moments.
- Detect regen-zone success.
- Generate local simulator events before ESP32 integration.

Acceptance criteria:

- Harsh braking creates a red warning event.
- Smooth driving creates a green reward event.
- Eco Route produces better expected outcomes than Fast Route.
- Event names are stable enough to use in ESP32 packets later.

### 7. ESP32 Packet Integration

Purpose: send normalized simulator driving input to the ESP32.

Deliverables:

- Send simulator-to-ESP32 JSON packet every 200ms.
- Add connection status HUD states:
  - disconnected,
  - simulator-only,
  - ESP32 connected.
- Add retry/backoff behavior for demo reliability.
- Allow software-only fallback if ESP32 is not connected.

Acceptance criteria:

- Packet shape matches the contract in this document.
- Packet interval is close to 200ms during normal gameplay.
- Connection loss does not crash the simulator.
- Simulator-only demo mode remains usable.

### 8. In-Car Dashboard/HMI

Purpose: replace the separate fake-data-heavy dashboard idea with a simple in-car dashboard that belongs inside the simulator.

Deliverables:

- Create a compact cockpit dashboard overlay or in-car display surface.
- Show only core live values:
  - speed,
  - gear,
  - throttle force,
  - brake/reverse force,
  - steering input,
  - eco-score,
  - route choice,
  - battery/range estimate,
  - current driving event,
  - ESP32/simulator connection state.
- Use simulator telemetry as the source of truth first.
- Later replace or enrich simulator telemetry with processed ESP32 telemetry when the hardware pipeline is ready.
- Keep route choice inside the simulator experience, either as:
  - a small in-car navigation panel, or
  - a simple pre-drive route selector overlay.
- Remove or avoid fake leaderboard, fleet, reward, city, and unrelated large dashboard panels from the core driving demo.

Acceptance criteria:

- Dashboard values visibly react to actual driving input.
- No major display value is purely decorative unless clearly labelled as future/placeholder.
- The UI feels like an EV cockpit screen, not a website dashboard.
- The dashboard does not block the driving view on iPad or laptop.
- The demo still works without ESP32 by using local simulator telemetry only.

### 9. Cockpit View and Visual Polish

Purpose: make the simulator feel premium, simpler, and more believable during the live pitch.

Deliverables:

- Simplify the HUD so it does not look cluttered or glitchy.
- Keep only pitch-critical UI:
  - speed,
  - route,
  - eco-score,
  - input force,
  - warning/reward event.
- Add countdown start only if it improves the driving flow.
- Add route fork callout in a minimal navigation style.
- Add a small reward/regen indicator, not a large fake gamification popup.
- Add finish summary.
- Add controller/keyboard/touch hint overlay.
- Add fallback simulator-only mode for no ESP32 or no controller.
- Prepare the scene for a future first-person cockpit camera:
  - steering wheel,
  - dashboard panel position,
  - windshield framing,
  - readable in-car instrument cluster,
  - camera toggle between chase view and cockpit view.

Acceptance criteria:

- First 30 seconds of gameplay look impressive.
- UI is readable, uncluttered, and stable.
- Route choice is obvious without long explanation.
- Judges can understand the input, ESP32, and in-car dashboard connection.
- Demo can continue even if one hardware input method is unavailable.

## Dashboard Philosophy

- The dashboard is not a separate fake-data website for the main demo.
- The dashboard should feel like the screen inside the simulator car.
- The external dashboard app should be treated as a temporary prototype/reference until it is simplified or merged into the simulator cockpit.
- Use real simulator values wherever possible.
- Use ESP32 values when the hardware pipeline is ready.
- Avoid filling the demo with fake community, fleet, marketplace, or city data unless those features are explicitly being presented as future scope.
- A simpler, cleaner cockpit is better than a busy dashboard with many fake numbers.

### 10. UTAR Campus Map

Purpose: add a source-informed UTAR Kampar campus loop after the main simulator foundation is playable.

Deliverables:

- Build a simplified UTAR Kampar internal loop with East Gate and South Gate guardhouses.
- Use the official UTAR campus map as the spatial reference for lakes, faculty blocks, road direction, and landmarks.
- Add Lake 18, Lake 19, Library, FEGT, Faculty of Science, FBF, Lecture Complex I, Student Pavilion areas, Heritage Hall, Learning Complex I, west academic blocks, football field, parking zones, trees, and security checkpoints.
- Keep the environment handmade and game-optimized rather than importing map imagery as a texture.
- Preserve the eco-route lesson by making the lake route smoother and the academic spine faster but riskier.

Acceptance criteria:

- Core simulator controls and eco model remain stable after the map swap.
- No direct Google Maps imagery is used as a game texture.
- Campus version still runs smoothly on iPad-class hardware.
- The map supports the same Eco Route versus Fast Route lesson.
- Judges can recognize UTAR-specific anchors without needing a full real-world campus reconstruction.

## Control Mapping

| Mode | Input | Mapping |
|---|---|---|
| Touch | Gas pedal zone | Throttle force from pressure, position, or hold-time ramp |
| Touch | Brake pedal zone | Brake force from pressure, position, or hold-time ramp |
| Touch | Steering zone or drag | Steering from horizontal drag or tilt-like screen control |
| Keyboard | `W` or `ArrowUp` | Throttle ramps from 0 to 1 |
| Keyboard | `S` or `ArrowDown` | Brake ramps from 0 to 1 |
| Keyboard | `A/D` or `ArrowLeft/ArrowRight` | Steering ramps from -1 to 1 |
| Keyboard | `Space` | Emergency brake demo event |
| Xbox Controller | Right trigger | Analog throttle |
| Xbox Controller | Left trigger | Analog brake |
| Xbox Controller | Left stick | Analog steering |
| Xbox Controller | `A` button | Start or confirm route |
| Xbox Controller | `Y` button | Toggle camera or HUD mode |

## Packet Contract

Simulator-to-ESP32 packet, sent every 200ms during active driving:

```json
{
  "throttle": 0.65,
  "brake": 0.0,
  "steering": 0.12,
  "speedKmh": 52.3,
  "routeChoice": "eco",
  "event": "smooth_segment",
  "timestamp": 1719648000
}
```

Field notes:

- `throttle`: normalized throttle force from `0` to `1`.
- `brake`: normalized brake force from `0` to `1`.
- `steering`: normalized steering value from `-1` left to `1` right.
- `speedKmh`: current simulator speed in kilometers per hour.
- `routeChoice`: `eco`, `fast`, or `unknown`.
- `event`: current simulator event, such as `smooth_segment`, `smooth_streak`, `harsh_brake`, `aggressive_acceleration`, `overspeed`, `regen_success`, `fast_route_warning`, or `reverse_mode`.
- `timestamp`: Unix timestamp or demo timestamp used by the ESP32 pipeline.

The in-car dashboard should render these packet fields directly where possible. Any extra values, such as battery estimate or range estimate, should be derived from the simulator/ESP32 state rather than hard-coded as fake dashboard content.

## UTAR Map Policy

- Do not build the UTAR map first.
- Do not recreate the full real campus in 3D.
- Do not use Google Maps imagery directly as game textures.
- Build the fictional neon demo route first.
- Only expand the UTAR-inspired map after the simulator, controls, ESP32 packet integration, and in-car dashboard flow are stable.
- UTAR version should use simplified handmade or open-data-informed landmarks, not a full real-world copy.

## Testing Checklist

| Check | Status | Notes |
|---|---|---|
| Plan file exists at `apps/simulator/DEVELOPMENT_PLAN.md` | Done | Documentation file created |
| Tracker table has all 10 phases | Done | Includes owner, status, priority, notes |
| Every phase has deliverables | Done | Listed under each phase |
| Every phase has acceptance criteria | Done | Listed under each phase |
| README can link to this plan | Done | README updated to reference this file |
| Simulator code remains untouched | Superseded | Phases 1-3 are now implemented |
