"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, PerspectiveCamera, Stars } from "@react-three/drei";
import {
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Vector3
} from "three";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import {
  buildRelayWebSocketUrl,
  createSimulatorInputMessage,
  defaultSessionId,
  parseEcoDriveMessage,
  type DriveEventType as DashboardDriveEvent,
  type LedState,
  type ProcessedTelemetry as DashboardTelemetry,
  type SimulatorInput
} from "@ecodrive/protocol";
import { clamp, damp, useGameStore, type GameEvent, type RouteChoice, type Telemetry } from "../lib/game-store";
import {
  campusBuildings,
  campusDrive,
  campusFields,
  campusGates,
  campusLakes,
  campusParkingZones,
  campusTrees,
  mapLandmarks,
  routeMarkers,
  routePaths,
  type RoutePath
} from "../data/demo-map";

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
  previousSpeed: number;
  smoothSeconds: number;
  overspeedSeconds: number;
  harshTimer: number;
  aggressiveTimer: number;
  lastHudAt: number;
};

type RoadSample = {
  point: Vector3;
  halfWidth: number;
};

const blankDashboardFrameUrl = "about:blank";
const configuredDashboardAppUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL ?? blankDashboardFrameUrl;
const configuredRelayWsUrl = process.env.NEXT_PUBLIC_ECODRIVE_RELAY_WS_URL ?? process.env.NEXT_PUBLIC_ECODRIVE_WS_URL ?? "";
const configuredSessionId = process.env.NEXT_PUBLIC_ECODRIVE_SESSION ?? defaultSessionId;
const configuredRelayToken = process.env.NEXT_PUBLIC_ECODRIVE_TOKEN;
const dashboardFrameWidth = 1920;
const dashboardFrameHeight = 1059;

const eventLabels: Record<GameEvent, string> = {
  launch_ready: "Vehicle ready. Awaiting drive input.",
  route_fork: "Library split ahead. Lake loop saves energy.",
  smooth_segment: "Smooth segment. Eco-score climbing.",
  smooth_streak: "Smooth driving streak. Eco-score bonus is active.",
  harsh_brake: "Harsh brake detected. ESP32 would flash red.",
  aggressive_acceleration: "Aggressive acceleration detected. Eco-score penalty.",
  overspeed: "Overspeed warning. Smooth route score is dropping.",
  regen_success: "Regen zone captured. +EcoCoin preview.",
  fast_route_warning: "Fast route warning: stop-start cluster ahead.",
  reverse_mode: "Reverse engaged. Brake pedal is now backing the EV.",
  finish_loop: "Campus lap complete. Returning to East Gate."
};

const dashboardEventMap: Record<GameEvent, DashboardDriveEvent> = {
  launch_ready: "launch_ready",
  route_fork: "route_selected",
  smooth_segment: "smooth_segment",
  smooth_streak: "smooth_streak",
  harsh_brake: "harsh_brake",
  aggressive_acceleration: "aggressive_acceleration",
  overspeed: "overspeed",
  regen_success: "regen_success",
  fast_route_warning: "fast_route_warning",
  reverse_mode: "idle",
  finish_loop: "finish_loop"
};

export function SimulatorGame() {
  useKeyboardInput();
  useGamepadInput();
  const telemetry = useGameStore((state) => state.telemetry);
  const controlMode = useGameStore((state) => state.controlMode);
  const gamepadConnected = useGameStore((state) => state.rawInput.gamepadConnected);
  const dashboardUrl = useDashboardUrl();
  const dashboardFrameRef = useRef<HTMLIFrameElement>(null);
  const [touchControlsVisible, setTouchControlsVisible] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  useDashboardTelemetryBridge(dashboardFrameRef, telemetry, dashboardUrl);
  useCloudRelayTelemetry(telemetry);
  const speedLabel = Math.round(Math.abs(telemetry.speedKmh));
  const gearLabel = telemetry.speedKmh < -1 ? "R" : telemetry.speedKmh > 1 ? "D" : "P";
  const controlModeLabel = controlMode.replace("-", " ");
  const isWarning =
    telemetry.event === "harsh_brake" ||
    telemetry.event === "fast_route_warning" ||
    telemetry.event === "aggressive_acceleration" ||
    telemetry.event === "overspeed";
  const showBonus = telemetry.event === "regen_success" || telemetry.event === "finish_loop" || telemetry.event === "smooth_streak";

  useEffect(() => {
    const isTouchFirst = window.matchMedia("(pointer: coarse)").matches;
    setTouchControlsVisible(isTouchFirst);
  }, []);

  return (
    <main className="simulator-shell">
      <div className="canvas-stage">
        <Canvas dpr={[1, 1.65]} gl={{ antialias: true, powerPreference: "high-performance" }}>
          <color attach="background" args={["#030707"]} />
          <fog attach="fog" args={["#031112", 88, 285]} />
          <SceneContent />
        </Canvas>
      </div>
      <CockpitOverlay
        controlModeLabel={controlModeLabel}
        dashboardFrameRef={dashboardFrameRef}
        dashboardUrl={dashboardUrl}
        gearLabel={gearLabel}
        gamepadConnected={gamepadConnected}
        helpOpen={helpOpen}
        isWarning={isWarning}
        onCloseHelp={() => setHelpOpen(false)}
        onToggleHelp={() => setHelpOpen((isOpen) => !isOpen)}
        onToggleTouchControls={() => setTouchControlsVisible((isVisible) => !isVisible)}
        showBonus={showBonus}
        speedLabel={speedLabel}
        telemetry={telemetry}
        touchControlsVisible={touchControlsVisible}
      />
      <div className={`edge-warning ${isWarning ? "edge-warning--active" : ""}`} />
      <div className="scanlines" />
    </main>
  );
}

