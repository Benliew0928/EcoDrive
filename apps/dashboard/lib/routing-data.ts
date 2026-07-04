// ── Types ──

export type RoutePath = {
  id: string;
  label: string;
  distanceKm: number;
  timeMins: number;
  energyKwh: number;
  carbonEmissionKg: number;
  carbonSavedKg: number;
  ecoScoreBonus: number;
  ecoCoinsBonus: number;
  color: string;
  points: [number, number][];
  isEco: boolean;
};

export const UTAR_KAMPAR: [number, number] = [4.3394, 101.1437];

export type GeocodeSuggestion = {
  displayName: string;
  lat: number;
  lon: number;
};

type OsrmRoute = {
  distance: number;
  duration: number;
  geometry?: {
    coordinates?: [number, number][];
  };
};

type RouteCandidate = RoutePath & {
  originalIndex: number;
};

// ── EV Physics-Based Carbon Emission Model ──
// Derived from longitudinal vehicle dynamics (Fiori et al., Renewable & Sustainable
// Energy Reviews, 2016) and validated against the U-shaped energy-speed curve
// documented in MDPI Energies (2021).
//
// Total tractive force:  F_total = F_roll + F_aero + F_inertia
//   F_roll  = m · g · Cr                        (rolling resistance)
//   F_aero  = 0.5 · ρ · Cd · A · v²             (aerodynamic drag)
//   F_inertia = m · a                            (acceleration force, ~0 at cruise)
//
// Power at wheels:  P = F_total · v
// Energy per km:    E = P / v  →  F_total  (in N, then convert to kWh/km)
// CO₂ per km:       CO₂ = E / η_powertrain × GEF_Malaysia
//
// Malaysia Grid Emission Factor (GEF): 0.740 kg CO₂/kWh
// (Source: Energy Commission of Malaysia / Suruhanjaya Tenaga, 2024)

// ── Vehicle Constants (typical mid-size EV, e.g. BYD Atto 3 / Tesla Model 3) ──
const EV_MASS       = 1800;     // kg (vehicle + driver)
const GRAVITY       = 9.81;     // m/s²
const C_ROLLING     = 0.011;    // rolling resistance coefficient (low rolling resistance tyres)
const AIR_DENSITY   = 1.164;    // kg/m³ (tropical Malaysia, ~30°C)
const C_DRAG        = 0.23;     // aerodynamic drag coefficient
const FRONTAL_AREA  = 2.22;     // m² (frontal cross-section)
const ETA_POWERTRAIN = 0.85;    // motor + inverter + driveline efficiency
const AUX_POWER_KW  = 0.8;     // auxiliary loads (A/C, lights, electronics) in kW
const GEF_MALAYSIA   = 0.740;   // kg CO₂ per kWh (Peninsular Malaysia grid, 2024)

/**
 * Calculate CO₂ emission (kg) for a route, using physics-based EV energy model.
 *
 * @param distanceKm   Total route distance in km
 * @param avgSpeedKmh  Average speed over the route in km/h
 * @returns            CO₂ emission in kg
 */
export function calculateRouteCO2(distanceKm: number, avgSpeedKmh: number): number {
  const v = avgSpeedKmh / 3.6; // convert km/h → m/s

  // Force components at constant cruise (a ≈ 0 for route-level estimation)
  const F_roll = EV_MASS * GRAVITY * C_ROLLING;
  const F_aero = 0.5 * AIR_DENSITY * C_DRAG * FRONTAL_AREA * v * v;
  const F_total = F_roll + F_aero;  // Newtons

  // Power at wheels (kW)
  const P_traction_kW = (F_total * v) / 1000;

  // Total power including auxiliaries, divided by powertrain efficiency
  const P_total_kW = (P_traction_kW / ETA_POWERTRAIN) + AUX_POWER_KW;

  // Energy consumption rate (kWh per km)
  const energyPerKm = P_total_kW / avgSpeedKmh;

  // Total energy for the route (kWh)
  const totalEnergyKwh = energyPerKm * distanceKm;

  // Convert grid electricity to CO₂
  const co2Kg = totalEnergyKwh * GEF_MALAYSIA;

  return parseFloat(co2Kg.toFixed(2));
}

// ── OSRM Polyline Decoder ──
// ── Nominatim Geocoding (free, no API key) ──

