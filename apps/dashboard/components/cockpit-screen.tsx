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
import { CockpitShell } from "./cockpit-shell";
import { cockpitModes, type Metric, type ModeId } from "../data/cockpit-content";
import { eventLabel, hardwareFeedbackForTelemetry } from "../lib/dashboard-data";
import { useDashboardStore } from "../lib/dashboard-store";
import type { ProcessedTelemetry } from "../types/dashboard";

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
  if (mode === "energy") return <EnergySurface telemetry={telemetry} />;
  if (mode === "carbonTwin") return <CarbonSurface telemetry={telemetry} />;
  if (mode === "city") return <FutureModuleSurface title="Eco-City data model" telemetry={telemetry} />;
  if (mode === "rewards") return <FutureModuleSurface title="Rewards wallet" telemetry={telemetry} />;
  if (mode === "community") return <FutureModuleSurface title="Community challenges" telemetry={telemetry} />;
  if (mode === "fleet") return <FleetSurface telemetry={telemetry} />;
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
  return (
    <div className="live-surface route-surface-clean">
      <div className="surface-grid" />
      <div className="route-spine">
        <span />
        <i />
        <b />
      </div>
      <div className="packet-panel packet-panel--wide">
        <PacketRow label="Route choice" value={telemetry?.routeChoice ?? "--"} />
        <PacketRow label="Distance" value={formatUnit(telemetry?.distanceKm, "km", 2)} />
        <PacketRow label="Steering" value={formatSigned(telemetry?.steering)} />
        <PacketRow label="Speed" value={formatUnit(telemetry?.speedKmh, "km/h", 0)} />
      </div>
      {!telemetry ? <EmptyState icon={Route} title="Route feed not connected" /> : null}
    </div>
  );
}

function EnergySurface({ telemetry }: { telemetry: ProcessedTelemetry | null }) {
  return (
    <div className="live-surface energy-surface-clean">
      <div className="battery-outline">
        <span>{formatPercentValue(telemetry?.batteryPercent)}</span>
      </div>
      <div className="energy-readouts">
        <PacketRow label="Range" value={formatUnit(telemetry?.rangeKm, "km", 0)} />
        <PacketRow label="Regen" value={formatUnit(telemetry?.regenKw, "kW", 0)} />
        <PacketRow label="Motor" value={formatUnit(telemetry?.motorKw, "kW", 0)} />
        <PacketRow label="Energy" value={formatUnit(telemetry?.energyKwh, "kWh", 2)} />
      </div>
      {!telemetry ? <EmptyState icon={BatteryCharging} title="Energy packets pending" /> : null}
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

function FleetSurface({ telemetry }: { telemetry: ProcessedTelemetry | null }) {
  return (
    <div className="live-surface fleet-surface-clean">
      <div className="packet-panel packet-panel--wide">
        <PacketRow label="Device" value={telemetry?.deviceId ?? "--"} />
        <PacketRow label="Last event" value={telemetry?.event ? eventLabel(telemetry.event) : "--"} />
        <PacketRow label="LED" value={telemetry?.ledState ?? "--"} />
        <PacketRow label="Hard brakes" value={formatNumber(telemetry?.hardBrakes, 0)} />
      </div>
      {!telemetry ? <EmptyState icon={Signal} title="No fleet unit connected" /> : null}
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

  if (mode === "energy") {
    return [
      { label: "Battery", value: formatPercentValue(telemetry?.batteryPercent), trend: "from vehicle state" },
      { label: "Range", value: formatUnit(telemetry?.rangeKm, "km", 0), trend: "estimated" },
      { label: "Regen", value: formatUnit(telemetry?.regenKw, "kW", 0), trend: "live draw" },
      { label: "Motor", value: formatUnit(telemetry?.motorKw, "kW", 0), trend: "live draw" }
    ];
  }

  if (mode === "carbonTwin") {
    return [
      { label: "CO2 saved", value: formatUnit(telemetry?.co2SavedKg, "kg", 2), trend: "from carbon model" },
      { label: "Energy", value: formatUnit(telemetry?.energyKwh, "kWh", 2), trend: "current trip" },
      { label: "Distance", value: formatUnit(telemetry?.distanceKm, "km", 2), trend: "current trip" },
      { label: "Eco score", value: formatNumber(telemetry?.ecoScore, 0), trend: "live packet" }
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

  if (mode === "fleet") {
    return [
      { label: "Device", value: telemetry?.deviceId ?? "--", trend: "telemetry source" },
      { label: "Status", value: telemetry ? "Live" : "--", trend: "connection state" },
      { label: "Hard brakes", value: formatNumber(telemetry?.hardBrakes, 0), trend: "safety signal" },
      { label: "Last event", value: telemetry?.event ? telemetry.event.replaceAll("_", " ") : "--", trend: "live packet" }
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
