import { Vector3 } from "three";

export type RoutePath = {
  id: "main" | "eco" | "fast" | "merge";
  label: string;
  accent: string;
  width: number;
  points: Vector3[];
};

const point = (x: number, z: number) => new Vector3(x, 0, z);

export const routePaths: RoutePath[] = [
  {
    id: "main",
    label: "Launch Boulevard",
    accent: "#38bdf8",
    width: 13,
    points: [point(0, 86), point(0, 48), point(-2, 12), point(0, -28), point(0, -76)]
  },
  {
    id: "eco",
    label: "Eco Bypass",
    accent: "#37e58f",
    width: 11.5,
    points: [
      point(-4, -76),
      point(-26, -110),
      point(-58, -150),
      point(-73, -198),
      point(-66, -248),
      point(-40, -300),
      point(-10, -344),
      point(10, -386)
    ]
  },
  {
    id: "fast",
    label: "Downtown Fast Cut",
    accent: "#f5b84b",
    width: 11.5,
    points: [
      point(6, -76),
      point(38, -104),
      point(74, -142),
      point(82, -190),
      point(58, -234),
      point(72, -282),
      point(44, -328),
      point(12, -386)
    ]
  },
  {
    id: "merge",
    label: "Score Merge",
    accent: "#38bdf8",
    width: 13,
    points: [point(10, -386), point(2, -420), point(0, -462), point(0, -504)]
  }
];

export const routeMarkers = [
  { label: "Choose route", position: [0, 2.4, -72] as const, color: "#f5b84b" },
  { label: "Eco bypass + regen", position: [-45, 2.4, -142] as const, color: "#37e58f" },
  { label: "Solar canopy lane", position: [-70, 2.4, -226] as const, color: "#37e58f" },
  { label: "Downtown fast cut", position: [54, 2.4, -132] as const, color: "#f5b84b" },
  { label: "Traffic light stack", position: [70, 2.4, -250] as const, color: "#ff5b5b" },
  { label: "Merge score gate", position: [6, 2.4, -392] as const, color: "#38bdf8" },
  { label: "Finish telemetry upload", position: [0, 2.4, -470] as const, color: "#38bdf8" }
];

export const skylineBlocks = Array.from({ length: 92 }, (_, index) => {
  const side = index % 2 === 0 ? -1 : 1;
  const row = Math.floor(index / 2);
  const width = 3 + ((index * 5) % 6);
  const height = 8 + ((index * 11) % 32);
  const z = 84 - row * 13;
  const isDowntown = z < -110 && z > -300 && side > 0;
  const isEcoDistrict = z < -135 && z > -320 && side < 0;

  return {
    id: `tower-${index}`,
    position: [side * (54 + ((index * 7) % 38)), height / 2, z] as const,
    scale: [width + (isDowntown ? 2 : 0), height, 4 + ((index * 3) % 10)] as const,
    color: isEcoDistrict ? "#10251f" : index % 5 === 0 ? "#12313a" : "#0d1b1d",
    light: isDowntown ? "#f5b84b" : index % 3 === 0 ? "#38bdf8" : "#37e58f"
  };
});

export const mapLandmarks = [
  { id: "solar-park", label: "Solar Regen Park", position: [-74, 0.2, -212] as const, color: "#37e58f", size: [28, 5, 20] as const },
  { id: "battery-hub", label: "Battery Swap Hub", position: [-36, 0.2, -304] as const, color: "#38bdf8", size: [24, 6, 16] as const },
  { id: "traffic-core", label: "CBD Signal Stack", position: [84, 0.2, -206] as const, color: "#ff5b5b", size: [24, 11, 16] as const },
  { id: "toll-compression", label: "Stop-Start Toll", position: [74, 0.2, -284] as const, color: "#f5b84b", size: [22, 7, 14] as const }
];
