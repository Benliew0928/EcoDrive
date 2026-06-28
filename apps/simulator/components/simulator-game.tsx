"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, PerspectiveCamera, Stars } from "@react-three/drei";
import {
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  Vector3
} from "three";
import { useEffect, useMemo, useRef } from "react";
import { clamp, damp, useGameStore, type GameEvent, type RouteChoice } from "../lib/game-store";
import { mapLandmarks, routeMarkers, routePaths, skylineBlocks, type RoutePath } from "../data/demo-map";

type VehicleState = {
  x: number;
  z: number;
  yaw: number;
  speed: number;
  distance: number;
  throttle: number;
  brake: number;
  steering: number;
  wheelAngle: number;
  reverseHold: number;
  selectedRoute: RouteChoice;
  ecoScore: number;
  lastHudAt: number;
};

type RoadSample = {
  point: Vector3;
  halfWidth: number;
};

const eventLabels: Record<GameEvent, string> = {
  launch_ready: "Launch ready. Hold W or press the gas pedal.",
  route_fork: "Route fork ahead. Green path saves energy.",
  smooth_segment: "Smooth segment. Eco-score climbing.",
  harsh_brake: "Harsh brake detected. ESP32 would flash red.",
  regen_success: "Regen zone captured. +EcoCoin preview.",
  fast_route_warning: "Fast route warning: stop-start cluster ahead.",
  reverse_mode: "Reverse engaged. Brake pedal is now backing the EV.",
  finish_loop: "Loop complete. Returning to launch spine."
};

export function SimulatorGame() {
  useKeyboardInput();
  const telemetry = useGameStore((state) => state.telemetry);
  const controlMode = useGameStore((state) => state.controlMode);
  const speedLabel = Math.round(telemetry.speedKmh);
  const gearLabel = telemetry.speedKmh < -1 ? "R" : telemetry.speedKmh > 1 ? "D" : "P";
  const isWarning = telemetry.event === "harsh_brake" || telemetry.event === "fast_route_warning";
  const showBonus = telemetry.event === "regen_success" || telemetry.event === "finish_loop";

  return (
    <main className="simulator-shell">
      <div className="canvas-stage">
        <Canvas dpr={[1, 1.65]} gl={{ antialias: true, powerPreference: "high-performance" }}>
          <color attach="background" args={["#030707"]} />
          <fog attach="fog" args={["#031112", 48, 190]} />
          <SceneContent />
        </Canvas>
      </div>
      <div className="hud">
        <section className="top-hud">
          <div className="brand-lockup">
            <p>EcoDrive+ simulator</p>
            <strong>Eco GP Route Chase</strong>
          </div>
          <div className="speed-stack">
            <em>{gearLabel}</em>
            <strong>{speedLabel}</strong>
            <span>km/h</span>
          </div>
          <div className="status-cluster">
            <span className="status-pill">Simulator only</span>
            <span className="status-pill status-pill--muted">ESP32 phase later</span>
          </div>
        </section>

        <section className="route-brief">
          <p>Neon city demo loop</p>
          <h1>Split, prove the route logic, merge, score.</h1>
          <div className="route-sequence">
            <span>Split</span>
            <span>Drive consequence</span>
            <span>Merge score</span>
          </div>
          <div className="route-split">
            <div className="route-choice route-choice--eco">
              <strong>Eco Bypass</strong>
              <small>Longer outer loop, two regen districts, smoother steering.</small>
            </div>
            <div className="route-choice route-choice--fast">
              <strong>Downtown Fast Cut</strong>
              <small>Shorter corridor, traffic-light stack, harsh brake risk.</small>
            </div>
          </div>
        </section>

        <section className="event-callout">
          <p>Live driving event</p>
          <strong>{eventLabels[telemetry.event]}</strong>
        </section>

        <section className={`bonus-toast ${showBonus ? "bonus-toast--active" : ""}`}>
          <p>Eco reward window</p>
          <strong>{telemetry.event === "finish_loop" ? "Loop complete" : "+50 EcoCoin regen capture"}</strong>
        </section>

        <section className="bottom-hud">
          <div className="meter-stack">
            <ForceMeter label="Throttle force" value={telemetry.throttle} />
            <ForceMeter label="Brake / reverse force" value={telemetry.brake} brake />
          </div>
          <div className="mode-hint">
            <p>Active route</p>
            <strong>{telemetry.routeChoice === "unknown" ? "Approaching fork" : telemetry.routeChoice.toUpperCase()}</strong>
            <p>{controlMode} | Eco-score {Math.round(telemetry.ecoScore)}</p>
          </div>
          <TouchControls />
        </section>
      </div>
      <div className={`edge-warning ${isWarning ? "edge-warning--active" : ""}`} />
      <div className="scanlines" />
    </main>
  );
}

