import { Vector3 } from "three";

export type RoutePath = {
  id: "main" | "eco" | "fast" | "merge";
  label: string;
  accent: string;
  width: number;
  points: Vector3[];
};

export type CampusBuilding = {
  id: string;
  label: string;
  position: [number, number, number];
  scale: [number, number, number];
  color: string;
  accent: string;
  roof?: string;
};

export type CampusLake = {
  id: string;
  label: string;
  position: [number, number, number];
  radius: [number, number];
  color: string;
};

export type CampusField = {
  id: string;
  label: string;
  position: [number, number, number];
  scale: [number, number];
  color: string;
};

export type CampusGate = {
  id: string;
  label: string;
  position: [number, number, number];
  rotation: number;
  color: string;
};

export type CampusParkingZone = {
  id: string;
  label: string;
  position: [number, number, number];
  scale: [number, number];
  rotation?: number;
};

export type CampusTree = {
  id: string;
  position: [number, number, number];
  scale: number;
};

export type CampusLandmark = {
  id: string;
  label: string;
  position: [number, number, number];
  color: string;
  size: [number, number, number];
};

const point = (x: number, z: number) => new Vector3(x, 0, z);
const xyz = (x: number, y: number, z: number): [number, number, number] => [x, y, z];
const size3 = (x: number, y: number, z: number): [number, number, number] => [x, y, z];

export const campusDrive = {
  name: "UTAR Kampar Campus Loop",
  start: {
    x: 82,
    z: 88,
    yaw: -0.2
  },
  bounds: {
    minX: -112,
    maxX: 112,
    minZ: -392,
    maxZ: 164
  },
  completionDistance: 760,
  finishRadius: 18
};

export const routePaths: RoutePath[] = [
  {
    id: "main",
    label: "East Gate Academic Spine",
    accent: "#38bdf8",
    width: 13.5,
    points: [point(82, 88), point(76, 54), point(69, 18), point(64, -34), point(55, -84), point(44, -124)]
  },
  {
    id: "eco",
    label: "Lake 18 Scenic Eco Loop",
    accent: "#37e58f",
    width: 12,
    points: [
      point(44, -124),
      point(16, -154),
      point(-24, -160),
      point(-62, -124),
      point(-86, -62),
      point(-90, 22),
      point(-68, 92),
      point(-34, 134),
      point(10, 140),
      point(42, 112)
    ]
  },
  {
    id: "fast",
    label: "Academic Inner Fast Line",
    accent: "#f5b84b",
    width: 11.5,
    points: [
      point(44, -124),
      point(66, -164),
      point(82, -218),
      point(76, -280),
      point(50, -330),
      point(10, -358),
      point(-34, -340),
      point(-62, -292),
      point(-74, -226),
      point(-64, -164)
    ]
  },
  {
    id: "merge",
    label: "South Gate Return Loop",
    accent: "#38bdf8",
    width: 13,
    points: [
      point(-64, -164),
      point(-84, -94),
      point(-86, -20),
      point(-72, 54),
      point(-46, 112),
      point(-10, 142),
      point(28, 124),
      point(62, 92),
      point(82, 88)
    ]
  }
];

export const routeMarkers = [
  { label: "East Gate start", position: xyz(82, 2.4, 88), color: "#38bdf8" },
  { label: "Library route choice", position: xyz(47, 2.4, -124), color: "#f5b84b" },
  { label: "Eco: Lake 18 outer loop", position: xyz(-62, 2.4, -112), color: "#37e58f" },
  { label: "Fast: academic inner spine", position: xyz(78, 2.4, -220), color: "#f5b84b" },
  { label: "South Gate security", position: xyz(-76, 2.4, 88), color: "#38bdf8" },
  { label: "Return to East Gate", position: xyz(38, 2.4, 118), color: "#38bdf8" }
];

export const campusLakes: CampusLake[] = [
  {
    id: "lake-18",
    label: "Lake 18",
    position: xyz(-16, 0.015, -56),
    radius: [54, 92],
    color: "#0b6f8f"
  },
  {
    id: "lake-19",
    label: "Lake 19",
    position: xyz(-48, 0.016, 112),
    radius: [31, 22],
    color: "#0b5f7d"
  }
];

