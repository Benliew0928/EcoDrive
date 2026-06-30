"use client";

import Link from "next/link";
import {
  BatteryCharging,
  Building2,
  Fan,
  Gauge,
  Gift,
  Leaf,
  Map,
  RadioTower,
  Snowflake,
  Sprout,
  Trees,
  Users,
  Wind
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cockpitModes, modeLinks, type ModeId } from "../data/cockpit-content";
import { useDashboardRuntime } from "../hooks/use-dashboard-runtime";
import { useDashboardStore } from "../lib/dashboard-store";

const modeIcons: Record<ModeId, LucideIcon> = {
  drive: Gauge,
  route: Map,
  energy: BatteryCharging,
  carbonTwin: Trees,
  city: Building2,
  rewards: Gift,
  community: Users,
  fleet: RadioTower
};

type CockpitShellProps = {
  activeMode: ModeId;
  children: React.ReactNode;
};

export function CockpitShell({ activeMode, children }: CockpitShellProps) {
  useDashboardRuntime();
  const mode = cockpitModes[activeMode];
  const telemetry = useDashboardStore((state) => state.telemetry);
  const connectionStatus = useDashboardStore((state) => state.connectionStatus);
  const speed = Math.round(telemetry.speedKmh);
  const gear = telemetry.speedKmh > 1 ? "D" : "P";
  const statusLabel =
    connectionStatus === "live"
      ? "ESP32 sensor live"
      : connectionStatus === "connecting"
        ? "Connecting ESP32"
        : connectionStatus === "error"
          ? "ESP32 reconnect"
          : "Demo mode";

  return (
    <div className={`cockpit-shell cockpit-shell--${mode.accent}`}>
      <header className="vehicle-status">
        <div className="status-left">
          <span className="clock">13:42</span>
          <div>
            <p className="brand">EcoDrive+</p>
            <p className="mode-subtitle">{mode.subtitle}</p>
          </div>
        </div>
        <div className="speed-readout">
          <span>{speed}</span>
          <small>km/h</small>
          <strong>{gear}</strong>
        </div>
        <div className="status-right">
          <span className={`live-pill live-pill--${connectionStatus}`}>
            <RadioTower size={15} />
            {statusLabel}
          </span>
          <span className="battery-pill">{Math.round(telemetry.batteryPercent)}% battery</span>
        </div>
      </header>

      {children}

      <nav className="vehicle-dock" aria-label="Cockpit modes">
        <div className="climate-cluster">
          <span>22.5 C</span>
          <Snowflake size={15} />
          <Fan size={15} />
          <Wind size={15} />
        </div>
        <div className="mode-cluster">
          {modeLinks.map((item) => {
            const Icon = modeIcons[item.id];
            const isActive = item.id === activeMode;

            return (
              <Link
                className={`mode-chip ${isActive ? "mode-chip--active" : ""}`}
                href={item.href}
                key={item.id}
              >
                <Icon size={16} />
                <span>{item.shortLabel}</span>
              </Link>
            );
          })}
        </div>
        <div className="range-cluster">
          <Leaf size={15} />
          <span>{Math.round(telemetry.rangeKm)} km</span>
        </div>
      </nav>
    </div>
  );
}