function SceneContent() {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 10, 22]} fov={60} />
      <ambientLight intensity={0.32} />
      <directionalLight castShadow intensity={2.4} position={[16, 24, 10]} shadow-mapSize={[1024, 1024]} />
      <pointLight color="#37e58f" intensity={45} position={[-28, 5, -118]} distance={50} />
      <pointLight color="#37e58f" intensity={36} position={[-68, 7, -230]} distance={70} />
      <pointLight color="#ff5b5b" intensity={38} position={[72, 6, -220]} distance={80} />
      <pointLight color="#38bdf8" intensity={34} position={[2, 7, -400]} distance={70} />
      <Stars count={1100} depth={130} factor={4} fade speed={0.18} />
      <GroundPlane />
      <RoadNetwork />
      <NeonCity />
      <MapLandmarks />
      <RouteSigns />
      <DriveRig />
    </>
  );
}

function GroundPlane() {
  return (
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, -210]}>
      <planeGeometry args={[280, 700, 1, 1]} />
      <meshStandardMaterial color="#051011" roughness={0.88} metalness={0.18} />
    </mesh>
  );
}

function RoadNetwork() {
  return (
    <group>
      {routePaths.map((path) => (
        <RoadPath key={path.id} path={path} />
      ))}
      <EnergyGates />
    </group>
  );
}

function RoadPath({ path }: { path: RoutePath }) {
  const geometry = useMemo(() => createRoadGeometry(path.points, path.width), [path]);
  const sideOffset = path.id === "eco" ? -4.2 : path.id === "fast" ? 4.2 : 0;

  return (
    <group>
      <mesh receiveShadow>
        <primitive object={geometry} attach="geometry" />
        <meshStandardMaterial
          color="#0b1416"
          emissive={new Color(path.accent).multiplyScalar(0.05)}
          metalness={0.32}
          roughness={0.68}
          side={DoubleSide}
        />
      </mesh>
      <NeonGuide points={path.points} color={path.accent} radius={path.id === "main" ? 0.12 : 0.16} />
      <NeonGuide points={path.points} color={path.accent} opacity={0.42} radius={0.045} xOffset={sideOffset} />
      <NeonGuide points={path.points} color="#e5f7ff" opacity={0.18} radius={0.035} xOffset={path.width / 2 - 1.1} />
      <NeonGuide points={path.points} color="#e5f7ff" opacity={0.18} radius={0.035} xOffset={-path.width / 2 + 1.1} />
    </group>
  );
}

function NeonGuide({
  points,
  color,
  opacity = 0.9,
  radius,
  xOffset = 0
}: {
  points: Vector3[];
  color: string;
  opacity?: number;
  radius: number;
  xOffset?: number;
}) {
  const curve = useMemo(() => {
    const raised = points.map((point) => point.clone().add(new Vector3(xOffset, 0.12, 0)));
    return new CatmullRomCurve3(raised, false, "catmullrom", 0.35);
  }, [points, xOffset]);

  return (
    <mesh>
      <tubeGeometry args={[curve, 96, radius, 10, false]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} />
    </mesh>
  );
}