function CockpitOverlay({
  controlModeLabel,
  dashboardFrameRef,
  dashboardUrl,
  gearLabel,
  gamepadConnected,
  helpOpen,
  isWarning,
  onCloseHelp,
  onToggleHelp,
  onToggleTouchControls,
  showBonus,
  speedLabel,
  telemetry,
  touchControlsVisible
}: {
  controlModeLabel: string;
  dashboardFrameRef: RefObject<HTMLIFrameElement | null>;
  dashboardUrl: string;
  gearLabel: string;
  gamepadConnected: boolean;
  helpOpen: boolean;
  isWarning: boolean;
  onCloseHelp: () => void;
  onToggleHelp: () => void;
  onToggleTouchControls: () => void;
  showBonus: boolean;
  speedLabel: number;
  telemetry: Telemetry;
  touchControlsVisible: boolean;
}) {
  const dashboardViewportRef = useRef<HTMLDivElement>(null);
  const dashboardFrameStyle = useDashboardFrameStyle(dashboardViewportRef);
  const steeringDegrees = telemetry.steering * 34;
  const routeLabel = telemetry.routeChoice === "unknown" ? "Fork ahead" : `${telemetry.routeChoice} route`;
  const eventText =
    telemetry.event === "finish_loop"
      ? "Loop complete"
      : telemetry.event === "smooth_streak"
        ? "Smooth streak score boost"
        : "+50 EcoCoin regen capture";

  return (
    <div className="cockpit-hud">
      <div className="sim-toolbar" aria-label="Simulator controls">
        <button
          aria-label={touchControlsVisible ? "Hide touch controls for keyboard mode" : "Show touch controls for mobile or iPad mode"}
          className={`icon-button mode-toggle ${touchControlsVisible ? "mode-toggle--touch" : "mode-toggle--pc"}`}
          onClick={onToggleTouchControls}
          type="button"
        >
          <span className="device-icon" aria-hidden="true" />
        </button>
        <button
          aria-label={helpOpen ? "Hide control help" : "Show control help"}
          className={`icon-button info-button ${helpOpen ? "info-button--active" : ""}`}
          onClick={onToggleHelp}
          type="button"
        >
          <span aria-hidden="true">i</span>
        </button>
      </div>

      {helpOpen ? <ControlHelpPanel onClose={onCloseHelp} /> : null}

      <section className="windshield-strip">
        <div className="rearview-mirror">
          <span>EcoDrive+</span>
          <strong>{routeLabel}</strong>
        </div>
        <div className={`drive-event ${isWarning ? "drive-event--warning" : ""}`}>
          <span>Drive event</span>
          <strong>{eventLabels[telemetry.event]}</strong>
        </div>
        <div className={`reward-flash ${showBonus ? "reward-flash--active" : ""}`}>
          <span>Reward window</span>
          <strong>{eventText}</strong>
        </div>
      </section>

      <section className="ev-cabin" aria-label="First-person EV cockpit">
        <div className="roof-liner" />
        <div className="a-pillar a-pillar--left" />
        <div className="a-pillar a-pillar--right" />
        <div className="windshield-glass" />
        <div className="dashboard-shelf">
          <div className="dash-ambient dash-ambient--left" />
          <div className="dash-ambient dash-ambient--right" />
        </div>

        <div className="driver-cluster">
          <div className="cluster-topline">
            <span>{gearLabel}</span>
            <span>{gamepadConnected ? "Controller linked" : `Input ${controlModeLabel}`}</span>
          </div>
          <div className="cluster-speed">
            <strong>{speedLabel}</strong>
            <span>km/h</span>
          </div>
          <div className="cluster-metrics">
            <p>
              <span>Eco</span>
              <strong>{Math.round(telemetry.ecoScore)}</strong>
            </p>
            <p>
              <span>Route</span>
              <strong>{telemetry.routeChoice === "unknown" ? "--" : telemetry.routeChoice.toUpperCase()}</strong>
            </p>
          </div>
        </div>

        <div className="center-display">
          <div className="display-camera" />
          <div className="display-viewport" ref={dashboardViewportRef}>
            <iframe
              ref={dashboardFrameRef}
              title="Live EcoDrive dashboard app"
              src={buildDashboardFrameUrl(dashboardUrl)}
              sandbox="allow-scripts allow-same-origin allow-forms"
              scrolling="no"
              style={dashboardFrameStyle}
            />
          </div>
        </div>

        <div className="side-mirror side-mirror--left" />
        <div className="side-mirror side-mirror--right" />

        <div className="steering-module" style={{ "--wheel-angle": `${steeringDegrees}deg` } as React.CSSProperties}>
          <div className="steering-wheel">
            <span className="wheel-hub">E+</span>
            <span className="wheel-spoke wheel-spoke--left" />
            <span className="wheel-spoke wheel-spoke--right" />
            <span className="wheel-spoke wheel-spoke--bottom" />
          </div>
        </div>

        <div className="console-bridge">
          <div className="console-pad" />
          <div className="console-dial" />
        </div>

        <div className={`touch-control-well ${touchControlsVisible ? "touch-control-well--visible" : "touch-control-well--hidden"}`}>
          <TouchControls />
        </div>
      </section>
    </div>
  );
}

function ControlHelpPanel({ onClose }: { onClose: () => void }) {
  return (
    <section className="control-help" aria-label="How to play">
      <button aria-label="Close control help" className="control-help-close" onClick={onClose} type="button">
        <span aria-hidden="true">x</span>
      </button>
      <div>
        <p>Keyboard</p>
        <strong>W / Up accelerate, S / Down / Space brake, A-D or arrows steer.</strong>
      </div>
      <div>
        <p>Touch</p>
        <strong>Hold the right pedal to accelerate, left pedal to brake, and the left/right pad to steer.</strong>
      </div>
      <div>
        <p>Xbox</p>
        <strong>RT gas, LT brake or reverse, left stick steers.</strong>
      </div>
    </section>
  );
}

function SceneContent() {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 1.65, 0]} fov={73} />
      <ambientLight intensity={0.38} />
      <directionalLight castShadow intensity={2.6} position={[24, 32, 18]} shadow-mapSize={[1024, 1024]} />
      <pointLight color="#37e58f" intensity={42} position={[-62, 6, -96]} distance={82} />
      <pointLight color="#0ea5e9" intensity={36} position={[-16, 5, -56]} distance={110} />
      <pointLight color="#ff5b5b" intensity={28} position={[78, 6, -238]} distance={72} />
      <pointLight color="#38bdf8" intensity={38} position={[82, 6, 88]} distance={76} />
      <Stars count={1100} depth={130} factor={4} fade speed={0.18} />
      <GroundPlane />
      <RoadNetwork />
      <CampusEnvironment />
      <MapLandmarks />
      <RouteSigns />
      <DriveRig />
    </>
  );
}

