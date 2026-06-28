# EcoDrive+ Driving Simulator Development Plan

## Current Direction

Simulator name: **Eco GP Route Chase**.

The simulator combines a cinematic EV racing feel with clear eco-route decision moments. It should feel like a polished driving game, not a website, while still teaching why smoother eco-routes save energy and earn EcoCoins.

Build a fictional self-created demo map first. The UTAR-inspired map is future scope and should only be considered after the core simulator, controls, ESP32 packet flow, and dashboard integration are stable.

## Progress Tracker

| Phase | Status | Owner | Priority | Notes |
|---|---|---|---|---|
| 1. Foundation Setup | Complete | Team EcoDrive | High | Next.js simulator app, dependencies, folder structure |
| 2. Self-Created Demo Map | Complete | Team EcoDrive | High | Fictional neon EV route with eco/fast branches |
| 3. Driving Scene | Complete | Team EcoDrive | High | Third-person EV camera, movement, physics feel |
| 4. Cross-Device Controls | Not Started | Team EcoDrive | High | Touch, keyboard, Xbox controller |
| 5. Touch Pressure Simulation | Not Started | Team EcoDrive | High | Real pressure when available, fallback ramping |
| 6. Eco Behavior Model | Not Started | Team EcoDrive | High | Harsh brake, smooth driving, regen zone events |
| 7. ESP32 Packet Integration | Not Started | Team EcoDrive | High | Send normalized JSON every 200ms |
| 8. Dashboard Integration | Not Started | Team EcoDrive | Medium | Start route command and demo sync |
| 9. Visual and Pitch Polish | Not Started | Team EcoDrive | Medium | HUD, effects, fallback demo mode |
| 10. Future UTAR Map | Future | Team EcoDrive | Low | Only after fictional map is stable |

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

### 8. Dashboard Integration

Purpose: connect the simulator to the main EcoDrive+ presentation flow.

Deliverables:

- Match dashboard route concepts: Eco Route selected on dashboard, simulator route begins.
- Later receive a `start_route` command from the dashboard or local relay server.
- Simulator sends raw driving behavior to ESP32.
- ESP32 sends processed telemetry to the dashboard.

Acceptance criteria:

- Demo flow can start from the dashboard route selection.
- Simulator shows route context that matches the dashboard.
- Dashboard can explain why Eco Route was chosen before driving starts.

### 9. Visual and Pitch Polish

Purpose: make the simulator feel premium during the live pitch.

Deliverables:

- Add cinematic HUD.
- Add countdown start.
- Add route fork callout.
- Add EcoCoin reward popup.
- Add finish summary.
- Add controller/keyboard/touch hint overlay.
- Add fallback demo mode for no ESP32 or no controller.

Acceptance criteria:

- First 30 seconds of gameplay look impressive.
- Route choice is obvious without long explanation.
- Judges can understand the input, ESP32, and dashboard connection.
- Demo can continue even if one hardware input method is unavailable.

### 10. Future UTAR Map

Purpose: add local campus flavor only after the main simulator is complete.

Deliverables:

- Build a simplified UTAR-inspired route loop.
- Use handmade or open-data-informed road shapes.
- Add campus-like landmarks, shuttle stops, gates, trees, crosswalks, and EV chargers.
- Keep the environment stylized rather than trying to recreate the full real campus.

Acceptance criteria:

- Core simulator is already stable before this phase starts.
- No direct Google Maps imagery is used as game texture.
- Campus version still runs smoothly on iPad.
- The map supports the same Eco Route versus Fast Route lesson.

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
- `event`: current simulator event, such as `smooth_segment`, `harsh_brake`, `aggressive_acceleration`, `regen_success`, or `none`.
- `timestamp`: Unix timestamp or demo timestamp used by the ESP32 pipeline.

## UTAR Map Policy

- Do not build the UTAR map first.
- Do not recreate the full real campus in 3D.
- Do not use Google Maps imagery directly as game textures.
- Build the fictional neon demo route first.
- Only consider a UTAR-inspired map after the simulator, controls, ESP32 packet integration, and dashboard demo flow are complete.
- Future UTAR version should use simplified handmade or open-data-informed landmarks, not a full real-world copy.

## Testing Checklist

| Check | Status | Notes |
|---|---|---|
| Plan file exists at `apps/simulator/DEVELOPMENT_PLAN.md` | Done | Documentation file created |
| Tracker table has all 10 phases | Done | Includes owner, status, priority, notes |
| Every phase has deliverables | Done | Listed under each phase |
| Every phase has acceptance criteria | Done | Listed under each phase |
| README can link to this plan | Done | README updated to reference this file |
| Simulator code remains untouched | Superseded | Phases 1-3 are now implemented |
