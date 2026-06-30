"use client";

import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, Tooltip } from "react-leaflet";
import { routeOptions } from "../lib/dashboard-data";
import type { RouteId } from "../types/dashboard";

type RouteMapProps = {
  activeRouteId: RouteId;
  onSelectRoute: (routeId: RouteId) => void;
};

const campusCenter: [number, number] = [4.3376, 101.1429];

export function RouteMap({ activeRouteId, onSelectRoute }: RouteMapProps) {
  return (
    <MapContainer attributionControl={false} center={campusCenter} className="leaflet-route-map" scrollWheelZoom={false} zoom={16}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {routeOptions.map((route) => (
        <Polyline
          eventHandlers={{ click: () => onSelectRoute(route.id) }}
          key={route.id}
          pathOptions={{
            color: route.color,
            opacity: activeRouteId === route.id ? 0.96 : 0.48,
            weight: activeRouteId === route.id ? 8 : 5
          }}
          positions={route.coordinates}
        >
          <Tooltip sticky>
            {route.label}: {route.etaMin} min, {route.energyKwh} kWh
          </Tooltip>
        </Polyline>
      ))}
      <CircleMarker center={routeOptions[0].coordinates[0]} pathOptions={{ color: "#f5fffa", fillColor: "#37e58f" }} radius={8}>
        <Popup>East Gate start</Popup>
      </CircleMarker>
      <CircleMarker center={routeOptions[0].coordinates[routeOptions[0].coordinates.length - 1]} pathOptions={{ color: "#f5fffa", fillColor: "#38bdf8" }} radius={8}>
        <Popup>Library / Heritage Hall</Popup>
      </CircleMarker>
    </MapContainer>
  );
}