function GroundPlane() {
  return (
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, -112]}>
      <planeGeometry args={[270, 620, 1, 1]} />
      <meshStandardMaterial color="#06110f" roughness={0.9} metalness={0.12} />
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
      <Gate position={[82, 0.1, 88]} color="#38bdf8" label="EAST GATE LAP" />
      <Gate position={[45, 0.1, -124]} color="#f5b84b" label="ROUTE CHOICE" />
      <Gate position={[-62, 0.1, -112]} color="#37e58f" label="LAKE 18 ECO" />
      <Gate position={[-74, 0.1, 88]} color="#37e58f" label="SOUTH GATE" />
      <Gate position={[80, 0.1, -238]} color="#ff5b5b" label="WORKSHOP SLOW" />
      <Gate position={[42, 0.1, 112]} color="#38bdf8" label="RETURN MERGE" />
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

function CampusEnvironment() {
  return (
    <group>
      <CampusLakes />
      <CampusFields />
      <CampusParking />
      <CampusBuildings />
      <CampusGates />
      <CampusTrees />
    </group>
  );
}

function CampusLakes() {
  return (
    <group>
      {campusLakes.map((lake) => (
        <group key={lake.id} position={lake.position}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} scale={[lake.radius[0], lake.radius[1], 1]}>
            <circleGeometry args={[1, 96]} />
            <meshStandardMaterial color={lake.color} emissive="#0ea5e9" emissiveIntensity={0.1} roughness={0.18} metalness={0.22} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} scale={[lake.radius[0] * 1.06, lake.radius[1] * 1.04, 1]}>
            <ringGeometry args={[0.95, 1, 96]} />
            <meshBasicMaterial color="#8bd9e8" transparent opacity={0.34} side={DoubleSide} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[lake.radius[0] * 0.12, 0.018, -lake.radius[1] * 0.18]} scale={[lake.radius[0] * 0.34, lake.radius[1] * 0.08, 1]}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial color="#d6fbff" transparent opacity={0.13} side={DoubleSide} />
          </mesh>
          <Html center distanceFactor={28} position={[0, 2.2, 0]}>
            <div style={{ color: "#b7f5ff", fontSize: 10, fontWeight: 900, whiteSpace: "nowrap" }}>{lake.label}</div>
          </Html>
        </group>
      ))}
    </group>
  );
}

function CampusFields() {
  return (
    <group>
      {campusFields.map((field) => (
        <group key={field.id} position={field.position}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={field.scale} />
            <meshStandardMaterial color={field.color} roughness={0.86} metalness={0.02} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
            <ringGeometry args={[0.14, 0.16, 48]} />
            <meshBasicMaterial color="#b7ffe0" transparent opacity={0.3} side={DoubleSide} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.035, 0]} scale={[field.scale[0] * 0.46, field.scale[1] * 0.46, 1]}>
            <ringGeometry args={[0.99, 1, 4]} />
            <meshBasicMaterial color="#d8ffe8" transparent opacity={0.22} side={DoubleSide} />
          </mesh>
          <Html center distanceFactor={24} position={[0, 2.2, 0]}>
            <div style={{ color: "#b8ffd7", fontSize: 9, fontWeight: 900, whiteSpace: "nowrap" }}>{field.label}</div>
          </Html>
        </group>
      ))}
    </group>
  );
}

function CampusParking() {
  return (
    <group>
      {campusParkingZones.map((zone) => (
        <group key={zone.id} position={zone.position} rotation={[0, zone.rotation ?? 0, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={zone.scale} />
            <meshStandardMaterial color="#1f2829" roughness={0.76} metalness={0.2} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.026, 0]} scale={[zone.scale[0] * 0.5, zone.scale[1] * 0.5, 1]}>
            <ringGeometry args={[0.98, 1, 4]} />
            <meshBasicMaterial color="#e8f0d6" transparent opacity={0.28} side={DoubleSide} />
          </mesh>
          <Html center distanceFactor={28} position={[0, 1.2, 0]}>
            <div style={{ color: "#e8f0d6", fontSize: 8, fontWeight: 900, whiteSpace: "nowrap" }}>P{zone.label}</div>
          </Html>
        </group>
      ))}
    </group>
  );
}