function EnergyGates() {
  return (
    <group>
      <Gate position={[0, 0.1, -78]} color="#f5b84b" label="ROUTE SPLIT" />
      <Gate position={[-58, 0.1, -158]} color="#37e58f" label="REGEN LINE" />
      <Gate position={[-66, 0.1, -248]} color="#37e58f" label="SOLAR REGEN" />
      <Gate position={[75, 0.1, -196]} color="#ff5b5b" label="STOP START" />
      <Gate position={[70, 0.1, -282]} color="#ff5b5b" label="BRAKE RISK" />
      <Gate position={[4, 0.1, -402]} color="#38bdf8" label="MERGE SCORE" />
      <Gate position={[0, 0.1, -472]} color="#38bdf8" label="UPLOAD FINISH" />
    </group>
  );
}

function Gate({ position, color, label }: { position: [number, number, number]; color: string; label: string }) {
  return (
    <group position={position}>
      <mesh position={[-7, 2.8, 0]}>
        <boxGeometry args={[0.4, 5.6, 0.4]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.8} />
      </mesh>
      <mesh position={[7, 2.8, 0]}>
        <boxGeometry args={[0.4, 5.6, 0.4]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.8} />
      </mesh>
      <mesh position={[0, 5.45, 0]}>
        <boxGeometry args={[14.4, 0.35, 0.4]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.25} />
      </mesh>
      <Html center distanceFactor={18} position={[0, 6.2, 0]}>
        <div style={{ color, fontSize: 10, fontWeight: 900, whiteSpace: "nowrap" }}>{label}</div>
      </Html>
    </group>
  );
}

