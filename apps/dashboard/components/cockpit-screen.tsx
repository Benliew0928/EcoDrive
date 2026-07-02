"use client";

import {
  BatteryCharging,
  CircleGauge,
  Gauge,
  Leaf,
  RadioTower,
  Route,
  Signal,
  Trees
} from "lucide-react";
import { useState } from "react";
import { CockpitShell } from "./cockpit-shell";
import { cockpitModes, type Metric, type ModeId } from "../data/cockpit-content";
import { eventLabel, hardwareFeedbackForTelemetry } from "../lib/dashboard-data";
import { useDashboardStore } from "../lib/dashboard-store";
import type { ProcessedTelemetry } from "../types/dashboard";
import { EcoRouteMap } from "./eco-route-map";

type CockpitScreenProps = {
  mode: ModeId;
};

export function CockpitScreen({ mode }: CockpitScreenProps) {
  const screen = cockpitModes[mode];
  const telemetry = useDashboardStore((state) => state.telemetry);
  const connectionStatus = useDashboardStore((state) => state.connectionStatus);
  const lastActionMessage = useDashboardStore((state) => state.lastActionMessage);
  const metrics = buildMetrics(mode, telemetry);
  const isLive = connectionStatus === "live" && Boolean(telemetry);

  return (
    <CockpitShell activeMode={mode}>
      <main className={`cockpit-main cockpit-main--${mode}`}>
        <section className="primary-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">{screen.label}</p>
              <h1>{screen.headline}</h1>
            </div>
            <span className={`auto-eco-pill ${isLive ? "auto-eco-pill--live" : ""}`}>
              {isLive ? "Live packet" : "Awaiting simulator"}
            </span>
          </div>
          <ModeVisual mode={mode} telemetry={telemetry} />
        </section>

        <aside className="metrics-panel">
          {metrics.map((metric) => (
            <article className="metric-card" key={metric.label}>
              <p>{metric.label}</p>
              <strong>{metric.value}</strong>
              <span>{metric.trend}</span>
            </article>
          ))}
        </aside>

        <section className="advice-panel">
          <p>Integration status</p>
          <strong>{buildStatusMessage(mode, telemetry, connectionStatus)}</strong>
        </section>

        <section className="secondary-panel">
          <SecondaryContent telemetry={telemetry} />
          <p className="action-message">{lastActionMessage}</p>
        </section>
      </main>
    </CockpitShell>
  );
}

function ModeVisual({ mode, telemetry }: { mode: ModeId; telemetry: ProcessedTelemetry | null }) {
  if (mode === "route") return <RouteSurface telemetry={telemetry} />;
  if (mode === "city") return <FutureModuleSurface title="Eco-City data model" telemetry={telemetry} />;
  if (mode === "rewards") return <RewardsSurface />;
  if (mode === "community") return <FutureModuleSurface title="Community challenges" telemetry={telemetry} />;
  return <DriveSurface telemetry={telemetry} />;
}

function DriveSurface({ telemetry }: { telemetry: ProcessedTelemetry | null }) {
  const feedback = hardwareFeedbackForTelemetry(telemetry);
  const speed = telemetry?.speedKmh ?? null;
  const ecoScore = telemetry?.ecoScore ?? null;

  return (
    <div className="live-surface drive-surface-clean">
      <div className="surface-grid" />
      <div className={`hardware-pod hardware-pod--${feedback.color}`}>
        <RadioTower size={18} />
        <strong>LED {feedback.led}</strong>
        <span>OLED {feedback.oled}</span>
      </div>
      <div className="drive-centerpiece">
        <div className="speed-orb">
          <span>{formatNumber(speed, 0)}</span>
          <small>km/h</small>
        </div>
        <div className="steering-arc">
          <span style={{ transform: `translateX(${Math.max(-44, Math.min(44, (telemetry?.steering ?? 0) * 44))}px)` }} />
        </div>
      </div>
      <div className="packet-panel">
        <PacketRow label="Eco score" value={formatNumber(ecoScore, 0)} />
        <PacketRow label="Event" value={telemetry?.event ? eventLabel(telemetry.event) : "--"} />
        <PacketRow label="Throttle" value={formatPercent(telemetry?.throttle)} />
        <PacketRow label="Brake" value={formatPercent(telemetry?.brake)} />
      </div>
      {!telemetry ? <EmptyState icon={Gauge} title="Waiting for simulator telemetry" /> : null}
    </div>
  );
}

