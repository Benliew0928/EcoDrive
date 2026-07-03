"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Building2,
  Gauge,
  Gift,
  Leaf,
  Map,
  RadioTower,
  Users
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cockpitModes, modeLinks, type ModeId } from "../data/cockpit-content";
import { useDashboardRuntime } from "../hooks/use-dashboard-runtime";
import { useDashboardStore } from "../lib/dashboard-store";

const modeIcons: Record<ModeId, LucideIcon> = {
  drive: Gauge,
  route: Map,
  city: Building2,
  rewards: Gift,
  community: Users
};

type CockpitShellProps = {
  activeMode: ModeId;
  children: React.ReactNode;
};

export function CockpitShell({ activeMode, children }: CockpitShellProps) {
  useEffect(() => {
    void useDashboardStore.persist.rehydrate();
  }, []);

  const hasHydrated = useDashboardStore((state) => state.hasHydrated);
  useDashboardRuntime(hasHydrated);
  const mode = cockpitModes[activeMode];
  const connectionStatus = useDashboardStore((state) => state.connectionStatus);
  const walletCoins = useDashboardStore((state) => state.walletCoins);
  const globalScore = useDashboardStore((state) => state.globalScore);
  const [clock, setClock] = useState("--:--");
  const [isSimulatorDisplay, setIsSimulatorDisplay] = useState(false);
  const statusLabel =
    connectionStatus === "live"
      ? "ESP32 Live"
      : connectionStatus === "connecting"
        ? "Connecting…"
        : connectionStatus === "error"
          ? "Error"
          : connectionStatus === "disconnected"
            ? "Disconnected"
            : "Standby";

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

  useEffect(() => {
    setIsSimulatorDisplay(new URLSearchParams(window.location.search).get("simulatorDisplay") === "1");
  }, []);

  return (
    <div className={`cockpit-shell cockpit-shell--${mode.accent} ${isSimulatorDisplay ? "cockpit-shell--simulator-display" : ""}`}>
      <header className="vehicle-status">
        <div className="status-left">
          <span className="clock">{clock}</span>
          <div>
            <p className="brand">EcoDrive+</p>
            <p className="mode-subtitle">{mode.subtitle}</p>
          </div>
        </div>

        <div className="header-stats-group" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div className="wallet-pill">
            <Leaf size={14} />
            <span>{walletCoins.toLocaleString()} EcoCoins</span>
          </div>
          <div className="wallet-pill" style={{ background: "rgba(10, 18, 19, 0.8)", borderColor: "rgba(245, 184, 75, 0.4)", color: "#F5B84B" }}>
            <Gauge size={14} />
            <span>Score: {globalScore.toLocaleString()}</span>
          </div>
        </div>

        <div className="status-right">
          <span className={`live-pill live-pill--${connectionStatus}`}>
            <RadioTower size={14} />
            {statusLabel}
          </span>
        </div>
      </header>

      {children}

      <nav className="vehicle-dock" aria-label="Cockpit modes">
        <div className="mode-cluster">
          {modeLinks.map((item) => {
            const Icon = modeIcons[item.id];
            const isActive = item.id === activeMode;
            const href = buildModeHref(item.href, isSimulatorDisplay);

            return (
              <Link
                className={`mode-chip ${isActive ? "mode-chip--active" : ""}`}
                href={href}
                key={item.id}
              >
                <Icon size={16} />
                <span>{item.shortLabel}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function buildModeHref(href: string, isSimulatorDisplay: boolean) {
  if (!isSimulatorDisplay) return href;
  return `${href}${href.includes("?") ? "&" : "?"}simulatorDisplay=1`;
}
