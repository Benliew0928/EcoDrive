// ── Types ──

export type RoutePath = {
  id: string;
  label: string;
  distanceKm: number;
  timeMins: number;
  carbonEmissionKg: number;
  carbonSavedKg: number;
  ecoCoinsBonus: number;
  color: string;
  points: [number, number][];
  isEco: boolean;
};

export type GeocodeSuggestion = {
  displayName: string;
  lat: number;
  lon: number;
};

// ── Constants ──

export const UTAR_KAMPAR: [number, number] = [4.3394, 101.1437];

// ── Carbon Emission Model ──
// Based on EV physics: stop-and-go wastes regen cycles, high speed = aero drag
function emissionFactorForSpeed(avgSpeedKmh: number): number {
  if (avgSpeedKmh < 30) return 0.22;   // city crawl, stop-and-go
  if (avgSpeedKmh <= 60) return 0.16;   // optimal EV range
  if (avgSpeedKmh <= 90) return 0.19;   // suburban
  return 0.24;                           // highway, aerodynamic drag
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
    const factor = emissionFactorForSpeed(avgSpeed);
    const carbonEmissionKg = parseFloat((distanceKm * factor).toFixed(2));

    validRoutes.push({
      id: `route-${i}`,
      label: "",
      distanceKm: parseFloat(distanceKm.toFixed(1)),
      timeMins: Math.round(timeMins),
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