function RouteSurface({ telemetry }: { telemetry: ProcessedTelemetry | null }) {
  // If we have live telemetry with a speed > 0, we might want to show the live stats 
  // instead of the planner, but for the demo, Route mode IS the planner.
  return (
    <div className="live-surface route-surface-clean" style={{ padding: 0 }}>
      <EcoRouteMap onRouteSelect={(route) => console.log("Selected route:", route.id)} />
    </div>
  );
}

function CarbonSurface({ telemetry }: { telemetry: ProcessedTelemetry | null }) {
  return (
    <div className="live-surface carbon-surface-clean">
      <div className="carbon-ring">
        <Trees size={46} />
        <strong>{formatUnit(telemetry?.co2SavedKg, "kg", 2)}</strong>
        <span>CO2 saved</span>
      </div>
      <div className="packet-panel">
        <PacketRow label="Distance" value={formatUnit(telemetry?.distanceKm, "km", 2)} />
        <PacketRow label="Energy" value={formatUnit(telemetry?.energyKwh, "kWh", 2)} />
        <PacketRow label="Eco score" value={formatNumber(telemetry?.ecoScore, 0)} />
      </div>
      {!telemetry ? <EmptyState icon={Leaf} title="Carbon model waiting for drive data" /> : null}
    </div>
  );
}