export async function searchPlaces(query: string): Promise<GeocodeSuggestion[]> {
  if (query.trim().length < 2) return [];

  const url = `https://nominatim.openstreetmap.org/search?` +
    `q=${encodeURIComponent(query)}` +
    `&format=json&limit=5&countrycodes=my&addressdetails=1`;

  const res = await fetch(url, {
    headers: { "Accept-Language": "en" }
  });

  if (!res.ok) return [];

  const data = await res.json();
  return data.map((item: any) => ({
    displayName: item.display_name,
    lat: parseFloat(item.lat),
    lon: parseFloat(item.lon),
  }));
}

// ── OSRM Routing (free, no API key) ──

export async function fetchRoutes(
  origin: [number, number],
  destination: [number, number]
): Promise<RoutePath[]> {
  const directRoutes = await fetchOsrmRoutes([origin, destination], true);
  if (directRoutes.length === 0) throw new Error("No routes found");

  const fallbackRoutes =
    directRoutes.length >= 3
      ? []
      : (await Promise.all(
          buildAlternativeWaypoints(origin, destination).map((waypoint) =>
            fetchOsrmRoutes([origin, waypoint, destination], false)
          )
        )).flat();

  const rawRoutes = [...directRoutes, ...fallbackRoutes];
  const primaryRoute = directRoutes[0];
  const maxReasonableDistance = primaryRoute.distance * 1.55;
  const maxReasonableDuration = primaryRoute.duration * 1.75;
  const uniqueGeometries = new Set<string>();
  const validRoutes: RouteCandidate[] = [];
  
  rawRoutes.forEach((route, i) => {
    const points = route.geometry?.coordinates?.map(([lon, lat]) => [lat, lon] as [number, number]) ?? [];
    if (points.length < 2) return;
    if (route.distance > maxReasonableDistance || route.duration > maxReasonableDuration) return;

    const geometryKey = points
      .filter((_, index) => index === 0 || index === points.length - 1 || index % Math.max(1, Math.floor(points.length / 8)) === 0)
      .map(([lat, lon]) => `${lat.toFixed(4)},${lon.toFixed(4)}`)
      .join("|");

    if (uniqueGeometries.has(geometryKey)) return;
    uniqueGeometries.add(geometryKey);

    const distanceKm = route.distance / 1000;
    const timeMins = route.duration / 60;
    const avgSpeed = distanceKm / (timeMins / 60);
    const carbonEmissionKg = calculateRouteCO2(distanceKm, avgSpeed);

    // Also compute energy for display (same formula, without GEF multiplication)
    const v = avgSpeed / 3.6;
    const F_roll = EV_MASS * GRAVITY * C_ROLLING;
    const F_aero = 0.5 * AIR_DENSITY * C_DRAG * FRONTAL_AREA * v * v;
    const P_kW = ((F_roll + F_aero) * v / 1000 / ETA_POWERTRAIN) + AUX_POWER_KW;
    const energyKwh = parseFloat(((P_kW / avgSpeed) * distanceKm).toFixed(2));

    validRoutes.push({
      id: `route-${i}`,
      label: "",
      distanceKm: parseFloat(distanceKm.toFixed(1)),
      timeMins: Math.round(timeMins),
      energyKwh,
      carbonEmissionKg,
      carbonSavedKg: 0,
      ecoScoreBonus: 0,
      ecoCoinsBonus: 0,
      color: "",
      points,
      isEco: false,
      originalIndex: i,
    });
  });

  if (validRoutes.length === 0) throw new Error("No routes found");

  const ecoRoute = minBy(validRoutes, (route) =>
    route.carbonEmissionKg * 10000 +
    route.timeMins * 10 +
    route.distanceKm
  );
  const shortestRoute = minBy(validRoutes, (route) =>
    route.distanceKm * 10000 +
    route.timeMins
  );
  const fastestRoute = minBy(validRoutes, (route) =>
    route.timeMins * 10000 +
    route.distanceKm
  );

  const orderedRoutes = [
    ecoRoute,
    shortestRoute,
    fastestRoute,
    ...validRoutes.sort((a, b) =>
      a.carbonEmissionKg - b.carbonEmissionKg ||
      a.distanceKm - b.distanceKm ||
      a.timeMins - b.timeMins
    )
  ].filter((route, index, routes) =>
    routes.findIndex((candidate) => candidate.originalIndex === route.originalIndex) === index
  ).slice(0, 4);

  const lowestCarbon = ecoRoute.carbonEmissionKg;
  const secondBestCarbon = validRoutes
    .filter((route) => route.originalIndex !== ecoRoute.originalIndex)
    .sort((a, b) =>
      a.carbonEmissionKg - b.carbonEmissionKg ||
      a.distanceKm - b.distanceKm
    )[0]?.carbonEmissionKg ?? lowestCarbon;
  const baselineCarbon =
    shortestRoute.originalIndex === ecoRoute.originalIndex
      ? secondBestCarbon
      : shortestRoute.carbonEmissionKg;
  const ecoCarbonSaved = parseFloat(Math.max(0, baselineCarbon - lowestCarbon).toFixed(2));
  const ecoCoinsBonus = Math.max(50, Math.round(50 + ecoCarbonSaved * 120));
  const ecoScoreBonus = Math.max(120, Math.round(120 + ecoCarbonSaved * 180));
  let alternativeCount = 1;

  orderedRoutes.forEach((route, i) => {
    route.id = `route-${i}`;

    if (route.originalIndex === ecoRoute.originalIndex) {
      route.isEco = true;
      route.label =
        route.originalIndex === shortestRoute.originalIndex
          ? "Eco Save + Shortest"
          : "Eco Save Route";
      route.color = "#37E58F";
      route.carbonSavedKg = ecoCarbonSaved;
      route.ecoCoinsBonus = ecoCoinsBonus;
      route.ecoScoreBonus = ecoScoreBonus;
      return;
    }

    route.isEco = false;
    route.ecoCoinsBonus = 0;
    route.ecoScoreBonus = 0;
    route.carbonSavedKg = 0;

    if (route.originalIndex === shortestRoute.originalIndex) {
      route.label = "Shortest Route";
      route.color = "#FF5B5B";
    } else if (route.originalIndex === fastestRoute.originalIndex) {
      route.label = "Fast Route";
      route.color = "#F5B84B";
    } else {
      route.label = `Alternative ${alternativeCount}`;
      route.color = alternativeCount === 1 ? "#38BDF8" : "#F5B84B";
      alternativeCount += 1;
    }
  });

  return orderedRoutes.map(({ originalIndex, ...route }) => route);
}

