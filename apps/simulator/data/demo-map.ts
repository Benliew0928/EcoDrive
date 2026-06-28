import { Vector3 } from "three";

export type RoutePath = {
  id: "main" | "eco" | "fast";
  label: string;
  accent: string;
  width: number;
  points: Vector3[];
};

const point = (x: number, z: number) => new Vector3(x, 0, z);

export const routePaths: RoutePath[] = [
  {
    id: "main",
    label: "Launch Spine",
    accent: "#38bdf8",
    width: 15,
    points: [point(0, 42), point(0, 10), point(0, -24), point(-2, -58)]
  },
  {
    id: "eco",
    label: "Eco Route",
    accent: "#37e58f",
    width: 14,
    points: [point(-2, -58), point(-18, -82), point(-38, -112), point(-34, -152), point(-8, -206)]
  },
  {
    id: "fast",
    label: "Fast Route",
    accent: "#f5b84b",
    width: 14,
    points: [point(4, -58), point(28, -80), point(43, -110), point(36, -152), point(10, -206)]
  }
];

export const routeMarkers = [
  { label: "Route fork", position: [0, 2.2, -58] as const, color: "#f5b84b" },
  { label: "Regen zone", position: [-31, 2.2, -124] as const, color: "#37e58f" },
  { label: "Stop-start risk", position: [35, 2.2, -122] as const, color: "#ff5b5b" },
  { label: "EcoCoin gate", position: [-10, 2.2, -188] as const, color: "#38bdf8" }
];

export const skylineBlocks = Array.from({ length: 46 }, (_, index) => {
  const side = index % 2 === 0 ? -1 : 1;
  const row = Math.floor(index / 2);
  const width = 3 + ((index * 5) % 6);
  const height = 8 + ((index * 11) % 24);

  return {
    id: `tower-${index}`,
    position: [side * (48 + ((index * 7) % 22)), height / 2, 30 - row * 11] as const,
    scale: [width, height, 3 + ((index * 3) % 8)] as const,
    color: index % 5 === 0 ? "#12313a" : "#0d1b1d",
    light: index % 3 === 0 ? "#38bdf8" : "#37e58f"
  };
});