export const campusFields: CampusField[] = [
  {
    id: "football-field",
    label: "Football Field",
    position: xyz(-91, 0.02, 126),
    scale: [34, 47],
    color: "#1f7a42"
  },
  {
    id: "tasik-vegetation",
    label: "Tasik vegetation",
    position: xyz(96, 0.018, -282),
    scale: [24, 58],
    color: "#123d2d"
  }
];

export const campusGates: CampusGate[] = [
  {
    id: "east-gate",
    label: "East Gate Guardhouse",
    position: xyz(86, 0.1, 92),
    rotation: -0.2,
    color: "#38bdf8"
  },
  {
    id: "south-gate",
    label: "South Gate Guardhouse",
    position: xyz(-82, 0.1, 92),
    rotation: 0.32,
    color: "#37e58f"
  }
];

export const campusBuildings: CampusBuilding[] = [
  {
    id: "student-pavilion-1",
    label: "Student Pavilion I",
    position: xyz(50, 0, 28),
    scale: size3(18, 4.4, 14),
    color: "#d8eee9",
    accent: "#37e58f",
    roof: "#7fb1a4"
  },
  {
    id: "faculty-science",
    label: "Faculty of Science",
    position: xyz(92, 0, -14),
    scale: size3(28, 5.8, 17),
    color: "#e8f1ed",
    accent: "#38bdf8",
    roof: "#6c96a4"
  },
  {
    id: "fegt",
    label: "FEGT",
    position: xyz(94, 0, -58),
    scale: size3(30, 6.2, 19),
    color: "#dfe8e7",
    accent: "#38bdf8",
    roof: "#557986"
  },
  {
    id: "library",
    label: "Library",
    position: xyz(92, 0, -102),
    scale: size3(29, 6.6, 20),
    color: "#eef3ee",
    accent: "#37e58f",
    roof: "#748e87"
  },
  {
    id: "admin-block",
    label: "University Admin Block",
    position: xyz(108, 0, -112),
    scale: size3(16, 6, 21),
    color: "#e4ede8",
    accent: "#38bdf8",
    roof: "#526c74"
  },
  {
    id: "fbf",
    label: "Faculty of Business and Finance",
    position: xyz(101, 0, -158),
    scale: size3(21, 5.2, 18),
    color: "#e8eee5",
    accent: "#f5b84b",
    roof: "#807760"
  },
  {
    id: "lecture-complex-1",
    label: "Lecture Complex I",
    position: xyz(48, 0, -176),
    scale: size3(29, 5.4, 36),
    color: "#e0ebe8",
    accent: "#38bdf8",
    roof: "#506a72"
  },
  {
    id: "student-pavilion-2",
    label: "Student Pavilion II",
    position: xyz(23, 0, -222),
    scale: size3(26, 4.5, 15),
    color: "#dcebe1",
    accent: "#37e58f",
    roof: "#63836b"
  },
  {
    id: "engineering-workshop",
    label: "Engineering Workshop",
    position: xyz(103, 0, -214),
    scale: size3(18, 4.2, 17),
    color: "#d3dedb",
    accent: "#f5b84b",
    roof: "#81745c"
  },
  {
    id: "learning-complex-1",
    label: "Learning Complex I",
    position: xyz(30, 0, 72),
    scale: size3(26, 5.5, 17),
    color: "#eef2ea",
    accent: "#38bdf8",
    roof: "#657d82"
  },
  {
    id: "heritage-hall",
    label: "Heritage Hall",
    position: xyz(24, 0, 104),
    scale: size3(24, 4.8, 16),
    color: "#efe7d3",
    accent: "#f5b84b",
    roof: "#8b7053"
  },
  {
    id: "existing-kolej-tar",
    label: "Existing Kolej TAR",
    position: xyz(96, 0, 136),
    scale: size3(24, 5, 17),
    color: "#dce6e3",
    accent: "#38bdf8",
    roof: "#516d75"
  },
  {
    id: "fict-ipsr",
    label: "Faculty of ICT / IPSR Labs",
    position: xyz(-72, 0, 22),
    scale: size3(30, 5.8, 19),
    color: "#e2ece8",
    accent: "#38bdf8",
    roof: "#566f7b"
  },
  {
    id: "fass-ics",
    label: "FAS / Institute of Chinese Studies",
    position: xyz(-72, 0, -52),
    scale: size3(29, 5.6, 20),
    color: "#e7eee9",
    accent: "#37e58f",
    roof: "#637f70"
  },
  {
    id: "dewan-ling",
    label: "Dewan Tun Dr Ling",
    position: xyz(-45, 0, -94),
    scale: size3(31, 7.2, 23),
    color: "#e8dfcc",
    accent: "#f5b84b",
    roof: "#8a684d"
  },
  {
    id: "phase-2",
    label: "Phase 2 Academic Zone",
    position: xyz(-96, 0, -138),
    scale: size3(25, 4.8, 24),
    color: "#d9e4e0",
    accent: "#38bdf8",
    roof: "#546e75"
  }
];

