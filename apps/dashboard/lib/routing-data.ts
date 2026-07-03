// ── Types ──

export type RoutePath = {
  id: string;
  label: string;
  distanceKm: number;
  timeMins: number;
  energyKwh: number;
  carbonEmissionKg: number;
  carbonSavedKg: number;
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
// Decodes Google-encoded polyline format used by OSRM
function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push([lat / 1e5, lng / 1e5]);
  }

  return points;
}

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
  // OSRM expects lon,lat (not lat,lon)
  const originStr = `${origin[1]},${origin[0]}`;
  const destStr = `${destination[1]},${destination[0]}`;

  // Request 1: Direct route with alternatives
  const urlDirect = `https://router.project-osrm.org/route/v1/driving/${originStr};${destStr}?alternatives=3&overview=full&geometries=polyline`;

  // Request 2: Deviated route (waypoint offset by ~5km to force an alternative path)
  const midLat = (origin[0] + destination[0]) / 2;
  const midLon = (origin[1] + destination[1]) / 2;
  const offsetLon = midLon + 0.05; // offset longitude
  const waypointsUrl = `https://router.project-osrm.org/route/v1/driving/${originStr};${offsetLon},${midLat};${destStr}?overview=full&geometries=polyline`;

  // Fetch both in parallel
  const [resDirect, resDeviated] = await Promise.all([
    fetch(urlDirect),
    fetch(waypointsUrl)
  ]);

  const rawRoutes: any[] = [];
  
  if (resDirect.ok) {
    const dataDirect = await resDirect.json();
    if (dataDirect.routes) rawRoutes.push(...dataDirect.routes);
  }
  
  if (resDeviated.ok) {
    const dataDeviated = await resDeviated.json();
    if (dataDeviated.routes) rawRoutes.push(...dataDeviated.routes);
  }

  if (rawRoutes.length === 0) throw new Error("No routes found");

  // Calculate carbon for each real route and remove identical routes (deduplication)
  const uniqueDistances = new Set<string>();
  const validRoutes: RoutePath[] = [];
  
  rawRoutes.forEach((route: any, i: number) => {
    let distanceKm = route.distance / 1000;
    let timeMins = route.duration / 60;
    
    // Deduplicate by distance (rounded to 1 decimal)
    const distKey = distanceKm.toFixed(1);
    if (uniqueDistances.has(distKey)) return;
    uniqueDistances.add(distKey);

    let points = decodePolyline(route.geometry);
    const avgSpeed = distanceKm / (timeMins / 60);
    const carbonEmissionKg = calculateRouteCO2(distanceKm, avgSpeed);

    // Also compute energy for display (same formula, without GEF multiplication)
    const v = avgSpeed / 3.6;
    const F_roll = 1800 * 9.81 * 0.011;
    const F_aero = 0.5 * 1.164 * 0.23 * 2.22 * v * v;
    const P_kW = ((F_roll + F_aero) * v / 1000 / 0.85) + 0.8;
    const energyKwh = parseFloat(((P_kW / avgSpeed) * distanceKm).toFixed(2));

    validRoutes.push({
      id: `route-${i}`,
      label: "",
      distanceKm: parseFloat(distanceKm.toFixed(1)),
      timeMins: Math.round(timeMins),
      energyKwh,
      carbonEmissionKg,
      carbonSavedKg: 0,
      ecoCoinsBonus: 0,
      color: "",
      points,
      isEco: false,
    });
  });

  // Sort by carbon emission to find the eco route
  validRoutes.sort((a, b) => a.carbonEmissionKg - b.carbonEmissionKg);

  const lowestCarbon = validRoutes[0].carbonEmissionKg;

  validRoutes.forEach((route, i) => {
    if (i === 0) {
      route.isEco = true;
      route.label = "Eco Route";
      route.color = "#37E58F";
      route.carbonSavedKg = 0;
      route.ecoCoinsBonus = 50;
    } else {
      route.isEco = false;
      route.label = validRoutes.length === 2 ? "Fast Route" : `Alternative ${i}`;
      route.color = i === 1 ? "#FF5B5B" : "#F5B84B";
      route.carbonSavedKg = 0;
      route.ecoCoinsBonus = 0;
    }

    if (!route.isEco) {
      route.carbonSavedKg = parseFloat((route.carbonEmissionKg - lowestCarbon).toFixed(2));
    }
  });

  return validRoutes;
}
