"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
const useMap = dynamic(() => import("react-leaflet").then((mod) => mod.useMap as any), { ssr: false }) as any;

import "leaflet/dist/leaflet.css";

let startIcon: any;
let endIcon: any;
if (typeof window !== "undefined") {
  const L = require("leaflet");

  startIcon = L.divIcon({
    html: `<div style="background:#37E58F;width:14px;height:14px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 8px rgba(55,229,143,0.6)"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    className: "",
  });

  endIcon = L.divIcon({
    html: `<div style="background:#FF5B5B;width:14px;height:14px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 8px rgba(255,91,91,0.6)"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    className: "",
  });
}

// Sub-component to fit map bounds when routes change
function FitBounds({ routes }: { routes: RoutePath[] }) {
  if (typeof window === "undefined") return null;

  // We need useMap from react-leaflet, but since we're using dynamic imports
  // we handle this differently
  return null;
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
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mapRef = useRef<any>(null);

  const origin: [number, number] = UTAR_KAMPAR;

  // Debounced search
  const handleSearchInput = useCallback((value: string) => {
    setQuery(value);
    setError(null);

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

  // Select a destination from suggestions
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

    try {
      const result = await fetchRoutes(origin, [suggestion.lat, suggestion.lon]);
      setRoutes(result);
      if (result.length > 0) {
        setSelectedRouteId(result[0].id); // auto-select eco route

        // Fit map to route bounds
        if (mapRef.current && typeof window !== "undefined") {
          const L = require("leaflet");
          const allPoints = result.flatMap(r => r.points);
          if (allPoints.length > 0) {
            const bounds = L.latLngBounds(allPoints);
            mapRef.current.fitBounds(bounds, { padding: [40, 40] });
          }
        }
      }
    } catch (err: any) {
      setError("Could not calculate routes. Try a different destination.");
    } finally {
      setLoading(false);
    }
  }, [origin]);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectRoute = (route: RoutePath) => {
    setSelectedRouteId(route.id);
    onRouteSelect?.(route);
  };

  const selectedRoute = routes.find(r => r.id === selectedRouteId);

  return (
    <div className="eco-route-planner">
      {/* Search Header */}
      <div className="route-search-section">
        <div className="route-origin">
          <div className="origin-dot" />
          <span>UTAR Kampar Campus</span>
        </div>
        <div className="route-search-connector" />
        <div className="route-search-bar" ref={searchRef}>
          <div className="dest-dot" />
          <input
            type="text"
            placeholder="Where are you going? (e.g. Ipoh, KL Sentral...)"
            value={query}
            onChange={(e) => handleSearchInput(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          />
          {loading && <div className="search-spinner" />}

          {showSuggestions && (
            <div className="search-suggestions">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  className="suggestion-item"
                  onClick={() => handleSelectDestination(s)}
                >
                  <span className="suggestion-name">{s.displayName.split(",").slice(0, 2).join(",")}</span>
                  <span className="suggestion-detail">{s.displayName.split(",").slice(2, 4).join(",")}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && <p className="route-error">{error}</p>}

      {/* Map */}
      <div className="map-container">
        <MapContainer
          center={origin}
          zoom={13}
          style={{ height: "100%", width: "100%", borderRadius: "8px" }}
          zoomControl={false}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {/* Draw non-selected routes first (dimmed) */}
          {routes.filter(r => r.id !== selectedRouteId).map((route) => (
            <Polyline
              key={route.id}
              positions={route.points}
              color={route.color}
              weight={4}
              opacity={0.3}
              eventHandlers={{ click: () => handleSelectRoute(route) }}
            />
          ))}

          {/* Draw selected route on top (bright) */}
          {selectedRoute && (
            <Polyline
              positions={selectedRoute.points}
              color={selectedRoute.color}
              weight={6}
              opacity={0.9}
            />
          )}

          {/* Origin marker */}
          {startIcon && <Marker position={origin} icon={startIcon} />}

          {/* Destination marker */}
          {destination && endIcon && (
            <Marker position={destination.coords} icon={endIcon} />
          )}
        </MapContainer>

        {/* Map overlay: no destination selected */}
        {routes.length === 0 && !loading && (
          <div className="map-overlay">
            <p>Search for a destination above to calculate eco-routes</p>
          </div>
        )}
      </div>

      {/* Route Cards */}
      {routes.length > 0 && (
        <div className="route-cards">
          {routes.map(route => {
            const isSelected = route.id === selectedRouteId;
            return (
              <button
                key={route.id}
                className={`route-card ${isSelected ? "route-card--selected" : ""} ${route.isEco ? "route-card--eco" : ""}`}
                onClick={() => handleSelectRoute(route)}
                style={{ borderLeft: `4px solid ${route.color}` }}
              >
                <div className="route-card-header">
                  <div className="route-card-title">
                    {route.isEco && <span className="eco-tag">♻ ECO</span>}
                    <h3>{route.label}</h3>
                  </div>
                  {route.ecoCoinsBonus > 0 && (
                    <span className="eco-bonus">+{route.ecoCoinsBonus} EcoCoins</span>
                  )}
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
                    <span>CO₂</span>
                    <strong style={{ color: route.isEco ? "#37E58F" : "#FF5B5B" }}>
                      {route.carbonEmissionKg} kg
                    </strong>
                  </div>
                  {route.carbonSavedKg > 0 && (
                    <div className="stat stat--save">
                      <span>Saves</span>
                      <strong>{route.carbonSavedKg} kg</strong>
                    </div>
                  )}
                </div>
                {isSelected && route.isEco && (
                  <div className="route-cta">
                    Select Eco-Route & Start Driving
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