async function fetchOsrmRoutes(
  coordinates: [number, number][],
  includeAlternatives: boolean
): Promise<OsrmRoute[]> {
  const coordinateString = coordinates.map(([lat, lon]) => `${lon},${lat}`).join(";");
  const alternatives = includeAlternatives ? "true" : "false";
  const url =
    `https://router.project-osrm.org/route/v1/driving/${coordinateString}` +
    `?alternatives=${alternatives}&overview=full&geometries=geojson&continue_straight=false`;

  try {
    const res = await fetch(url);
    if (!res.ok) return [];

    const data = await res.json();
    return Array.isArray(data.routes) ? data.routes : [];
  } catch {
    return [];
  }
}

function buildAlternativeWaypoints(
  origin: [number, number],
  destination: [number, number]
): [number, number][] {
  const midLat = (origin[0] + destination[0]) / 2;
  const midLon = (origin[1] + destination[1]) / 2;
  const latKm = 111.32;
  const lonKm = Math.max(30, Math.cos(midLat * Math.PI / 180) * latKm);
  const dxKm = (destination[1] - origin[1]) * lonKm;
  const dyKm = (destination[0] - origin[0]) * latKm;
  const straightKm = Math.max(1, Math.hypot(dxKm, dyKm));
  const offsetKm = Math.min(10, Math.max(2.5, straightKm * 0.18));
  const length = Math.max(1, Math.hypot(dxKm, dyKm));
  const perpX = -dyKm / length;
  const perpY = dxKm / length;

  return [-1, 1, -1.45, 1.45].map((side) => {
    const offset = offsetKm * side;
    const alongShift = straightKm * 0.08 * Math.sign(side);

    return [
      midLat + ((perpY * offset) + (dyKm / length * alongShift)) / latKm,
      midLon + ((perpX * offset) + (dxKm / length * alongShift)) / lonKm,
    ];
  });
}

function minBy<T>(items: T[], score: (item: T) => number): T {
  return items.reduce((best, item) => score(item) < score(best) ? item : best);
}