function NeonCity() {
  return (
    <group>
      {skylineBlocks.map((block) => (
        <group key={block.id} position={block.position}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={block.scale} />
            <meshStandardMaterial color={block.color} emissive={block.light} emissiveIntensity={0.08} metalness={0.4} roughness={0.55} />
          </mesh>
          <mesh position={[0, block.scale[1] / 2 + 0.08, 0]}>
            <boxGeometry args={[block.scale[0] * 0.72, 0.08, block.scale[2] * 0.72]} />
            <meshBasicMaterial color={block.light} transparent opacity={0.58} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function MapLandmarks() {
  return (
    <group>
      {mapLandmarks.map((landmark) => (
        <group key={landmark.id} position={landmark.position}>
          <mesh position={[0, landmark.size[1] / 2, 0]}>
            <boxGeometry args={landmark.size} />
            <meshStandardMaterial color="#071113" emissive={landmark.color} emissiveIntensity={0.16} metalness={0.52} roughness={0.34} />
          </mesh>
          <mesh position={[0, landmark.size[1] + 0.22, 0]}>
            <boxGeometry args={[landmark.size[0] * 0.86, 0.14, landmark.size[2] * 0.76]} />
            <meshBasicMaterial color={landmark.color} transparent opacity={0.72} />
          </mesh>
          <Html center distanceFactor={22} position={[0, landmark.size[1] + 1.2, 0]}>
            <div style={{ color: landmark.color, fontSize: 9, fontWeight: 900, whiteSpace: "nowrap" }}>{landmark.label}</div>
          </Html>
        </group>
      ))}
    </group>
  );
}

function RouteSigns() {
  return (
    <group>
      {routeMarkers.map((marker) => (
        <group key={marker.label} position={marker.position}>
          <mesh>
            <boxGeometry args={[8.6, 1.2, 0.25]} />
            <meshStandardMaterial color="#081112" emissive={marker.color} emissiveIntensity={0.38} />
          </mesh>
          <Html center distanceFactor={20} position={[0, 0.03, 0.18]}>
            <div style={{ color: marker.color, fontSize: 9, fontWeight: 900, whiteSpace: "nowrap" }}>{marker.label}</div>
          </Html>
        </group>
      ))}
    </group>
  );
}

function DriveRig() {
  const carRef = useRef<Group>(null);
  const auraRef = useRef<Mesh>(null);
  const roadSamples = useMemo(
    () =>
      routePaths.flatMap((path) =>
        sampleCurve(path.points, 120).map((point) => ({
          point,
          halfWidth: path.width / 2
        }))
      ),
    []
  );
  const stateRef = useRef<VehicleState>({
    x: 0,
    z: 48,
    yaw: 0,
    speed: 0,
    distance: 0,
    throttle: 0,
    brake: 0,
    steering: 0,
    wheelAngle: 0,
    reverseHold: 0,
    selectedRoute: "unknown",
    ecoScore: 84,
    lastHudAt: 0
  });
  const camera = useThree((state) => state.camera);

  useFrame((renderState, frameDelta) => {
    const dt = Math.min(frameDelta, 0.05);
    const vehicle = stateRef.current;
    const store = useGameStore.getState();
    const raw = store.rawInput;
    const keys = raw.keys;
    const keyboardThrottle = keys.w || keys.arrowup ? 1 : 0;
    const keyboardBrake = keys.s || keys.arrowdown || keys[" "] ? 1 : 0;
    const keyboardSteer = (keys.a || keys.arrowleft ? -1 : 0) + (keys.d || keys.arrowright ? 1 : 0);
    const hasManualInput = keyboardThrottle || keyboardBrake || keyboardSteer || raw.touchThrottle || raw.touchBrake || raw.touchSteering;
    const targetThrottle = Math.max(raw.touchThrottle, keyboardThrottle, hasManualInput ? 0 : 0.18);
    const targetBrake = Math.max(raw.touchBrake, keyboardBrake);
    const targetSteering = clamp(raw.touchSteering + keyboardSteer, -1, 1);

    vehicle.throttle = damp(vehicle.throttle, targetThrottle, targetThrottle > vehicle.throttle ? 3.2 : 5.6, dt);
    vehicle.brake = damp(vehicle.brake, targetBrake, targetBrake > vehicle.brake ? 5.5 : 7.4, dt);
    vehicle.steering = damp(vehicle.steering, targetSteering, 4.5, dt);

    const speedAbs = Math.abs(vehicle.speed);
    const wantsReverse = vehicle.brake > 0.22 && vehicle.throttle < 0.08;
    const nearStopped = speedAbs < 0.62;
    vehicle.reverseHold =
      wantsReverse && (nearStopped || vehicle.speed < -0.08)
        ? Math.min(vehicle.reverseHold + dt, 0.55)
        : Math.max(0, vehicle.reverseHold - dt * 3.2);
    const reverseDrive = vehicle.speed < -0.1 || vehicle.reverseHold > 0.24;
    const drag = vehicle.speed * speedAbs * 0.024;
    const rolling = speedAbs > 0.08 ? Math.sign(vehicle.speed) * 0.54 : 0;
    let acceleration = vehicle.throttle * 8.9 - drag - rolling;

    if (reverseDrive) {
      acceleration -= vehicle.brake * 6.4;
    } else {
      acceleration -= vehicle.brake * 24;
      if (vehicle.speed <= 0.12 && acceleration < 0) {
        acceleration = 0;
      }
    }

    const steeringDrag = Math.abs(vehicle.steering) * speedAbs * 0.42;
    vehicle.speed = clamp(vehicle.speed + (acceleration - Math.sign(vehicle.speed || 1) * steeringDrag) * dt, -5.2, 23.5);
    if (!reverseDrive && vehicle.speed < 0) {
      vehicle.speed = 0;
    }
    if (Math.abs(vehicle.speed) < 0.035 && vehicle.throttle < 0.04 && !reverseDrive) {
      vehicle.speed = 0;
    }

    const wheelBase = 3.8;
    const speedSteerLimit = clamp(1 - speedAbs / 28, 0.18, 1);
    const maxWheelAngle = ((30 * speedSteerLimit + 4) * Math.PI) / 180;
    vehicle.wheelAngle = damp(vehicle.wheelAngle, vehicle.steering * maxWheelAngle, 9.5, dt);
    const maxYawRate = 0.68 - clamp(speedAbs / 23.5, 0, 1) * 0.34;
    const yawRate = clamp((vehicle.speed / wheelBase) * Math.tan(vehicle.wheelAngle), -maxYawRate, maxYawRate);
    vehicle.yaw += yawRate * dt;
    vehicle.x += Math.sin(vehicle.yaw) * vehicle.speed * dt;
    vehicle.z -= Math.cos(vehicle.yaw) * vehicle.speed * dt;

    const roadGrip = findNearestRoadSample(roadSamples, vehicle.x, vehicle.z);
    if (roadGrip) {
      const roadDistance = Math.sqrt(roadGrip.distanceSq);
      const softLimit = roadGrip.sample.halfWidth * 0.78;
      const hardLimit = roadGrip.sample.halfWidth * 1.18;

      if (roadDistance > softLimit) {
        const pullStrength = clamp((roadDistance - softLimit) / Math.max(1, hardLimit - softLimit), 0, 1);
        const pullRate = 2.8 + pullStrength * 5.2;
        vehicle.x += (roadGrip.sample.point.x - vehicle.x) * pullStrength * pullRate * dt;
        vehicle.z += (roadGrip.sample.point.z - vehicle.z) * pullStrength * pullRate * dt;
        vehicle.speed *= 1 - pullStrength * 0.038;
      }
    }

    vehicle.x = clamp(vehicle.x, -104, 104);
    vehicle.z = clamp(vehicle.z, -520, 96);
    vehicle.distance += speedAbs * dt;

    let routeChoice: RouteChoice = "unknown";
    if (vehicle.z > -64) {
      vehicle.selectedRoute = "unknown";
    }
    if (vehicle.z < -86 && vehicle.z > -386 && vehicle.selectedRoute === "unknown") {
      vehicle.selectedRoute = vehicle.x < 8 ? "eco" : "fast";
    }
    if (vehicle.selectedRoute !== "unknown") {
      routeChoice = vehicle.selectedRoute;
    }

    let event: GameEvent = "smooth_segment";
    if (vehicle.z < 50 && vehicle.z > -96) event = "route_fork";
    if (vehicle.speed < -0.45) event = "reverse_mode";
    if (vehicle.brake > 0.72 && vehicle.speed > 9) event = "harsh_brake";
    if (
      routeChoice === "eco" &&
      ((vehicle.z < -142 && vehicle.z > -178) || (vehicle.z < -238 && vehicle.z > -280) || (vehicle.z < -292 && vehicle.z > -342)) &&
      vehicle.brake < 0.48
    ) {
      event = "regen_success";
    }
    if (routeChoice === "fast" && ((vehicle.z < -126 && vehicle.z > -214) || (vehicle.z < -238 && vehicle.z > -298))) {
      event = "fast_route_warning";
    }

    if (vehicle.z < -504) {
      vehicle.z = 48;
      vehicle.x = 0;
      vehicle.yaw = 0;
      vehicle.speed = 7;
      vehicle.distance = 0;
      vehicle.reverseHold = 0;
      vehicle.selectedRoute = "unknown";
      event = "finish_loop";
    }

    const scoreTarget =
      90 -
      vehicle.brake * 20 -
      Math.abs(vehicle.steering) * 5 -
      (routeChoice === "fast" ? 14 : 0) -
      (event === "reverse_mode" ? 3 : 0) +
      (event === "regen_success" ? 10 : 0);
    vehicle.ecoScore = damp(vehicle.ecoScore, clamp(scoreTarget, 38, 99), 1.7, dt);

    if (carRef.current) {
      carRef.current.position.set(vehicle.x, 0.58, vehicle.z);
      carRef.current.rotation.set(
        vehicle.brake > 0.65 && vehicle.speed > 0 ? -0.035 : vehicle.throttle * 0.015,
        vehicle.yaw,
        -vehicle.steering * Math.min(speedAbs / 26, 1) * 0.055
      );
    }

    if (auraRef.current) {
      const pulse = 0.85 + Math.sin(renderState.clock.elapsedTime * 5.2) * 0.1;
      auraRef.current.scale.setScalar(event === "harsh_brake" ? 1.4 : pulse);
    }

    const forward = new Vector3(Math.sin(vehicle.yaw), 0, -Math.cos(vehicle.yaw));
    const carPosition = new Vector3(vehicle.x, 0.8, vehicle.z);
    const isReverse = vehicle.speed < -0.45;
    const cameraTarget = carPosition
      .clone()
      .add(forward.clone().multiplyScalar(isReverse ? -5 : 12))
      .add(new Vector3(0, 1.25, 0));
    const cameraPosition = carPosition
      .clone()
      .add(forward.clone().multiplyScalar(isReverse ? 10 : -15 - clamp(speedAbs / 23.5, 0, 1) * 3.5))
      .add(new Vector3(0, 8.4 + clamp(speedAbs / 23.5, 0, 1) * 1.8, 0));
    const shakePower =
      (event === "harsh_brake" ? 0.18 : event === "regen_success" ? 0.055 : 0) +
      Math.min(speedAbs / 42, 1) * 0.018;
    const shake = new Vector3(
      Math.sin(renderState.clock.elapsedTime * 42) * shakePower,
      Math.cos(renderState.clock.elapsedTime * 36) * shakePower * 0.42,
      0
    );
    camera.position.lerp(cameraPosition.add(shake), 1 - Math.exp(-11 * dt));
    camera.lookAt(cameraTarget);

    if (renderState.clock.elapsedTime - vehicle.lastHudAt > 0.045) {
      vehicle.lastHudAt = renderState.clock.elapsedTime;
      store.setTelemetry({
        throttle: vehicle.throttle,
        brake: vehicle.brake,
        steering: vehicle.steering,
        speedKmh: vehicle.speed * 3.6,
        ecoScore: vehicle.ecoScore,
        routeChoice,
        event,
        distanceMeters: vehicle.distance
      });
    }
  });

  return (
    <group ref={carRef}>
      <mesh ref={auraRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.47, 0]}>
        <ringGeometry args={[1.6, 3.8, 80]} />
        <meshBasicMaterial color="#37e58f" transparent opacity={0.22} side={DoubleSide} />
      </mesh>
      <EVModel />
    </group>
  );
}

function EVModel() {
  return (
    <group>
      <mesh castShadow position={[0, 0.42, 0]}>
        <boxGeometry args={[2.15, 0.68, 4.4]} />
        <meshStandardMaterial color="#dffdf1" metalness={0.65} roughness={0.22} emissive="#37e58f" emissiveIntensity={0.03} />
      </mesh>
      <mesh castShadow position={[0, 0.88, -0.45]}>
        <boxGeometry args={[1.45, 0.58, 1.55]} />
        <meshStandardMaterial color="#12313a" metalness={0.6} roughness={0.18} emissive="#38bdf8" emissiveIntensity={0.12} />
      </mesh>
      <mesh position={[0, 0.5, -2.25]}>
        <boxGeometry args={[1.55, 0.12, 0.12]} />
        <meshBasicMaterial color="#37e58f" />
      </mesh>
      <mesh position={[0, 0.43, 2.25]}>
        <boxGeometry args={[1.7, 0.1, 0.12]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>
      {[-1.18, 1.18].map((x) =>
        [-1.42, 1.42].map((z) => (
          <mesh castShadow key={`${x}-${z}`} position={[x, 0.18, z]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.34, 0.34, 0.28, 24]} />
            <meshStandardMaterial color="#050909" roughness={0.44} metalness={0.3} />
          </mesh>
        ))
      )}
    </group>
  );
}

function ForceMeter({ label, value, brake = false }: { label: string; value: number; brake?: boolean }) {
  return (
    <div className="meter">
      <span>{label}</span>
      <div className="meter-track">
        <div className={`meter-fill ${brake ? "meter-fill--brake" : ""}`} style={{ width: `${Math.round(value * 100)}%` }} />
      </div>
    </div>
  );
}

function TouchControls() {
  const throttle = useGameStore((state) => state.telemetry.throttle);
  const brake = useGameStore((state) => state.telemetry.brake);
  const setTouchThrottle = useGameStore((state) => state.setTouchThrottle);
  const setTouchBrake = useGameStore((state) => state.setTouchBrake);
  const setTouchSteering = useGameStore((state) => state.setTouchSteering);

  return (
    <div className="pedal-row">
      <button
        aria-label="Brake pedal"
        className="pedal pedal--brake"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          setTouchBrake(readPedalForce(event));
        }}
        onPointerMove={(event) => event.buttons === 1 && setTouchBrake(readPedalForce(event))}
        onPointerUp={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
          setTouchBrake(0);
        }}
        onPointerCancel={() => setTouchBrake(0)}
        style={{ "--pedal-force": `${Math.round(brake * 100)}%` } as React.CSSProperties}
      >
        <span>Brake / Reverse</span>
      </button>
      <button
        aria-label="Gas pedal"
        className="pedal pedal--gas"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          setTouchThrottle(readPedalForce(event));
        }}
        onPointerMove={(event) => event.buttons === 1 && setTouchThrottle(readPedalForce(event))}
        onPointerUp={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
          setTouchThrottle(0);
        }}
        onPointerCancel={() => setTouchThrottle(0)}
        style={{ "--pedal-force": `${Math.round(throttle * 100)}%` } as React.CSSProperties}
      >
        <span>Gas</span>
      </button>
      <div className="steer-pad" aria-label="Touch steering controls">
        <button onPointerDown={() => setTouchSteering(-1)} onPointerUp={() => setTouchSteering(0)} onPointerCancel={() => setTouchSteering(0)}>
          Left
        </button>
        <button onPointerDown={() => setTouchSteering(1)} onPointerUp={() => setTouchSteering(0)} onPointerCancel={() => setTouchSteering(0)}>
          Right
        </button>
      </div>
    </div>
  );
}

