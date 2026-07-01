export type ModeId =
  | "drive"
  | "route"
  | "energy"
  | "carbonTwin"
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
  { id: "drive", label: "Drive", shortLabel: "Drive", href: "/" },
  { id: "route", label: "Route", shortLabel: "Route", href: "/route" },
  { id: "energy", label: "Energy", shortLabel: "Energy", href: "/energy" },
  { id: "carbonTwin", label: "CarbonTwin", shortLabel: "Forest", href: "/carbon-twin" },
  { id: "city", label: "Eco-City", shortLabel: "City", href: "/city" },
  { id: "rewards", label: "Rewards", shortLabel: "Rewards", href: "/rewards" },
  { id: "community", label: "Community", shortLabel: "Community", href: "/community" },
  { id: "fleet", label: "Fleet", shortLabel: "Fleet", href: "/fleet" }
];

export const cockpitModes: Record<ModeId, CockpitMode> = {
  drive: {
    id: "drive",
    label: "Drive",
    shortLabel: "Drive",
    href: "/",
    subtitle: "Simulator telemetry cockpit",
    headline: "EcoDrive cockpit",
    accent: "green"
  },
  route: {
    id: "route",
    label: "Route",
    shortLabel: "Route",
    href: "/route",
    subtitle: "Route state from simulator",
    headline: "Route intelligence",
    accent: "cyan"
  },
  energy: {
    id: "energy",
    label: "Energy",
    shortLabel: "Energy",
    href: "/energy",
    subtitle: "Battery, regen and motor data",
    headline: "Energy cockpit",
    accent: "green"
  },
  carbonTwin: {
    id: "carbonTwin",
    label: "CarbonTwin",
    shortLabel: "Forest",
    href: "/carbon-twin",
    subtitle: "Carbon model from real drives",
    headline: "CarbonTwin",
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