function RewardsSurface() {
  const walletCoins = useDashboardStore((state) => state.walletCoins);
  const spendCoins = useDashboardStore((state) => state.spendCoins);
  
  const [redeemed, setRedeemed] = useState<string | null>(null);

  const rewards = [
    { id: "coffee", title: "Campus Coffee Discount (RM 5)", cost: 500, icon: "☕" },
    { id: "parking", title: "Reserved EV Parking (1 Day)", cost: 1200, icon: "🅿️" },
    { id: "merch", title: "UTAR Green Merch T-Shirt", cost: 3500, icon: "👕" },
  ];

  const handleRedeem = (id: string, cost: number) => {
    if (spendCoins(cost)) {
      setRedeemed(id);
      setTimeout(() => setRedeemed(null), 3000);
    }
  };

  return (
    <div className="live-surface rewards-surface-clean">
      <div className="rewards-header">
        <h2>EcoDrive+ Marketplace</h2>
        <p>You have <strong>{walletCoins.toLocaleString()}</strong> EcoCoins to spend.</p>
      </div>
      <div className="rewards-grid">
        {rewards.map((reward) => (
          <div key={reward.id} className="reward-card">
            <span className="reward-icon">{reward.icon}</span>
            <h3>{reward.title}</h3>
            <div className="reward-action">
              <span className="reward-cost">{reward.cost} Coins</span>
              <button 
                className="redeem-btn" 
                disabled={walletCoins < reward.cost}
                onClick={() => handleRedeem(reward.id, reward.cost)}
              >
                {redeemed === reward.id ? "Redeemed!" : "Redeem"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FutureModuleSurface({ title, telemetry }: { title: string; telemetry: ProcessedTelemetry | null }) {
  return (
    <div className="live-surface future-surface-clean">
      <div className="module-shell">
        <CircleGauge size={44} />
        <strong>{title}</strong>
        <span>{telemetry ? "Telemetry is available. Module logic can be connected next." : "Blank until real simulator data is mapped."}</span>
      </div>
      <div className="packet-panel">
        <PacketRow label="EcoCoins" value={formatNumber(telemetry?.totalCoins, 0)} />
        <PacketRow label="CO2 saved" value={formatUnit(telemetry?.co2SavedKg, "kg", 2)} />
        <PacketRow label="Event" value={telemetry?.event ? eventLabel(telemetry.event) : "--"} />
      </div>
    </div>
  );
}

function SecondaryContent({ telemetry }: { telemetry: ProcessedTelemetry | null }) {
  const feedback = hardwareFeedbackForTelemetry(telemetry);
  const eventFeed = useDashboardStore((state) => state.eventFeed);

  return (
    <>
      <p>Packet mirror</p>
      <strong>
        LED: {feedback.led} | OLED: {feedback.oled} | Buzzer: {feedback.buzzer}
      </strong>
      <div className="compact-feed">
        {eventFeed.length ? (
          eventFeed.slice(0, 4).map((event) => (
            <p className={`event-row event-row--${event.severity}`} key={event.id}>
              <span>{formatTime(event.timestamp)}</span>
              {event.label}
            </p>
          ))
        ) : (
          <p className="empty-feed">No simulator events received yet.</p>
        )}
      </div>
    </>
  );
}

function PacketRow({ label, value }: { label: string; value: string }) {
  return (
    <p className="packet-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </p>
  );
}

function EmptyState({ icon: Icon, title }: { icon: typeof Gauge; title: string }) {
  return (
    <div className="empty-state">
      <Icon size={28} />
      <strong>{title}</strong>
      <span>Connect the simulator or telemetry bridge to populate this panel.</span>
    </div>
  );
}

function buildMetrics(mode: ModeId, telemetry: ProcessedTelemetry | null): Metric[] {
  if (mode === "route") {
    return [
      { label: "Route", value: telemetry?.routeChoice ?? "--", trend: "from simulator packet" },
      { label: "Distance", value: formatUnit(telemetry?.distanceKm, "km", 2), trend: "current trip" },
      { label: "Steering", value: formatSigned(telemetry?.steering), trend: "normalized input" },
      { label: "Speed", value: formatUnit(telemetry?.speedKmh, "km/h", 0), trend: "live packet" }
    ];
  }


  if (mode === "city" || mode === "rewards" || mode === "community") {
    return [
      { label: "EcoCoins", value: formatNumber(telemetry?.totalCoins, 0), trend: "from real score logic" },
      { label: "Coins earned", value: formatNumber(telemetry?.coinsEarned, 0), trend: "current packet" },
      { label: "CO2 saved", value: formatUnit(telemetry?.co2SavedKg, "kg", 2), trend: "current drive" },
      { label: "Eco score", value: formatNumber(telemetry?.ecoScore, 0), trend: "current drive" }
    ];
  }

  return [
    { label: "Speed", value: formatUnit(telemetry?.speedKmh, "km/h", 0), trend: "live packet" },
    { label: "Eco score", value: formatNumber(telemetry?.ecoScore, 0), trend: telemetry?.event ? telemetry.event.replaceAll("_", " ") : "waiting" },
    { label: "CO2 saved", value: formatUnit(telemetry?.co2SavedKg, "kg", 2), trend: "current drive" },
    { label: "EcoCoins", value: formatNumber(telemetry?.totalCoins, 0), trend: "from real score logic" }
  ];
}

function buildStatusMessage(
  mode: ModeId,
  telemetry: ProcessedTelemetry | null,
  connectionStatus: ReturnType<typeof useDashboardStore.getState>["connectionStatus"]
) {
  if (telemetry) return "Rendering only values received from the simulator or telemetry bridge.";
  if (connectionStatus === "connecting") return "Trying to connect to the configured telemetry WebSocket.";
  if (connectionStatus === "error") return "The telemetry WebSocket reported an error. The dashboard is staying blank instead of using invented values.";
  if (connectionStatus === "disconnected") return "Telemetry disconnected. Waiting for the next real simulator packet.";
  if (mode === "drive") return "No local data loop is running. This cockpit will populate when simulator telemetry is connected.";
  return "This page is intentionally blank until its real simulator data contract is wired.";
}

function formatNumber(value: number | undefined | null, digits: number) {
  if (value == null || Number.isNaN(value)) return "--";
  return value.toFixed(digits);
}

function formatUnit(value: number | undefined | null, unit: string, digits: number) {
  const number = formatNumber(value, digits);
  return number === "--" ? "--" : `${number} ${unit}`;
}

function formatPercent(value: number | undefined | null) {
  if (value == null || Number.isNaN(value)) return "--";
  return `${Math.round(value * 100)}%`;
}

function formatPercentValue(value: number | undefined | null) {
  if (value == null || Number.isNaN(value)) return "--";
  return `${Math.round(value)}%`;
}

function formatSigned(value: number | undefined | null) {
  if (value == null || Number.isNaN(value)) return "--";
  return value > 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
}

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}
