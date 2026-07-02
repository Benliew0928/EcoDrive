import type { LucideIcon } from "lucide-react";
import { BatteryCharging, GraduationCap, Recycle, Sun, Trees, Wind } from "lucide-react";

export type CityBuildingId = "park" | "solar" | "wind" | "charger" | "recycling" | "school";

export type CityBuilding = {
  id: CityBuildingId;
  name: string;
  shortName: string;
  cost: number;
  yieldPerDay: number;
  impact: number;
  color: string;
  description: string;
  Icon: LucideIcon;
};

export type PlacedInfrastructure = {
  id: string;
  buildingId: CityBuildingId;
  x: number;
  y: number;
  rotation: number;
};

export const cityBuildings: CityBuilding[] = [
  {
    id: "park",
    name: "Green Park",
    shortName: "Park",
    cost: 100,
    yieldPerDay: 2,
    impact: 8,
    color: "#37e58f",
    description: "Cool the district and improve every neighbouring building.",
    Icon: Trees
  },
  {
    id: "solar",
    name: "Solar Farm",
    shortName: "Solar",
    cost: 300,
    yieldPerDay: 8,
    impact: 18,
    color: "#f5b84b",
    description: "Generate clean power. Pair with an EV Hub for a 25% yield bonus.",
    Icon: Sun
  },
  {
    id: "wind",
    name: "Wind Turbine",
    shortName: "Wind",
    cost: 450,
    yieldPerDay: 12,
    impact: 22,
    color: "#38bdf8",
    description: "Produce renewable energy and accelerate city-stage progress.",
    Icon: Wind
  },
  {
    id: "charger",
    name: "EV Charging Hub",
    shortName: "EV Hub",
    cost: 400,
    yieldPerDay: 10,
    impact: 20,
    color: "#8bdaff",
    description: "Support clean mobility. Place beside Solar for a 25% bonus.",
    Icon: BatteryCharging
  },
  {
    id: "recycling",
    name: "Recycling Centre",
    shortName: "Recycle",
    cost: 350,
    yieldPerDay: 9,
    impact: 16,
    color: "#9ae66e",
    description: "Build a circular economy and boost adjacent civic buildings.",
    Icon: Recycle
  },
  {
    id: "school",
    name: "Eco-School",
    shortName: "School",
    cost: 500,
    yieldPerDay: 14,
    impact: 26,
    color: "#c7a7ff",
    description: "Educate the next generation. Gains a bonus beside Recycling.",
    Icon: GraduationCap
  }
];

export const cityBuildingMap = Object.fromEntries(
  cityBuildings.map((building) => [building.id, building])
) as Record<CityBuildingId, CityBuilding>;

export const cityStages = [
  { name: "Barren Land", threshold: 0 },
  { name: "Green Settlement", threshold: 55 },
  { name: "Sustainable District", threshold: 120 },
  { name: "Eco-City", threshold: 220 },
  { name: "Eco-Metropolis", threshold: 360 }
];
