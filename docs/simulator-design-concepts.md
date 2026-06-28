# Driving Simulator Design Concepts

Status: design first, no implementation yet.

## Recommended Stack

For the cool 3D cross-device simulator direction, use:

- Next.js + React + TypeScript for the app shell and routing.
- Three.js through React Three Fiber for the 3D driving scene.
- `@react-three/drei` for cameras, helpers and production-friendly scene utilities.
- `@react-three/rapier` for lightweight physics if we need collisions, braking zones and road boundaries.
- Zustand for local driving state such as throttle, brake, steering and session status.
- WebSocket JSON packets for simulator to ESP32 communication.
- Browser Pointer Events and Touch Events for iPad and laptop touch screens.
- Keyboard input for laptop play: WASD or arrow keys.
- Browser Gamepad API for Xbox controller support.

Fallback if performance becomes risky on iPad Safari:

- Phaser.js for a 2.5D or top-down driving game.
- Canvas-only rendering with fewer 3D effects.

Recommendation: start with React Three Fiber and keep the art direction stylized-realistic, not ultra-realistic. That gives the pitch a premium 3D look while staying feasible for a hackathon demo.

## Input Model

The simulator should support three control modes:

1. Touch mode for iPad or touch laptops.
2. Keyboard mode for laptops.
3. Xbox controller mode for analog triggers and steering.

### Touch Pressure Strategy

True finger pressure is not reliable on every browser and device. The simulator should use a layered strategy:

- Use `PointerEvent.pressure` when the device reports real pressure.
- Use `Touch.force` on devices that expose it.
- Fall back to pedal position and hold-time ramping:
  - touching lower/deeper inside the pedal zone means stronger throttle or brake,
  - holding the pedal gradually ramps force up,
  - lifting the finger decays force smoothly.

This lets the demo feel pressure-sensitive even when the browser only gives normal touch input.

### Keyboard Strategy

Keyboard is digital, so the simulator should simulate analog behavior:

- `W` or `ArrowUp`: throttle ramps from 0 to 1.
- `S` or `ArrowDown`: brake ramps from 0 to 1.
- `A/D` or arrows: steering ramps left/right.
- `Space`: stronger brake or handbrake-style emergency stop for demo events.

### Xbox Controller Strategy

Xbox controller should be the best analog mode:

- right trigger: throttle force,
- left trigger: brake force,
- left stick: steering,
- `A`: start or confirm route,
- `Y`: toggle camera/HUD mode.

The triggers should map directly to the same simulator packet fields sent to the ESP32.

## Product Design Brief Playback

Design a single-screen landscape driving simulator for EcoDrive+ that works on iPad, laptop keyboard, laptop touch screen and Xbox controller.

The simulator should feel like a premium EV/F1-inspired driving game, not a normal website. It should show the road, car, speed, eco-score hint, route choice, gas pedal and brake pedal. The purpose is to generate driving behavior that can later be sent to the ESP32: throttle, brake, steering, speed and harsh-brake events.

Visual source:

- EcoDrive+ cockpit HMI style from the Figma/static dashboard: dark glass, eco green, telemetry cyan, amber warning, red danger.
- Modern racing-game HUDs and EV cockpit displays.

Interactivity level for now:

- Design only.
- No simulator implementation until a direction is chosen.

## Combined Direction: Eco GP Route Chase

This is the recommended merged concept. It combines the cinematic racing feel of Concept 1 with the route-choice clarity of Concept 2.

Core idea:

- Third-person chase camera behind a sleek EV.
- Neon eco racing line on the road.
- Route fork moments where the player clearly sees:
  - Fast Route: shorter, red/amber, traffic lights, stop-start braking.
  - Eco Route: slightly longer, green/cyan, smoother turns, regen zones.
- HUD shows speed, throttle force, brake force, steering, eco-score hint, route bonus and ESP32 connection status.
- Pedals are large touch zones on tablets, but fade into controller/keyboard HUD hints on laptop.
- Harsh braking causes red edge flash and visible ESP32 event tag.
- Smooth route segments create green pulse and EcoCoin reward tag.

This should be the main visual direction for Product Design mockups.

## Earlier Concept 1: Eco GP Cockpit

Third-person chase camera behind a sleek EV on a smooth highway. The UI feels like a racing game cockpit: large speed readout, soft racing line, throttle/brake pressure arcs and subtle eco-score glow around the vehicle.

Best for:

- maximum "wow" in the pitch,
- easy explanation of throttle and braking,
- cinematic presentation on iPad.

Trade-off:

- harder to build than 2D, but still feasible with simplified physics.

## Earlier Concept 2: Neon City Regen Run

Night city route with glowing lane lines, traffic lights, regen zones and stop-start danger zones. The interface teaches eco-driving by making good driving paths visibly green and harsh braking areas amber/red.

Best for:

- showing why route choice matters,
- stronger connection to Eco-Route Planner,
- dramatic visual contrast.

Trade-off:

- more visual elements to keep readable on a small iPad screen.

## Earlier Concept 3: Campus Eco Rally

A stylized UTAR campus loop with recognisable campus-like roads, shuttle stops, crosswalks and EV charging hubs. The game feels more local and pitch-specific, with smooth-driving zones and campus challenge branding.

Best for:

- hackathon storytelling,
- campus fleet/community relevance,
- easier to connect to rewards and leaderboard.

Trade-off:

- less futuristic than the racing concept unless the lighting and HUD are polished.

Feasibility note:

- Building the entire UTAR campus in 3D is not realistic for the first hackathon build.
- A feasible version would be a campus-inspired route loop with simple roads, trees, shuttle stops and a few low-poly landmark silhouettes.
- Avoid using Google Maps imagery as direct game textures unless licensing is cleared.
- If real campus geometry is needed later, use open map data or manually modeled simplified landmarks instead of trying to recreate the whole campus.