export const campusParkingZones: CampusParkingZone[] = [
  { id: "parking-a", label: "A", position: xyz(94, 0.024, 18), scale: [17, 22], rotation: -0.12 },
  { id: "parking-b", label: "B", position: xyz(96, 0.024, -58), scale: [15, 25], rotation: 0.08 },
  { id: "parking-c", label: "C", position: xyz(91, 0.024, -268), scale: [19, 29], rotation: 0.16 },
  { id: "parking-d", label: "D", position: xyz(38, 0.024, -274), scale: [20, 26], rotation: -0.12 },
  { id: "parking-e", label: "E", position: xyz(-96, 0.024, -198), scale: [17, 31], rotation: -0.14 },
  { id: "parking-f", label: "F", position: xyz(-98, 0.024, -18), scale: [15, 29], rotation: 0.08 },
  { id: "parking-g", label: "G", position: xyz(-66, 0.024, 134), scale: [16, 25], rotation: 0.32 },
  { id: "parking-h", label: "H", position: xyz(46, 0.024, 148), scale: [24, 15], rotation: -0.08 }
];

export const mapLandmarks: CampusLandmark[] = [
  {
    id: "main-bridge",
    label: "Lake 18 Bridge",
    position: xyz(6, 0.2, -146),
    color: "#38bdf8",
    size: size3(22, 0.45, 6)
  },
  {
    id: "library-calm-zone",
    label: "Library Calm Zone",
    position: xyz(34, 0.2, -126),
    color: "#37e58f",
    size: size3(18, 0.45, 12)
  },
  {
    id: "fast-slow-zone",
    label: "Workshop Slow Zone",
    position: xyz(98, 0.2, -238),
    color: "#ff5b5b",
    size: size3(18, 0.45, 12)
  },
  {
    id: "south-security",
    label: "South Gate Check",
    position: xyz(-82, 0.2, 72),
    color: "#f5b84b",
    size: size3(18, 0.45, 10)
  }
];

const lake18Trees = Array.from({ length: 54 }, (_, index): CampusTree => {
  const angle = (index / 54) * Math.PI * 2;
  const jitter = (index % 5) * 0.9;
  return {
    id: `lake18-tree-${index}`,
    position: xyz(-16 + Math.cos(angle) * (62 + jitter), 0, -56 + Math.sin(angle) * (101 + jitter * 0.7)),
    scale: 0.82 + (index % 6) * 0.08
  };
});

const lake19Trees = Array.from({ length: 24 }, (_, index): CampusTree => {
  const angle = (index / 24) * Math.PI * 2;
  return {
    id: `lake19-tree-${index}`,
    position: xyz(-48 + Math.cos(angle) * (38 + (index % 3) * 1.6), 0, 112 + Math.sin(angle) * (28 + (index % 4))),
    scale: 0.75 + (index % 5) * 0.08
  };
});

const avenueTrees = Array.from({ length: 26 }, (_, index): CampusTree => ({
  id: `east-avenue-tree-${index}`,
  position: xyz(index % 2 === 0 ? 42 : 94, 0, 78 - index * 12),
  scale: 0.72 + (index % 4) * 0.09
}));

export const campusTrees: CampusTree[] = [...lake18Trees, ...lake19Trees, ...avenueTrees];
