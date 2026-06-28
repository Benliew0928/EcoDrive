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
  advice: string;
  accent: "green" | "cyan" | "amber" | "red";
  metrics: Metric[];
};

export const modeLinks: Array<Pick<CockpitMode, "id" | "label" | "shortLabel" | "href">> = [
  { id: "drive", label: "Drive", shortLabel: "Drive", href: "/" },
  { id: "route", label: "Eco Route", shortLabel: "Route", href: "/route" },
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
    subtitle: "Live ESP32 telemetry",
    headline: "EcoDrive cockpit",
    advice: "Hold current throttle. Regen window is optimal and route is trending 12% below target energy.",
    accent: "green",
    metrics: [
      { label: "Eco score", value: "84", trend: "+12 smooth streak" },
      { label: "CO2 saved", value: "1.42 kg", trend: "vs petrol baseline" },
      { label: "Range", value: "438 km", trend: "82% battery" },
      { label: "EcoCoins", value: "245", trend: "+5 this segment" }
    ]
  },
  route: {
    id: "route",
    label: "Eco Route",
    shortLabel: "Route",
    href: "/route",
    subtitle: "Energy-first navigation",
    headline: "Eco route intelligence",
    advice: "Eco route avoids stop-start clusters and keeps speed under the high-drag range.",
    accent: "cyan",
    metrics: [
      { label: "Eco route", value: "2.1 kWh", trend: "+50 EcoCoins" },
      { label: "Fast route", value: "2.8 kWh", trend: "18 min ETA" },
      { label: "CO2 saved", value: "0.7 kg", trend: "per trip" },
      { label: "Time delta", value: "4 min", trend: "20 min ETA" }
    ]
  },
  energy: {
    id: "energy",
    label: "Energy",
    shortLabel: "Energy",
    href: "/energy",
    subtitle: "Battery, regen and charging",
    headline: "Energy cockpit",
    advice: "Nearest green charger: UTAR Solar Hub, 2.3 km away with an estimated 70% clean grid mix.",
    accent: "green",
    metrics: [
      { label: "Battery", value: "82%", trend: "438 km range" },
      { label: "Regen", value: "+18 kW", trend: "active window" },
      { label: "Motor", value: "42 kW", trend: "steady draw" },
      { label: "Grid carbon", value: "0.58", trend: "kg/kWh" }
    ]
  },
  carbonTwin: {
    id: "carbonTwin",
    label: "CarbonTwin",
    shortLabel: "Forest",
    href: "/carbon-twin",
    subtitle: "Trip-to-tree carbon story",
    headline: "CarbonTwin forest",
    advice: "This trip matured 3 saplings and unlocked a rare campus tree for sustained smooth driving.",
    accent: "green",
    metrics: [
      { label: "Trees", value: "37", trend: "+3 today" },
      { label: "Saplings", value: "9", trend: "growing" },
      { label: "CO2 forest", value: "82.4 kg", trend: "lifetime" },
      { label: "Biome", value: "4", trend: "unlocked" }
    ]
  },
  city: {
    id: "city",
    label: "Eco-City",
    shortLabel: "City",
    href: "/city",
    subtitle: "Investment and yield mode",
    headline: "Eco-City builder",
    advice: "Solar Farm plus EV Charger gives +25% Yield Coin income. Place sustainable assets beside clean transport.",
    accent: "amber",
    metrics: [
      { label: "Raw coins", value: "1,245", trend: "for building" },
      { label: "Yield", value: "68/day", trend: "for rewards" },
      { label: "Reward", value: "Coffee", trend: "100 yield coins" },
      { label: "City stage", value: "Green", trend: "level 4" }
    ]
  },
  rewards: {
    id: "rewards",
    label: "Rewards",
    shortLabel: "Rewards",
    href: "/rewards",
    subtitle: "Yield Coin marketplace",
    headline: "Rewards marketplace",
    advice: "Yield Coins convert long-term sustainable driving into real campus rewards without making the system feel transactional.",
    accent: "cyan",
    metrics: [
      { label: "Yield balance", value: "168", trend: "+68/day" },
      { label: "Coffee QR", value: "100", trend: "ready" },
      { label: "Charging credit", value: "320", trend: "locked" },
      { label: "History", value: "4", trend: "redeemed" }
    ]
  },
  community: {
    id: "community",
    label: "Community",
    shortLabel: "Community",
    href: "/community",
    subtitle: "UTAR Green Week",
    headline: "Community challenge",
    advice: "UTAR Green Week is 77% complete. Team progress unlocks 100 EcoCoins and a rare campus tree.",
    accent: "green",
    metrics: [
      { label: "Progress", value: "386 kg", trend: "of 500 kg CO2" },
      { label: "Rank", value: "#3", trend: "weekly driver" },
      { label: "Avg score", value: "86", trend: "team smoothness" },
      { label: "Challenges", value: "3", trend: "active" }
    ]
  },
  fleet: {
    id: "fleet",
    label: "Fleet",
    shortLabel: "Fleet",
    href: "/fleet",
    subtitle: "Campus EV command centre",
    headline: "Fleet diagnostics",
    advice: "Gate Road has repeated hard-braking clusters. Vehicle 03 shows unusual vibration and needs inspection.",
    accent: "red",
    metrics: [
      { label: "Active EVs", value: "6", trend: "campus fleet" },
      { label: "Avg score", value: "78", trend: "-4 vs target" },
      { label: "CO2 month", value: "2.3 t", trend: "saved" },
      { label: "Alerts", value: "3", trend: "needs review" }
    ]
  }
};

