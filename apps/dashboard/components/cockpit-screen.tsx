"use client";

import { useState } from "react";
import { Gauge, RadioTower } from "lucide-react";
import { CockpitShell } from "./cockpit-shell";
import { cockpitModes, type ModeId } from "../data/cockpit-content";
import { eventLabel, hardwareFeedbackForTelemetry } from "../lib/dashboard-data";
import { useDashboardStore } from "../lib/dashboard-store";
import type { ProcessedTelemetry } from "../types/dashboard";
import { EcoRouteMap } from "./eco-route-map";
import { CitySurface } from "./city/city-surface";

type CockpitScreenProps = {
  mode: ModeId;
};

export function CockpitScreen({ mode }: CockpitScreenProps) {
  const screen = cockpitModes[mode];
  const telemetry = useDashboardStore((state) => state.telemetry);
  const connectionStatus = useDashboardStore((state) => state.connectionStatus);
  const isLive = connectionStatus === "live" && Boolean(telemetry);
  const packetLabel = mode === "city" ? "Builder active" : isLive ? "Live packet" : "Awaiting simulator";

  return (
    <CockpitShell activeMode={mode}>
      <main className={`cockpit-main cockpit-main--${mode}`}>
        <section className="primary-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">{screen.label}</p>
              <h1>{screen.headline}</h1>
            </div>
            <span className={`auto-eco-pill ${isLive || mode === "city" ? "auto-eco-pill--live" : ""}`}>
              {packetLabel}
            </span>
          </div>
          <ModeVisual mode={mode} telemetry={telemetry} />
        </section>
      </main>
    </CockpitShell>
  );
}

function ModeVisual({ mode, telemetry }: { mode: ModeId; telemetry: ProcessedTelemetry | null }) {
  if (mode === "route") return <RouteSurface telemetry={telemetry} />;
  if (mode === "city") return <CitySurface />;
  if (mode === "rewards") return <RewardsSurface />;
  if (mode === "community") return <CommunitySurface />;
  return <DriveSurface telemetry={telemetry} />;
}

function CommunitySurface() {
  const globalScore = useDashboardStore((state) => state.globalScore);
  
  // Fake players from UTAR
  const players = [
    { name: "You", score: globalScore, isReal: true },
    { name: "Ali (FICT)", score: 28500, isReal: false },
    { name: "Mei Ling (FAS)", score: 26120, isReal: false },
    { name: "John Doe (FBF)", score: 23400, isReal: false },
    { name: "Ahmad (FEGT)", score: 21950, isReal: false },
    { name: "Siti (FSc)", score: 18200, isReal: false },
  ];

  // Sort by score descending
  players.sort((a, b) => b.score - a.score);

  return (
    <div className="live-surface community-surface">
      <div className="leaderboard-header">
        <h2>🏆 UTAR Campus Leaderboard</h2>
        <p>Monthly Top Eco-Drivers</p>
      </div>
      <div className="leaderboard-list">
        {players.map((player, index) => (
          <div key={player.name} className={`leaderboard-row ${player.isReal ? "leaderboard-row--real" : ""}`}>
            <span className="rank">#{index + 1}</span>
            <span className="player-name">{player.name}</span>
            <span className="player-score">{player.score.toLocaleString()} pts</span>
          </div>
        ))}
      </div>
    </div>
  );
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
    <div className="live-surface route-surface-clean" style={{ padding: 0 }}>
      <EcoRouteMap onRouteSelect={(route) => console.log("Selected route:", route.id)} />
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

function formatNumber(value: number | undefined | null, digits: number) {
  if (value == null || Number.isNaN(value)) return "--";
  return value.toFixed(digits);
}

function formatPercent(value: number | undefined | null) {
  if (value == null || Number.isNaN(value)) return "--";
  return `${Math.round(value * 100)}%`;
}