function CampusBuildings() {
  return (
    <group>
      {campusBuildings.map((building) => (
        <group key={building.id} position={building.position}>
          <mesh castShadow receiveShadow position={[0, building.scale[1] / 2, 0]}>
            <boxGeometry args={building.scale} />
            <meshStandardMaterial
              color={new Color(building.color).multiplyScalar(0.78)}
              emissive={building.accent}
              emissiveIntensity={0.045}
              metalness={0.18}
              roughness={0.58}
            />
          </mesh>
          <mesh position={[0, building.scale[1] + 0.12, 0]}>
            <boxGeometry args={[building.scale[0] * 1.08, 0.24, building.scale[2] * 1.06]} />
            <meshStandardMaterial color={building.roof ?? "#546c74"} emissive={building.accent} emissiveIntensity={0.1} roughness={0.46} />
          </mesh>
          <mesh position={[0, building.scale[1] * 0.56, building.scale[2] / 2 + 0.04]}>
            <boxGeometry args={[building.scale[0] * 0.72, 0.18, 0.08]} />
            <meshBasicMaterial color={building.accent} transparent opacity={0.42} />
          </mesh>
          <mesh position={[building.scale[0] / 2 + 0.04, building.scale[1] * 0.48, 0]}>
            <boxGeometry args={[0.08, 0.16, building.scale[2] * 0.62]} />
            <meshBasicMaterial color={building.accent} transparent opacity={0.28} />
          </mesh>
          <BuildingWindowBands scale={building.scale} accent={building.accent} />
          <Html center distanceFactor={26} position={[0, building.scale[1] + 1.5, 0]}>
            <div style={{ color: building.accent, fontSize: 8, fontWeight: 900, whiteSpace: "nowrap", textShadow: "0 2px 8px #001" }}>
              {building.label}
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
}

function BuildingWindowBands({ scale, accent }: { scale: [number, number, number]; accent: string }) {
  const levels = [0.28, 0.48, 0.68];

  return (
    <group>
      {levels.map((level) => (
        <group key={level}>
          <mesh position={[0, scale[1] * level, scale[2] / 2 + 0.055]}>
            <boxGeometry args={[scale[0] * 0.76, 0.09, 0.07]} />
            <meshBasicMaterial color={accent} transparent opacity={0.22} />
          </mesh>
          <mesh position={[0, scale[1] * level, -scale[2] / 2 - 0.055]}>
            <boxGeometry args={[scale[0] * 0.76, 0.09, 0.07]} />
            <meshBasicMaterial color={accent} transparent opacity={0.16} />
          </mesh>
          <mesh position={[scale[0] / 2 + 0.055, scale[1] * level, 0]}>
            <boxGeometry args={[0.07, 0.09, scale[2] * 0.62]} />
            <meshBasicMaterial color={accent} transparent opacity={0.18} />
          </mesh>
          <mesh position={[-scale[0] / 2 - 0.055, scale[1] * level, 0]}>
            <boxGeometry args={[0.07, 0.09, scale[2] * 0.62]} />
            <meshBasicMaterial color={accent} transparent opacity={0.14} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function CampusGates() {
  return (
    <group>
      {campusGates.map((gate) => (
        <group key={gate.id} position={gate.position} rotation={[0, gate.rotation, 0]}>
          <mesh castShadow receiveShadow position={[-6.6, 1.25, 0]}>
            <boxGeometry args={[5.4, 2.5, 4.2]} />
            <meshStandardMaterial color="#e5eee9" emissive={gate.color} emissiveIntensity={0.08} roughness={0.54} />
          </mesh>
          <mesh castShadow receiveShadow position={[6.6, 1.25, 0]}>
            <boxGeometry args={[5.4, 2.5, 4.2]} />
            <meshStandardMaterial color="#e5eee9" emissive={gate.color} emissiveIntensity={0.08} roughness={0.54} />
          </mesh>
          <mesh position={[0, 3.05, 0]}>
            <boxGeometry args={[18, 0.42, 1.1]} />
            <meshStandardMaterial color={gate.color} emissive={gate.color} emissiveIntensity={1.1} roughness={0.3} />
          </mesh>
          <mesh position={[0, 1.45, 3.05]} rotation={[0, 0, -0.12]}>
            <boxGeometry args={[12.5, 0.22, 0.22]} />
            <meshStandardMaterial color="#f5f7ef" emissive="#f5b84b" emissiveIntensity={0.42} />
          </mesh>
          <Html center distanceFactor={22} position={[0, 4.25, 0]}>
            <div style={{ color: gate.color, fontSize: 10, fontWeight: 900, whiteSpace: "nowrap", textShadow: "0 2px 8px #001" }}>
              {gate.label}
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
}

function CampusTrees() {
  return (
    <group>
      {campusTrees.map((tree) => (
        <group key={tree.id} position={tree.position} scale={tree.scale}>
          <mesh castShadow position={[0, 0.55, 0]}>
            <cylinderGeometry args={[0.14, 0.2, 1.1, 8]} />
            <meshStandardMaterial color="#4a2f22" roughness={0.74} />
          </mesh>
          <mesh castShadow position={[0, 1.35, 0]}>
            <coneGeometry args={[0.78, 1.55, 8]} />
            <meshStandardMaterial color="#1e6d46" emissive="#37e58f" emissiveIntensity={0.035} roughness={0.82} />
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
    x: campusDrive.start.x,
    z: campusDrive.start.z,
    yaw: campusDrive.start.yaw,
    speed: 0,
    distance: 0,
    throttle: 0,
    brake: 0,
    steering: 0,
    wheelAngle: 0,
    reverseHold: 0,
    selectedRoute: "unknown",
    ecoScore: 84,
    previousSpeed: 0,
    smoothSeconds: 0,
    overspeedSeconds: 0,
    harshTimer: 0,
    aggressiveTimer: 0,
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
    const hasManualInput =
      keyboardThrottle ||
      keyboardBrake ||
      keyboardSteer ||
      raw.touchThrottle ||
      raw.touchBrake ||
      raw.touchSteering ||
      raw.gamepadThrottle ||
      raw.gamepadBrake ||
      raw.gamepadSteering;
    const targetThrottle = Math.max(raw.touchThrottle, raw.gamepadThrottle, keyboardThrottle, hasManualInput ? 0 : 0.18);
    const targetBrake = Math.max(raw.touchBrake, raw.gamepadBrake, keyboardBrake);
    const steeringSources = [raw.touchSteering, raw.gamepadSteering, keyboardSteer];
    const targetSteering = clamp(
      steeringSources.reduce((largest, current) => (Math.abs(current) > Math.abs(largest) ? current : largest), 0),
      -1,
      1
    );

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

    vehicle.x = clamp(vehicle.x, campusDrive.bounds.minX, campusDrive.bounds.maxX);
    vehicle.z = clamp(vehicle.z, campusDrive.bounds.minZ, campusDrive.bounds.maxZ);
    vehicle.distance += speedAbs * dt;
    const speedKmh = vehicle.speed * 3.6;
    const speedAbsKmh = Math.abs(speedKmh);
    const accelerationKmhS = ((vehicle.speed - vehicle.previousSpeed) * 3.6) / Math.max(dt, 0.001);

    let routeChoice: RouteChoice = "unknown";
    if (vehicle.distance < 85) {
      vehicle.selectedRoute = "unknown";
    }
    if (vehicle.selectedRoute === "unknown" && vehicle.distance > 105 && vehicle.z < -104) {
      vehicle.selectedRoute = vehicle.x < 46 ? "eco" : "fast";
    }
    if (vehicle.selectedRoute !== "unknown") {
      routeChoice = vehicle.selectedRoute;
    }

    const distanceFromStart = distance2D(vehicle.x, vehicle.z, campusDrive.start.x, campusDrive.start.z);
    const distanceFromLake18 = distance2D(vehicle.x, vehicle.z, -16, -56);
    const distanceFromLake19 = distance2D(vehicle.x, vehicle.z, -48, 112);
    const inEcoRegenZone =
      routeChoice === "eco" &&
      ((distanceFromLake18 < 104 && vehicle.x < 26) || (distanceFromLake19 < 48 && vehicle.z > 70));
    const inFastRiskZone = routeChoice === "fast" && vehicle.x > 56 && vehicle.z < -146 && vehicle.z > -302;
    const smoothFrame =
      speedAbsKmh > 14 &&
      speedAbsKmh < 68 &&
      vehicle.throttle > 0.08 &&
      vehicle.throttle < 0.76 &&
      vehicle.brake < 0.18 &&
      Math.abs(vehicle.steering) < 0.34 &&
      !inFastRiskZone;

    vehicle.smoothSeconds = smoothFrame ? Math.min(vehicle.smoothSeconds + dt, 8) : Math.max(0, vehicle.smoothSeconds - dt * 1.5);
    vehicle.overspeedSeconds = speedAbsKmh > 72 ? Math.min(vehicle.overspeedSeconds + dt, 2) : Math.max(0, vehicle.overspeedSeconds - dt * 2.2);
    vehicle.harshTimer = Math.max(0, vehicle.harshTimer - dt);
    vehicle.aggressiveTimer = Math.max(0, vehicle.aggressiveTimer - dt);

    const hardBrakeInput = vehicle.brake > 0.64 && speedAbsKmh > 12;
    const emergencyBrakeInput = vehicle.brake > 0.82 && speedAbsKmh > 7;
    const hardThrottleInput = vehicle.throttle > 0.78 && vehicle.brake < 0.12 && speedAbsKmh > 3;
    const launchThrottleInput = vehicle.throttle > 0.9 && vehicle.brake < 0.12;

    if ((hardBrakeInput && accelerationKmhS < -8) || emergencyBrakeInput) {
      vehicle.harshTimer = 1.08;
    }

    if ((hardThrottleInput && accelerationKmhS > 4.8) || (launchThrottleInput && speedAbsKmh > 1.5)) {
      vehicle.aggressiveTimer = 0.92;
    }

    let event: GameEvent = "smooth_segment";
    if (vehicle.distance > 68 && vehicle.distance < 162) event = "route_fork";
    if (vehicle.smoothSeconds > 4.2) event = "smooth_streak";
    if (vehicle.speed < -0.45) event = "reverse_mode";
    if (inEcoRegenZone && vehicle.brake < 0.48 && vehicle.speed > 2.5) {
      event = "regen_success";
    }
    if (inFastRiskZone) {
      event = "fast_route_warning";
    }
    if (vehicle.overspeedSeconds > 0.35) event = "overspeed";
    if (vehicle.aggressiveTimer > 0) event = "aggressive_acceleration";
    if (vehicle.harshTimer > 0) event = "harsh_brake";

    const completedByGate = vehicle.distance > 460 && distanceFromStart < campusDrive.finishRadius;
    if (vehicle.distance > campusDrive.completionDistance || completedByGate) {
      vehicle.z = campusDrive.start.z;
      vehicle.x = campusDrive.start.x;
      vehicle.yaw = campusDrive.start.yaw;
      vehicle.speed = 7;
      vehicle.distance = 0;
      vehicle.reverseHold = 0;
      vehicle.selectedRoute = "unknown";
      vehicle.smoothSeconds = 0;
      vehicle.overspeedSeconds = 0;
      vehicle.harshTimer = 0;
      vehicle.aggressiveTimer = 0;
      event = "finish_loop";
    }

    const scoreTarget =
      90 -
      vehicle.brake * 20 -
      Math.abs(vehicle.steering) * 5 -
      (routeChoice === "fast" ? 14 : 0) -
      (event === "reverse_mode" ? 3 : 0) +
      (event === "regen_success" ? 10 : 0) +
      (event === "smooth_streak" ? 7 : 0) -
      (event === "aggressive_acceleration" ? 10 : 0) -
      (event === "overspeed" ? 12 : 0) -
      (event === "harsh_brake" ? 16 : 0);
    vehicle.ecoScore = damp(vehicle.ecoScore, clamp(scoreTarget, 38, 99), 1.7, dt);

    const forward = new Vector3(Math.sin(vehicle.yaw), 0, -Math.cos(vehicle.yaw));
    const right = new Vector3(Math.cos(vehicle.yaw), 0, Math.sin(vehicle.yaw));
    const carPosition = new Vector3(vehicle.x, 0.8, vehicle.z);
    const isReverse = vehicle.speed < -0.45;
    const cockpitSway = right.clone().multiplyScalar(-vehicle.steering * Math.min(speedAbs / 18, 1) * 0.13);
    const cameraTarget = carPosition
      .clone()
      .add(forward.clone().multiplyScalar(isReverse ? -12 : 42))
      .add(right.clone().multiplyScalar(vehicle.steering * 2.9))
      .add(new Vector3(0, 0.96 + vehicle.throttle * 0.05 - vehicle.brake * 0.04, 0));
    const cameraPosition = carPosition
      .clone()
      .add(forward.clone().multiplyScalar(0.55))
      .add(right.clone().multiplyScalar(0.58))
      .add(new Vector3(0, 1.68, 0))
      .add(cockpitSway);
    const shakePower =
      (event === "harsh_brake" ? 0.18 : event === "regen_success" ? 0.055 : 0) +
      Math.min(speedAbs / 42, 1) * 0.018;
    const shake = new Vector3(
      Math.sin(renderState.clock.elapsedTime * 42) * shakePower,
      Math.cos(renderState.clock.elapsedTime * 36) * shakePower * 0.42,
      0
    );
    camera.position.lerp(cameraPosition.add(shake), 1 - Math.exp(-16 * dt));
    camera.lookAt(cameraTarget);

    if (renderState.clock.elapsedTime - vehicle.lastHudAt > 0.045) {
      vehicle.lastHudAt = renderState.clock.elapsedTime;
      store.setTelemetry({
        throttle: vehicle.throttle,
        brake: vehicle.brake,
        steering: vehicle.steering,
        speedKmh,
        ecoScore: vehicle.ecoScore,
        routeChoice,
        event,
        distanceMeters: vehicle.distance
      });
    }

    vehicle.previousSpeed = vehicle.speed;
  });

  return null;
}

function useDashboardUrl() {
  return configuredDashboardAppUrl || blankDashboardFrameUrl;
}

function useDashboardTelemetryBridge(frameRef: RefObject<HTMLIFrameElement | null>, telemetry: Telemetry, dashboardUrl: string) {
  const telemetryRef = useRef(telemetry);
  const targetOrigin = useMemo(() => readTargetOrigin(dashboardUrl), [dashboardUrl]);

  useEffect(() => {
    telemetryRef.current = telemetry;
  }, [telemetry]);

  useEffect(() => {
    const postTelemetry = () => {
      const targetWindow = frameRef.current?.contentWindow;
      if (!targetWindow || dashboardUrl === blankDashboardFrameUrl) return;

      targetWindow.postMessage(
        {
          type: "ecodrive:simulator-telemetry",
          telemetry: buildDashboardTelemetry(telemetryRef.current)
        },
        targetOrigin
      );
    };

    postTelemetry();
    const interval = window.setInterval(postTelemetry, 220);
    return () => window.clearInterval(interval);
  }, [dashboardUrl, frameRef, targetOrigin]);
}

function readTargetOrigin(url: string) {
  try {
    const origin = new URL(url).origin;
    return origin === "null" ? "*" : origin;
  } catch {
    return "*";
  }
}

function buildDashboardFrameUrl(url: string) {
  if (url === blankDashboardFrameUrl) return url;

  try {
    const frameUrl = new URL(url);
    frameUrl.pathname = "/";
    frameUrl.search = "";
    frameUrl.hash = "";
    frameUrl.searchParams.set("simulatorDisplay", "1");
    return frameUrl.toString();
  } catch {
    return url;
  }
}

function useDashboardFrameStyle(viewportRef: RefObject<HTMLDivElement | null>) {
  const [scale, setScale] = useState(0.216);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const updateScale = () => {
      const bounds = viewport.getBoundingClientRect();
      const nextScale = Math.min(bounds.width / dashboardFrameWidth, bounds.height / dashboardFrameHeight);
      setScale(Number.isFinite(nextScale) && nextScale > 0 ? nextScale : 0.216);
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(viewport);
    window.addEventListener("resize", updateScale);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateScale);
    };
  }, [viewportRef]);

  return useMemo(
    () =>
      ({
        "--dashboard-frame-height": `${dashboardFrameHeight}px`,
        "--dashboard-frame-scale": scale,
        "--dashboard-frame-width": `${dashboardFrameWidth}px`
      }) as React.CSSProperties,
    [scale]
  );
}

function buildDashboardTelemetry(telemetry: Telemetry): DashboardTelemetry {
  const speedAbs = Math.abs(telemetry.speedKmh);
  const distanceKm = telemetry.distanceMeters / 1000;
  const smoothnessFactor = clamp(telemetry.ecoScore / 100, 0.35, 1);

  // ── Physics-based energy model (same as route planner) ──
  // Vehicle constants (mid-size EV)
  const m = 1800;         // kg
  const g = 9.81;         // m/s²
  const Cr = 0.011;       // rolling resistance
  const rho = 1.164;      // kg/m³ (tropical Malaysia)
  const Cd = 0.23;        // drag coefficient
  const A = 2.22;         // frontal area m²
  const eta = 0.85;       // powertrain efficiency
  const Paux = 0.8;       // kW auxiliary loads
  const GEF = 0.740;      // kg CO₂/kWh (Malaysia grid 2024)

  const v = speedAbs / 3.6; // m/s

  // Tractive forces
  const F_roll = m * g * Cr;                       // ~194 N
  const F_aero = 0.5 * rho * Cd * A * v * v;       // grows with v²
  // Acceleration force: penalise harsh throttle (inertial loss)
  const accelG = telemetry.throttle * 2.5;          // approx m/s² from throttle
  const F_inertia = m * accelG * telemetry.throttle; // only when actively accelerating

  const F_total = F_roll + F_aero + F_inertia;

  // Instantaneous power (kW)
  const P_traction = (F_total * Math.max(v, 0.5)) / 1000;
  const P_total = (P_traction / eta) + Paux;

  // Regenerative braking: recover kinetic energy when braking gently at speed
  // Motor can recover up to ~40 kW; gentle braking = higher recovery ratio
  const regenKw = (telemetry.brake > 0.12 && speedAbs > 8)
    ? clamp(telemetry.brake * 38, 0, 40) * smoothnessFactor
    : 0;

  // Net energy consumed (kWh) over the trip so far
  const energyRate = speedAbs > 1 ? (P_total / speedAbs) : 0; // kWh/km instantaneous
  const energyKwh = Math.max(0, distanceKm * energyRate - regenKw * 0.00012);

  // CO₂ saved = difference between a baseline ICE car and our EV
  // Baseline ICE: ~0.171 kg CO₂/km (average petrol car in Malaysia)
  // Our EV: energyRate * GEF  kg CO₂/km
  const evCo2PerKm = energyRate * GEF;
  const iceCo2PerKm = 0.171; // avg Malaysian petrol car
  const co2SavedKg = Math.max(0, distanceKm * (iceCo2PerKm - evCo2PerKm) * smoothnessFactor);
  const eventBonus =
    telemetry.event === "regen_success" ? 50 : telemetry.event === "smooth_streak" ? 32 : telemetry.event === "finish_loop" ? 80 : 0;
  const coinsEarned = Math.max(0, Math.round(distanceKm * 180 + Math.max(0, telemetry.ecoScore - 70) * 1.6 + eventBonus));

  return {
    deviceId: "simulator-cockpit-01",
    ecoScore: telemetry.ecoScore,
    speedKmh: telemetry.speedKmh,
    event: dashboardEventMap[telemetry.event],
    hardBrakes: telemetry.event === "harsh_brake" ? 1 : 0,
    coinsEarned,
    totalCoins: 1240 + coinsEarned,
    energyKwh,
    co2SavedKg,
    ledState: ledStateForTelemetry(telemetry),
    timestamp: Date.now(),
    distanceKm,
    batteryPercent: clamp(88 - energyKwh * 3.6 + regenKw * 0.012, 42, 98),
    rangeKm: clamp(418 - distanceKm * 4.2 - energyKwh * 9, 190, 430),
    regenKw,
    motorKw: telemetry.throttle * (58 + speedAbs * 0.55) - regenKw * 0.35,
    routeChoice: telemetry.routeChoice,
    throttle: telemetry.throttle,
    brake: telemetry.brake,
    steering: telemetry.steering
  };
}

function ledStateForTelemetry(telemetry: Telemetry): LedState {
  if (telemetry.event === "harsh_brake" || telemetry.event === "overspeed" || telemetry.event === "aggressive_acceleration") return "red";
  if (telemetry.event === "fast_route_warning" || telemetry.routeChoice === "fast") return "amber";
  if (telemetry.event === "launch_ready") return "blue";
  return "green";
}

type PedalName = "throttle" | "brake";
type SteeringPadName = "left" | "right";

type ActivePedalState = {
  pointerId: number;
  startedAt: number;
  depth: number;
  pressure: number;
};

function TouchControls() {
  const throttle = useGameStore((state) => state.telemetry.throttle);
  const brake = useGameStore((state) => state.telemetry.brake);
  const steering = useGameStore((state) => state.telemetry.steering);
  const setTouchThrottle = useGameStore((state) => state.setTouchThrottle);
  const setTouchBrake = useGameStore((state) => state.setTouchBrake);
  const setTouchSteering = useGameStore((state) => state.setTouchSteering);
  const throttleRef = useRef<ActivePedalState | null>(null);
  const brakeRef = useRef<ActivePedalState | null>(null);
  const steeringRef = useRef<{ pointerId: number } | null>(null);

  useEffect(() => {
    let frame = 0;

    const updatePedals = () => {
      const now = performance.now();

      if (throttleRef.current) {
        setTouchThrottle(calculatePedalForce(throttleRef.current, now));
      }

      if (brakeRef.current) {
        setTouchBrake(calculatePedalForce(brakeRef.current, now));
      }

      frame = window.requestAnimationFrame(updatePedals);
    };

    frame = window.requestAnimationFrame(updatePedals);

    return () => {
      window.cancelAnimationFrame(frame);
      setTouchThrottle(0);
      setTouchBrake(0);
      setTouchSteering(0);
    };
  }, [setTouchBrake, setTouchSteering, setTouchThrottle]);

  const setPedalFromPointer = (pedal: PedalName, event: React.PointerEvent<HTMLElement>) => {
    const nextPedal = {
      pointerId: event.pointerId,
      startedAt: performance.now(),
      depth: readPedalDepth(event),
      pressure: readPedalPressure(event)
    };

    if (pedal === "throttle") {
      throttleRef.current = nextPedal;
      setTouchThrottle(calculatePedalForce(nextPedal, nextPedal.startedAt));
    } else {
      brakeRef.current = nextPedal;
      setTouchBrake(calculatePedalForce(nextPedal, nextPedal.startedAt));
    }
  };

  const updatePedalFromPointer = (pedal: PedalName, event: React.PointerEvent<HTMLElement>) => {
    const active = pedal === "throttle" ? throttleRef.current : brakeRef.current;

    if (!active || active.pointerId !== event.pointerId) return;

    active.depth = readPedalDepth(event);
    active.pressure = Math.max(active.pressure, readPedalPressure(event));
  };

  const clearPedal = (pedal: PedalName, event?: React.PointerEvent<HTMLElement>) => {
    if (pedal === "throttle") {
      throttleRef.current = null;
      setTouchThrottle(0);
    } else {
      brakeRef.current = null;
      setTouchBrake(0);
    }

    if (event?.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const setSteeringPad = (pad: SteeringPadName, event: React.PointerEvent<HTMLButtonElement>) => {
    const value = pad === "left" ? -1 : 1;
    steeringRef.current = {
      pointerId: event.pointerId
    };
    setTouchSteering(value);
  };

  const clearSteeringPad = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (steeringRef.current?.pointerId === event.pointerId) {
      steeringRef.current = null;
      setTouchSteering(0);
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div className="touch-gamepad">
      <div className="steer-pad" style={{ "--steer-force": `${50 + steering * 50}%` } as React.CSSProperties}>
        <button
          aria-label="Steer left"
          className="steer-button steer-button--left"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            setSteeringPad("left", event);
          }}
          onPointerUp={clearSteeringPad}
          onPointerCancel={clearSteeringPad}
          type="button"
        >
          <span aria-hidden="true" />
        </button>
        <button
          aria-label="Steer right"
          className="steer-button steer-button--right"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            setSteeringPad("right", event);
          }}
          onPointerUp={clearSteeringPad}
          onPointerCancel={clearSteeringPad}
          type="button"
        >
          <span aria-hidden="true" />
        </button>
      </div>

      <div className="action-pad">
        <button
          aria-label="Brake or reverse"
          className="action-button action-button--brake"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            setPedalFromPointer("brake", event);
          }}
          onPointerMove={(event) => event.buttons === 1 && updatePedalFromPointer("brake", event)}
          onPointerUp={(event) => clearPedal("brake", event)}
          onPointerCancel={(event) => clearPedal("brake", event)}
          style={{ "--press-force": `${Math.round(brake * 100)}%` } as React.CSSProperties}
          type="button"
        >
          <span>Brake</span>
        </button>
        <button
          aria-label="Throttle"
          className="action-button action-button--gas"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            setPedalFromPointer("throttle", event);
          }}
          onPointerMove={(event) => event.buttons === 1 && updatePedalFromPointer("throttle", event)}
          onPointerUp={(event) => clearPedal("throttle", event)}
          onPointerCancel={(event) => clearPedal("throttle", event)}
          style={{ "--press-force": `${Math.round(throttle * 100)}%` } as React.CSSProperties}
          type="button"
        >
          <span>Throttle</span>
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

function useGamepadInput() {
  const setGamepadInput = useGameStore((state) => state.setGamepadInput);

  useEffect(() => {
    let frame = 0;
    let lastSignature = "";

    const readGamepad = () => {
      const pads = typeof navigator !== "undefined" && navigator.getGamepads ? Array.from(navigator.getGamepads()) : [];
      const pad = pads.find((candidate): candidate is Gamepad => Boolean(candidate));

      if (!pad) {
        if (lastSignature !== "disconnected") {
          setGamepadInput({ throttle: 0, brake: 0, steering: 0, connected: false, active: false });
          lastSignature = "disconnected";
        }

        frame = window.requestAnimationFrame(readGamepad);
        return;
      }

      const leftTrigger = pad.buttons[6]?.value ?? 0;
      const rightTrigger = pad.buttons[7]?.value ?? 0;
      const leftStick = applyDeadzone(pad.axes[0] ?? 0, 0.12);
      const dpadSteer = (pad.buttons[14]?.pressed ? -1 : 0) + (pad.buttons[15]?.pressed ? 1 : 0);
      const steering = Math.abs(dpadSteer) > 0 ? dpadSteer : leftStick;
      const throttle = clamp(rightTrigger, 0, 1);
      const brake = clamp(leftTrigger, 0, 1);
      const active = Math.max(throttle, brake, Math.abs(steering)) > 0.08;
      const signature = `${pad.index}:${active ? 1 : 0}:${throttle.toFixed(2)}:${brake.toFixed(2)}:${steering.toFixed(2)}`;

      if (signature !== lastSignature) {
        setGamepadInput({ throttle, brake, steering, connected: true, active });
        lastSignature = signature;
      }

      frame = window.requestAnimationFrame(readGamepad);
    };

    const markConnected = () => {
      lastSignature = "";
    };

    window.addEventListener("gamepadconnected", markConnected);
    window.addEventListener("gamepaddisconnected", markConnected);
    frame = window.requestAnimationFrame(readGamepad);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("gamepadconnected", markConnected);
      window.removeEventListener("gamepaddisconnected", markConnected);
      setGamepadInput({ throttle: 0, brake: 0, steering: 0, connected: false, active: false });
    };
  }, [setGamepadInput]);
}

function applyDeadzone(value: number, deadzone: number) {
  if (Math.abs(value) < deadzone) return 0;
  const sign = Math.sign(value);
  return sign * clamp((Math.abs(value) - deadzone) / (1 - deadzone), 0, 1);
}

function calculatePedalForce(pedal: ActivePedalState, now: number) {
  const holdRamp = clamp((now - pedal.startedAt) / 460, 0, 1);
  const depthForce = 0.28 + pedal.depth * 0.72;
  const holdForce = 0.34 + holdRamp * 0.66;
  return clamp(Math.max(pedal.pressure, depthForce, holdForce), 0, 1);
}

function readPedalDepth(event: React.PointerEvent<HTMLElement>) {
  const rect = event.currentTarget.getBoundingClientRect();
  return clamp((event.clientY - rect.top) / rect.height, 0, 1);
}

function readPedalPressure(event: React.PointerEvent<HTMLElement>) {
  const nativeEvent = event.nativeEvent as PointerEvent & {
    touches?: TouchList;
    changedTouches?: TouchList;
  };
  const hasRealPointerPressure = nativeEvent.pointerType !== "mouse" && nativeEvent.pressure > 0 && nativeEvent.pressure !== 0.5;
  const pointerPressure = hasRealPointerPressure && nativeEvent.pressure <= 1 ? nativeEvent.pressure : 0;
  const touch = nativeEvent.touches?.[0] ?? nativeEvent.changedTouches?.[0];
  const touchForce = touch && "force" in touch && typeof touch.force === "number" ? touch.force : 0;

  return clamp(Math.max(pointerPressure, touchForce), 0, 1);
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

function distance2D(x: number, z: number, targetX: number, targetZ: number) {
  const dx = x - targetX;
  const dz = z - targetZ;
  return Math.sqrt(dx * dx + dz * dz);
}

function useCloudRelayTelemetry(telemetry: Telemetry) {
  const wsRef = useRef<WebSocket | null>(null);
  const telemetryRef = useRef(telemetry);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    telemetryRef.current = telemetry;
  }, [telemetry]);

  useEffect(() => {
    if (!configuredRelayWsUrl) {
      console.info("[EcoDriveRelay] NEXT_PUBLIC_ECODRIVE_RELAY_WS_URL is not configured; simulator will run offline.");
      return;
    }

    let disposed = false;

    function connect() {
      if (disposed) return;

      try {
        const ws = new WebSocket(
          buildRelayWebSocketUrl(configuredRelayWsUrl, {
            role: "simulator",
            session: configuredSessionId,
            token: configuredRelayToken
          })
        );

        ws.onopen = () => {
          console.log("[EcoDriveRelay] Simulator connected to public relay.");
          wsRef.current = ws;
          ws.send(
            JSON.stringify({
              type: "client.hello",
              session: configuredSessionId,
              role: "simulator",
              sentAt: Date.now()
            })
          );
        };

        ws.onclose = () => {
          wsRef.current = null;
          if (!disposed) {
            // Silent reconnect every 3 seconds
            reconnectTimerRef.current = setTimeout(connect, 3000);
          }
        };

        ws.onerror = () => {
          // Suppress errors — the bridge may not be running
          ws.close();
        };

        ws.onmessage = (event) => {
          const message = parseEcoDriveMessage(event.data);
          if (!message) return;

          if (message.type === "relay.error") {
            console.warn(`[EcoDriveRelay] ${message.code}: ${message.message}`);
          }

          if (message.type === "session.status") {
            console.log(
              `[EcoDriveRelay] session ${message.session}: simulator=${message.clients.simulator ?? 0}, dashboard=${message.clients.dashboard ?? 0}, bridge=${message.clients.bridge ?? 0}`
            );
          }
        };
      } catch {
        // WebSocket constructor can throw if URL is invalid
        if (!disposed) {
          reconnectTimerRef.current = setTimeout(connect, 3000);
        }
      }
    }

    connect();

    return () => {
      disposed = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!configuredRelayWsUrl) return;

    const sendTelemetry = () => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;

      ws.send(JSON.stringify(createSimulatorInputMessage(buildSimulatorInput(telemetryRef.current), configuredSessionId)));
    };

    sendTelemetry();
    const interval = window.setInterval(sendTelemetry, 160);
    return () => window.clearInterval(interval);
  }, []);
}

function buildSimulatorInput(telemetry: Telemetry): SimulatorInput {
  return {
    throttle: telemetry.throttle,
    brake: telemetry.brake,
    steering: telemetry.steering,
    speedKmh: telemetry.speedKmh,
    ecoScore: telemetry.ecoScore,
    routeChoice: telemetry.routeChoice,
    event: telemetry.event,
    distanceMeters: telemetry.distanceMeters
  };
}
