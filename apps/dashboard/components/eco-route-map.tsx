"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  fetchRoutes,
  searchPlaces,
  UTAR_KAMPAR,
  type RoutePath,
  type GeocodeSuggestion
} from "../lib/routing-data";

const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Polyline = dynamic(() => import("react-leaflet").then((mod) => mod.Polyline), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });

import "leaflet/dist/leaflet.css";

let startIcon: any;
let endIcon: any;
let carIcon: any;

if (typeof window !== "undefined") {
  const L = require("leaflet");

  startIcon = L.divIcon({
    html: `<div class="route-marker route-marker--start"></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    className: ""
  });

  endIcon = L.divIcon({
    html: `<div class="route-marker route-marker--end"></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    className: ""
  });

  carIcon = L.divIcon({
    html: `<div class="route-car-marker"><span></span></div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    className: ""
  });
}

export function EcoRouteMap({ onRouteSelect }: { onRouteSelect?: (route: RoutePath) => void }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [destination, setDestination] = useState<{ name: string; coords: [number, number] } | null>(null);
  const [routes, setRoutes] = useState<RoutePath[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDriving, setIsDriving] = useState(false);
  const [driveProgress, setDriveProgress] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mapRef = useRef<any>(null);

  const origin: [number, number] = UTAR_KAMPAR;

  const handleSearchInput = useCallback((value: string) => {
    setQuery(value);
    setError(null);
    setIsDriving(false);
    setDriveProgress(0);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchPlaces(value);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch {
        setSuggestions([]);
      }
    }, 400);
  }, []);

  const fitMapToRoutes = useCallback((routeList: RoutePath[]) => {
    if (!mapRef.current || typeof window === "undefined") return;

    const L = require("leaflet");
    const allPoints = routeList.flatMap((route) => route.points);
    if (!allPoints.length) return;

    const bounds = L.latLngBounds(allPoints);
    mapRef.current.fitBounds(bounds, { padding: [48, 48] });
  }, []);

  const handleSelectDestination = useCallback(async (suggestion: GeocodeSuggestion) => {
    const shortName = suggestion.displayName.split(",").slice(0, 2).join(",").trim();
    setDestination({ name: shortName, coords: [suggestion.lat, suggestion.lon] });
    setQuery(shortName);
    setShowSuggestions(false);
    setSuggestions([]);
    setLoading(true);
    setError(null);
    setRoutes([]);
    setSelectedRouteId(null);
    setIsDriving(false);
    setDriveProgress(0);

    try {
      const result = await fetchRoutes(origin, [suggestion.lat, suggestion.lon]);
      setRoutes(result);
      if (result.length > 0) {
        setSelectedRouteId(result[0].id);
        fitMapToRoutes(result);
      }
    } catch {
      setError("Could not calculate routes. Try a different destination.");
    } finally {
      setLoading(false);
    }
  }, [fitMapToRoutes, origin]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isDriving || !routes.length) return;

    const timer = window.setInterval(() => {
      setDriveProgress((progress) => {
        if (progress >= 0.98) return 0.98;
        return progress + 0.006;
      });
    }, 600);

    return () => window.clearInterval(timer);
  }, [isDriving, routes.length]);

  const selectedRoute = routes.find((route) => route.id === selectedRouteId);

  const routeProgress = useMemo(() => {
    if (!selectedRoute || selectedRoute.points.length === 0) {
      return {
        travelledPoints: [] as [number, number][],
        remainingPoints: [] as [number, number][],
        carPosition: origin,
        remainingKm: 0,
        remainingMins: 0
      };
    }

    const maxIndex = Math.max(0, selectedRoute.points.length - 1);
    const routeIndex = Math.min(maxIndex, Math.max(0, Math.floor(driveProgress * maxIndex)));
    const travelledPoints = selectedRoute.points.slice(0, routeIndex + 1);
    const remainingPoints = selectedRoute.points.slice(routeIndex);

    return {
      travelledPoints,
      remainingPoints,
      carPosition: selectedRoute.points[routeIndex] ?? origin,
      remainingKm: Math.max(0, selectedRoute.distanceKm * (1 - driveProgress)),
      remainingMins: Math.max(0, selectedRoute.timeMins * (1 - driveProgress))
    };
  }, [driveProgress, origin, selectedRoute]);

  const handleSelectRoute = (route: RoutePath) => {
    setSelectedRouteId(route.id);
    setIsDriving(false);
    setDriveProgress(0);
    onRouteSelect?.(route);
  };

  const handleStartDriving = () => {
    if (!selectedRoute) return;
    setIsDriving(true);
    setDriveProgress(0);
    onRouteSelect?.(selectedRoute);
    fitMapToRoutes([selectedRoute]);
  };

  const handleStopDemo = () => {
    setIsDriving(false);
    setDriveProgress(0);
    if (selectedRoute) fitMapToRoutes([selectedRoute]);
  };

  return (
    <div className={`eco-route-planner ${isDriving ? "eco-route-planner--driving" : ""}`}>
      <aside className="route-control-panel" aria-label="Route controls">
        <div className="route-mode-heading">
          <span>{isDriving ? "Driving demo" : "Route planner"}</span>
          <strong>{isDriving ? "Eco route active" : "Choose your destination"}</strong>
        </div>

        {!isDriving ? (
          <>
            <div className="route-location-stack" ref={searchRef}>
              <div className="route-location-card route-location-card--origin">
                <span className="route-location-kicker">From</span>
                <strong>UTAR Kampar Campus</strong>
              </div>

              <div className="route-search-card">
                <span className="route-location-kicker">To</span>
                <label className="route-search-label" htmlFor="route-destination-input">
                  Destination
                </label>
                <input
                  id="route-destination-input"
                  type="text"
                  placeholder="Tap here, then search a place"
                  value={query}
                  onChange={(event) => handleSearchInput(event.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                />
                {loading ? <div className="search-spinner" /> : null}

                {showSuggestions ? (
                  <div className="search-suggestions">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={`${suggestion.displayName}-${index}`}
                        className="suggestion-item"
                        onClick={() => handleSelectDestination(suggestion)}
                        type="button"
                      >
                        <span className="suggestion-name">{suggestion.displayName.split(",").slice(0, 2).join(",")}</span>
                        <span className="suggestion-detail">{suggestion.displayName.split(",").slice(2, 4).join(",")}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            {error ? <p className="route-error">{error}</p> : null}

            {routes.length > 0 ? (
              <div className="route-cards" aria-label="Available routes">
                {routes.map((route) => {
                  const isSelected = route.id === selectedRouteId;
                  return (
                    <button
                      key={route.id}
                      className={`route-card ${isSelected ? "route-card--selected" : ""} ${route.isEco ? "route-card--eco" : ""}`}
                      onClick={() => handleSelectRoute(route)}
                      style={{ borderLeft: `8px solid ${route.color}` }}
                      type="button"
                    >
                      <div className="route-card-header">
                        <div className="route-card-title">
                          {route.isEco ? <span className="eco-tag">ECO</span> : null}
                          <h3>{route.label}</h3>
                        </div>
                        {route.ecoCoinsBonus > 0 ? (
                          <span className="eco-bonus">+{route.ecoCoinsBonus}</span>
                        ) : null}
                      </div>
                      <div className="route-stats">
                        <div className="stat">
                          <span>Distance</span>
                          <strong>{route.distanceKm} km</strong>
                        </div>
                        <div className="stat">
                          <span>Time</span>
                          <strong>{route.timeMins} min</strong>
                        </div>
                        <div className="stat">
                          <span>CO2</span>
                          <strong style={{ color: route.isEco ? "#37E58F" : "#FF5B5B" }}>
                            {route.carbonEmissionKg} kg
                          </strong>
                        </div>
                        {route.carbonSavedKg > 0 ? (
                          <div className="stat stat--save">
                            <span>Saves</span>
                            <strong>{route.carbonSavedKg} kg</strong>
                          </div>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : null}

            {selectedRoute ? (
              <button className="route-start-drive-btn" onClick={handleStartDriving} type="button">
                Start Driving
              </button>
            ) : null}
          </>
        ) : (
          <div className="route-drive-panel">
            <button className="route-compact-location" onClick={handleStopDemo} type="button">
              <span>From</span>
              <strong>UTAR Kampar</strong>
            </button>
            <button className="route-compact-location" onClick={handleStopDemo} type="button">
              <span>To</span>
              <strong>{destination?.name ?? "Destination"}</strong>
            </button>

            <div className="route-drive-stats">
              <div>
                <span>Remaining</span>
                <strong>{routeProgress.remainingKm.toFixed(1)} km</strong>
              </div>
              <div>
                <span>ETA</span>
                <strong>{Math.ceil(routeProgress.remainingMins)} min</strong>
              </div>
              <div>
                <span>Progress</span>
                <strong>{Math.round(driveProgress * 100)}%</strong>
              </div>
            </div>

            <button className="route-stop-drive-btn" onClick={handleStopDemo} type="button">
              Stop Demo
            </button>
          </div>
        )}
      </aside>

      <div className="map-container route-map-stage">
        <MapContainer
          center={origin}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
          ref={mapRef}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap"
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {!isDriving ? routes.filter((route) => route.id !== selectedRouteId).map((route) => (
            <Polyline
              key={route.id}
              positions={route.points}
              color={route.color}
              weight={6}
              opacity={0.3}
              eventHandlers={{ click: () => handleSelectRoute(route) }}
            />
          )) : null}

          {isDriving && routeProgress.travelledPoints.length > 1 ? (
            <Polyline
              positions={routeProgress.travelledPoints}
              color="#5f7471"
              weight={8}
              opacity={0.45}
            />
          ) : null}

          {selectedRoute ? (
            <Polyline
              positions={isDriving ? routeProgress.remainingPoints : selectedRoute.points}
              color={selectedRoute.color}
              weight={isDriving ? 9 : 8}
              opacity={0.95}
            />
          ) : null}

          {startIcon ? <Marker position={origin} icon={startIcon} /> : null}
          {destination && endIcon ? <Marker position={destination.coords} icon={endIcon} /> : null}
          {isDriving && carIcon ? <Marker position={routeProgress.carPosition} icon={carIcon} /> : null}
        </MapContainer>

        {routes.length === 0 && !loading ? (
          <div className="map-overlay">
            <p>Tap the destination panel to calculate eco-routes</p>
          </div>
        ) : null}

        {loading ? (
          <div className="map-overlay map-overlay--loading">
            <p>Finding dashboard-friendly route choices...</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
