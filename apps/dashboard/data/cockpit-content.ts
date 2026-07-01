export type ModeId =
  | "route"
  | "drive"
  | "energy"
  | "city"
  | "rewards"
  | "community"
  | "fleet";

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
  { id: "energy", label: "Energy Flow", shortLabel: "Energy", href: "/energy" },
  { id: "city", label: "Eco-City", shortLabel: "City", href: "/city" },
  { id: "rewards", label: "Marketplace", shortLabel: "Rewards", href: "/rewards" },
  { id: "community", label: "Leaderboard", shortLabel: "Social", href: "/community" },
  { id: "fleet", label: "Fleet Connect", shortLabel: "Fleet", href: "/fleet" }
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
  energy: {
    id: "energy",
    label: "Energy Flow",
    shortLabel: "Energy",
    href: "/energy",
    subtitle: "Battery, regen and motor data",
    headline: "Energy cockpit",
    accent: "green"
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
  },
  fleet: {
    id: "fleet",
    label: "Fleet",
    shortLabel: "Fleet",
    href: "/fleet",
    subtitle: "Future vehicle monitoring layer",
    headline: "Fleet diagnostics",
    accent: "red"
  }
};
