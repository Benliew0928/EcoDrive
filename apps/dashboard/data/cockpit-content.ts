export type ModeId =
  | "route"
  | "drive"
  | "city"
  | "rewards"
  | "community";

export type Metric = {
  label: string;
  value: string;
  trend: string;
};

export type CockpitMode = {
  id: ModeId;
  label: string;
  shortLabel: string;
  href: string;
  subtitle: string;
  headline: string;
  accent: "green" | "cyan" | "amber" | "red";
};

export const modeLinks: Array<Pick<CockpitMode, "id" | "label" | "shortLabel" | "href">> = [
  { id: "route", label: "Route Planner", shortLabel: "Route", href: "/route" },
  { id: "drive", label: "Live Telemetry", shortLabel: "Drive", href: "/" },
  { id: "city", label: "Eco-City", shortLabel: "City", href: "/city" },
  { id: "rewards", label: "Marketplace", shortLabel: "Rewards", href: "/rewards" },
  { id: "community", label: "Leaderboard", shortLabel: "Social", href: "/community" }
];

export const cockpitModes: Record<ModeId, CockpitMode> = {
  drive: {
    id: "drive",
    label: "Live Telemetry",
    shortLabel: "Drive",
    href: "/",
    subtitle: "Simulator telemetry cockpit",
    headline: "EcoDrive cockpit",
    accent: "green"
  },
  route: {
    id: "route",
    label: "Route Planner",
    shortLabel: "Route",
    href: "/route",
    subtitle: "Route state from simulator",
    headline: "Route intelligence",
    accent: "cyan"
  },
  city: {
    id: "city",
    label: "Eco-City",
    shortLabel: "City",
    href: "/city",
    subtitle: "Future economy layer",
    headline: "Eco-City",
    accent: "amber"
  },
  rewards: {
    id: "rewards",
    label: "Rewards",
    shortLabel: "Rewards",
    href: "/rewards",
    subtitle: "Future redemption layer",
    headline: "Rewards",
    accent: "cyan"
  },
  community: {
    id: "community",
    label: "Community",
    shortLabel: "Community",
    href: "/community",
    subtitle: "Future group challenge layer",
    headline: "Community",
    accent: "green"
  }
};