function useKeyboardInput() {
  const setKey = useGameStore((state) => state.setKey);

  useEffect(() => {
    const handledKeys = ["w", "a", "s", "d", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "];
    const down = (event: KeyboardEvent) => {
      if (handledKeys.includes(event.key)) {
        event.preventDefault();
        setKey(event.key, true);
      }
    };
    const up = (event: KeyboardEvent) => {
      if (handledKeys.includes(event.key)) {
        event.preventDefault();
        setKey(event.key, false);
      }
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);

    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [setKey]);
}

function readPedalForce(event: React.PointerEvent<HTMLElement>) {
  const rect = event.currentTarget.getBoundingClientRect();
  const depth = clamp((event.clientY - rect.top) / rect.height, 0, 1);
  const pressure = event.pressure > 0 && event.pressure < 1 ? event.pressure : 0;
  return clamp(Math.max(pressure, 0.22 + depth * 0.78), 0, 1);
}

function createRoadGeometry(points: Vector3[], width: number) {
  const sampled = sampleCurve(points, 80);
  const vertices: number[] = [];
  const indices: number[] = [];

  sampled.forEach((point, index) => {
    const previous = sampled[Math.max(0, index - 1)];
    const next = sampled[Math.min(sampled.length - 1, index + 1)];
    const tangent = next.clone().sub(previous).normalize();
    const normal = new Vector3(-tangent.z, 0, tangent.x).normalize();
    const left = point.clone().add(normal.clone().multiplyScalar(width / 2));
    const right = point.clone().add(normal.clone().multiplyScalar(-width / 2));
    vertices.push(left.x, 0, left.z, right.x, 0, right.z);

    if (index < sampled.length - 1) {
      const base = index * 2;
      indices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
    }
  });

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function sampleCurve(points: Vector3[], divisions: number) {
  const curve = new CatmullRomCurve3(points, false, "catmullrom", 0.35);
  return curve.getPoints(divisions);
}

function findNearestRoadSample(samples: RoadSample[], x: number, z: number) {
  let nearest: { sample: RoadSample; distanceSq: number } | null = null;

  for (const sample of samples) {
    const dx = sample.point.x - x;
    const dz = sample.point.z - z;
    const distanceSq = dx * dx + dz * dz;

    if (!nearest || distanceSq < nearest.distanceSq) {
      nearest = { sample, distanceSq };
    }
  }

  return nearest;
}
