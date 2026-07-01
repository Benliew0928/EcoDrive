"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
  const [clock, setClock] = useState("--:--");
  const speed = telemetry?.speedKmh == null ? "--" : Math.round(telemetry.speedKmh).toString();
  const numericSpeed = telemetry?.speedKmh ?? 0;
  const gear = telemetry?.speedKmh == null ? "--" : numericSpeed < -1 ? "R" : numericSpeed > 1 ? "D" : "P";
  const battery = telemetry?.batteryPercent == null ? "-- battery" : `${Math.round(telemetry.batteryPercent)}% battery`;
  const range = telemetry?.rangeKm == null ? "-- km" : `${Math.round(telemetry.rangeKm)} km`;
  const statusLabel =
    connectionStatus === "live"
      ? "Simulator live"
      : connectionStatus === "connecting"
        ? "Connecting"
        : connectionStatus === "error"
          ? "Connection error"
          : connectionStatus === "disconnected"
            ? "Disconnected"
            : "Waiting for data";

  useEffect(() => {
    const updateClock = () =>
      setClock(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit"
        })
      );

    updateClock();
    const interval = window.setInterval(updateClock, 30_000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className={`cockpit-shell cockpit-shell--${mode.accent}`}>
      <header className="vehicle-status">
        <div className="status-left">
          <span className="clock">{clock}</span>
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
          <span className="battery-pill">{battery}</span>
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
          <span>{range}</span>
        </div>
      </nav>
    </div>
  );
}
