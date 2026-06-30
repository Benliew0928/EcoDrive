"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Pause, Play, QrCode, RadioTower, Zap } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { CockpitShell } from "./cockpit-shell";
import { cockpitModes, type ModeId } from "../data/cockpit-content";
import { cityAssets, feedbackForScore, routeOptions } from "../lib/dashboard-data";
import { activeRouteLabel, calculateDailyYield, useDashboardStore } from "../lib/dashboard-store";
import type { CityAsset, ProcessedTelemetry, RouteId } from "../types/dashboard";

const RouteMap = dynamic(() => import("./route-map").then((module) => module.RouteMap), {
  ssr: false,
  loading: () => <div className="route-map-loading">Loading UTAR route map...</div>
});

type CockpitScreenProps = {
  mode: ModeId;
};

export function CockpitScreen({ mode }: CockpitScreenProps) {
  const screen = cockpitModes[mode];
  const telemetry = useDashboardStore((state) => state.telemetry);
  const wallet = useDashboardStore((state) => state.wallet);
  const cityCells = useDashboardStore((state) => state.cityCells);
  const activeRouteId = useDashboardStore((state) => state.activeRouteId);
  const lastActionMessage = useDashboardStore((state) => state.lastActionMessage);
  const metrics = buildMetrics(mode, telemetry, wallet, cityCells, activeRouteId);

  return (
    <CockpitShell activeMode={mode}>
      <main className={`cockpit-main cockpit-main--${mode}`}>
        <section className="primary-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">{screen.label}</p>
              <h1>{screen.headline}</h1>
            </div>
            <span className="auto-eco-pill">{activeRouteId ? activeRouteLabel(activeRouteId) : "Auto Eco ready"}</span>
          </div>
          <ModeVisual mode={mode} />
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
          <p>Eco co-pilot recommendation</p>
          <strong>{buildAdvice(mode, telemetry, activeRouteId)}</strong>
        </section>

        <section className="secondary-panel">
          <SecondaryContent mode={mode} />
          <p className="action-message">{lastActionMessage}</p>
        </section>
      </main>
    </CockpitShell>
  );
}

function ModeVisual({ mode }: { mode: ModeId }) {
  if (mode === "route") return <RoutePlanner />;
  if (mode === "drive") return <DriveDashboard />;
  if (mode === "city") return <CityGrid />;
  if (mode === "energy") return <EnergyFlow />;
  if (mode === "carbonTwin") return <CarbonForest />;
  if (mode === "rewards") return <RewardsSurface />;
  if (mode === "community") return <CommunitySurface />;
  if (mode === "fleet") return <FleetSurface />;
  return <DriveDashboard />;
}

function RoutePlanner() {
  const router = useRouter();
  const activeRouteId = useDashboardStore((state) => state.activeRouteId);
  const selectRoute = useDashboardStore((state) => state.selectRoute);
  const selectRouteAndStart = useDashboardStore((state) => state.selectRouteAndStart);
  const selectedRouteId = activeRouteId ?? "eco";

  const startRoute = () => {
    selectRouteAndStart(selectedRouteId);
    router.push("/");
  };

  return (
    <div className="route-planner">
      <div className="route-form">
        <label>
          <span>Origin</span>
          <input value="East Gate" readOnly />
        </label>
        <label>
          <span>Destination</span>
          <input value="Library / Heritage Hall" readOnly />
        </label>
        <button className="primary-action" onClick={startRoute} type="button">
          <Play size={17} />
          Select Eco Route & Start Driving
        </button>
      </div>

      <div className="route-map-card">
        <RouteMap activeRouteId={selectedRouteId} onSelectRoute={selectRoute} />
      </div>

      <div className="route-options">
        {routeOptions.map((option) => (
          <button
            className={`route-option ${selectedRouteId === option.id ? "route-option--active" : ""}`}
            key={option.id}
            onClick={() => selectRoute(option.id)}
            style={{ "--route-color": option.color } as React.CSSProperties}
            type="button"
          >
            <span>{option.badge}</span>
            <strong>{option.label}</strong>
            <small>{option.description}</small>
            <em>
              {option.etaMin} min | {option.energyKwh} kWh | +{option.coinsBonus} coins
            </em>
          </button>
        ))}
      </div>
    </div>
  );
}

function DriveDashboard() {
  const telemetry = useDashboardStore((state) => state.telemetry);
  const eventFeed = useDashboardStore((state) => state.eventFeed);
  const demoRunning = useDashboardStore((state) => state.demoRunning);
  const startDemo = useDashboardStore((state) => state.startDemo);
  const pauseDemo = useDashboardStore((state) => state.pauseDemo);
  const injectEvent = useDashboardStore((state) => state.injectEvent);
  const feedback = feedbackForScore(telemetry.ecoScore, telemetry.event);
  const gaugeStyle = { "--score": `${Math.round(telemetry.ecoScore)}%` } as React.CSSProperties;

  return (
    <div className="route-surface drive-surface">
      <div className="map-grid" />
      <div className="route-line route-line--eco" />
      <div className="route-line route-line--fast" />
      <span className="vehicle-marker" />
      <span className="route-tag">{activeRouteLabel(useDashboardStore.getState().activeRouteId)}</span>
      <div className={`hardware-pod hardware-pod--${feedback.color}`}>
        <RadioTower size={18} />
        <strong>{feedback.led}</strong>
        <span>{feedback.oled}</span>
      </div>

      <div className="eco-gauge">
        <div className="gauge-ring gauge-ring--dynamic" style={gaugeStyle}>
          <strong>{Math.round(telemetry.ecoScore)}</strong>
          <span>Eco score</span>
        </div>
        <p>ESP32 packet mirror</p>
        <div className="bars">
          {Array.from({ length: 18 }).map((_, index) => (
            <span key={index} style={{ height: `${24 + ((index * 13 + Math.round(telemetry.speedKmh)) % 56)}px` }} />
          ))}
        </div>
      </div>

      <div className="demo-controls">
        <button onClick={demoRunning ? pauseDemo : startDemo} type="button">
          {demoRunning ? <Pause size={16} /> : <Play size={16} />}
          {demoRunning ? "Pause" : "Start"}
        </button>
        <button onClick={() => injectEvent("smooth_streak")} type="button">
          <Zap size={16} />
          Smooth
        </button>
        <button className="danger-action" onClick={() => injectEvent("harsh_brake")} type="button">
          <AlertTriangle size={16} />
          Harsh brake
        </button>
      </div>

      <div className="event-feed">
        {eventFeed.slice(0, 5).map((event) => (
          <p className={`event-row event-row--${event.severity}`} key={event.id}>
            <span>{formatTime(event.timestamp)}</span>
            {event.label}
          </p>
        ))}
      </div>
    </div>
  );
}

function EnergyFlow() {
  const telemetry = useDashboardStore((state) => state.telemetry);

  return (
    <div className="energy-flow">
      <div className="battery-module">
        <span>{Math.round(telemetry.batteryPercent)}%</span>
      </div>
      <div className="flow-line flow-line--regen">Regen +{Math.round(telemetry.regenKw)} kW</div>
      <div className="flow-line flow-line--motor">Motor {Math.round(telemetry.motorKw)} kW</div>
      <div className="charger-card">UTAR Solar Hub | 2.3 km | {Math.round(telemetry.rangeKm)} km projected range</div>
    </div>
  );
}

function CarbonForest() {
  const telemetry = useDashboardStore((state) => state.telemetry);
  const treeCount = Math.min(64, Math.max(18, Math.round(telemetry.co2SavedKg * 9)));

  return (
    <div className="forest-surface">
      {Array.from({ length: treeCount }).map((_, index) => (
        <span className={index % 7 === 0 ? "tree tree--rare" : "tree"} key={index} />
      ))}
      <div className="forest-score">{telemetry.co2SavedKg.toFixed(2)} kg CO2 saved story</div>
    </div>
  );
}

function CityGrid() {
  const wallet = useDashboardStore((state) => state.wallet);
  const cityCells = useDashboardStore((state) => state.cityCells);
  const selectedCityAssetId = useDashboardStore((state) => state.selectedCityAssetId);
  const selectCityAsset = useDashboardStore((state) => state.selectCityAsset);
  const placeCityAsset = useDashboardStore((state) => state.placeCityAsset);
  const yieldPerDay = calculateDailyYield(cityCells);

  return (
    <div className="city-builder">
      <div className="city-grid" aria-label="Eco-City grid">
        {cityCells.map((cell, index) => {
          const asset = cityAssets.find((candidate) => candidate.id === cell.assetId);

          return (
            <button
              className={`city-cell ${asset ? "city-cell--active" : ""}`}
              key={index}
              onClick={() => placeCityAsset(index)}
              style={asset ? ({ "--asset-color": asset.color } as React.CSSProperties) : undefined}
              type="button"
            >
              {asset ? assetInitial(asset) : ""}
            </button>
          );
        })}
      </div>
      <div className="building-palette">
        <div className="city-wallet">
          <strong>{wallet.rawCoins}</strong>
          <span>Raw coins</span>
          <strong>{yieldPerDay}/day</strong>
          <span>Yield projection</span>
        </div>
        {cityAssets.map((asset) => (
          <button
            className={`asset-chip ${selectedCityAssetId === asset.id ? "asset-chip--active" : ""}`}
            key={asset.id}
            onClick={() => selectCityAsset(asset.id)}
            style={{ "--asset-color": asset.color } as React.CSSProperties}
            type="button"
          >
            <span>{asset.label}</span>
            <small>{asset.cost} coins | +{asset.yieldPerDay}/day</small>
          </button>
        ))}
      </div>
    </div>
  );
}

function RewardsSurface() {
  const rewards = useDashboardStore((state) => state.rewards);
  const wallet = useDashboardStore((state) => state.wallet);
  const activeQrToken = useDashboardStore((state) => state.activeQrToken);
  const redeemReward = useDashboardStore((state) => state.redeemReward);

  return (
    <div className="rewards-surface">
      <div className="reward-balance">
        <strong>{wallet.yieldCoins}</strong>
        <span>Yield Coins available</span>
      </div>
      {rewards.map((reward) => (
        <article key={reward.id}>
          <div>
            <strong>{reward.title}</strong>
            <span>{reward.description}</span>
          </div>
          <button disabled={wallet.yieldCoins < reward.cost} onClick={() => redeemReward(reward.id)} type="button">
            <QrCode size={15} />
            {reward.cost}
          </button>
        </article>
      ))}
      <div className="qr-preview">
        {activeQrToken ? <QRCodeSVG bgColor="transparent" fgColor="#06100f" size={132} value={activeQrToken} /> : "QR"}
      </div>
    </div>
  );
}

function CommunitySurface() {
  const telemetry = useDashboardStore((state) => state.telemetry);
  const challenges = useDashboardStore((state) => state.challenges);
  const joinChallenge = useDashboardStore((state) => state.joinChallenge);
  const leaderboard = [
    ["Ben", Math.round(Math.max(telemetry.ecoScore, 91))],
    ["Aina", 88],
    ["Wei", 85],
    ["Kumar", 82],
    ["Team FEGT", 79]
  ];

  return (
    <div className="community-surface">
      {challenges.map((challenge) => (
        <button className="challenge-card" key={challenge.id} onClick={() => joinChallenge(challenge.id)} type="button">
          <strong>{challenge.title}</strong>
          <span>{Math.round((challenge.progressKg / challenge.targetKg) * 100)}% complete</span>
          <em>{challenge.joined ? "Joined" : `Join | +${challenge.rewardCoins} coins`}</em>
        </button>
      ))}
      <div className="leaderboard-list">
        {leaderboard.map(([name, score], index) => (
          <p key={name}>
            <span>{index + 1}</span>
            {name}
            <strong>{score}</strong>
          </p>
        ))}
      </div>
    </div>
  );
}

function FleetSurface() {
  const fleetVehicles = useDashboardStore((state) => state.fleetVehicles);

  return (
    <div className="fleet-surface">
      {fleetVehicles.map((vehicle) => (
        <p className={`fleet-row fleet-row--${vehicle.status}`} key={vehicle.id}>
          <span>{vehicle.name}</span>
          <strong>{vehicle.status} / score {vehicle.ecoScore}</strong>
          <em>{vehicle.alert}</em>
        </p>
      ))}
      <div className="risk-map">Gate Road braking cluster | Demo unit telemetry mirrors current dashboard packet</div>
    </div>
  );
}

function SecondaryContent({ mode }: { mode: ModeId }) {
  const telemetry = useDashboardStore((state) => state.telemetry);
  const activeRouteId = useDashboardStore((state) => state.activeRouteId);
  const wallet = useDashboardStore((state) => state.wallet);
  const cityCells = useDashboardStore((state) => state.cityCells);
  const feedback = feedbackForScore(telemetry.ecoScore, telemetry.event);

  if (mode === "route") {
    return (
      <>
        <p>Selected route</p>
        <strong>{activeRouteLabel(activeRouteId)} is ready to launch the live drive dashboard.</strong>
      </>
    );
  }

  if (mode === "city") {
    return (
      <>
        <p>Active adjacency bonus</p>
        <strong>City yield is {calculateDailyYield(cityCells)}/day. Solar beside EV hub gives +25% Yield Coin income.</strong>
      </>
    );
  }

  if (mode === "rewards") {
    return (
      <>
        <p>Marketplace status</p>
        <strong>{wallet.yieldCoins} Yield Coins available. Redeemed rewards generate a simulated QR code.</strong>
      </>
    );
  }

  if (mode === "fleet") {
    return (
      <>
        <p>Actionable fleet insight</p>
        <strong>Demo Unit mirrors the current telemetry stream; harsh events become fleet alerts instantly.</strong>
      </>
    );
  }

  return (
    <>
      <p>Hardware feedback mirror</p>
      <strong>
        LED: {feedback.led} | OLED: {feedback.oled} | Buzzer: {feedback.buzzer}
      </strong>
    </>
  );
}

function buildMetrics(
  mode: ModeId,
  telemetry: ProcessedTelemetry,
  wallet: { rawCoins: number; yieldCoins: number },
  cityCells: ReturnType<typeof useDashboardStore.getState>["cityCells"],
  activeRouteId: RouteId | null
) {
  const activeRoute = routeOptions.find((route) => route.id === activeRouteId) ?? routeOptions[0];
  const yieldPerDay = calculateDailyYield(cityCells);
  const treeCount = Math.round(Math.max(18, telemetry.co2SavedKg * 9));

  if (mode === "route") {
    return [
      { label: "Eco route", value: `${routeOptions[0].energyKwh} kWh`, trend: `+${routeOptions[0].coinsBonus} EcoCoins` },
      { label: "Fast route", value: `${routeOptions[1].energyKwh} kWh`, trend: `${routeOptions[1].etaMin} min ETA` },
      { label: "CO2 saved", value: `${(routeOptions[1].co2Kg - routeOptions[0].co2Kg).toFixed(2)} kg`, trend: "per trip" },
      { label: "Selected", value: activeRoute.badge, trend: activeRoute.label }
    ];
  }

  if (mode === "energy") {
    return [
      { label: "Battery", value: `${Math.round(telemetry.batteryPercent)}%`, trend: `${Math.round(telemetry.rangeKm)} km range` },
      { label: "Regen", value: `+${Math.round(telemetry.regenKw)} kW`, trend: "active window" },
      { label: "Motor", value: `${Math.round(telemetry.motorKw)} kW`, trend: "live draw" },
      { label: "Energy", value: `${telemetry.energyKwh.toFixed(2)}`, trend: "kWh this drive" }
    ];
  }

  if (mode === "carbonTwin") {
    return [
      { label: "Trees", value: `${treeCount}`, trend: "+ live growth" },
      { label: "Saplings", value: `${Math.max(3, Math.round(treeCount / 5))}`, trend: "growing" },
      { label: "CO2 forest", value: `${telemetry.co2SavedKg.toFixed(1)} kg`, trend: "lifetime" },
      { label: "Biome", value: "4", trend: "unlocked" }
    ];
  }

  if (mode === "city") {
    return [
      { label: "Raw coins", value: `${wallet.rawCoins}`, trend: "for building" },
      { label: "Yield", value: `${yieldPerDay}/day`, trend: "for rewards" },
      { label: "Assets", value: `${cityCells.filter((cell) => cell.assetId).length}`, trend: "placed" },
      { label: "City stage", value: yieldPerDay > 60 ? "Green" : "Growing", trend: "level 4" }
    ];
  }

  if (mode === "rewards") {
    return [
      { label: "Yield balance", value: `${wallet.yieldCoins}`, trend: `+${yieldPerDay}/day` },
      { label: "Coffee QR", value: "100", trend: wallet.yieldCoins >= 100 ? "ready" : "locked" },
      { label: "Charging credit", value: "320", trend: wallet.yieldCoins >= 320 ? "ready" : "locked" },
      { label: "History", value: `${useDashboardStore.getState().redemptionHistory.length}`, trend: "redeemed" }
    ];
  }

  if (mode === "community") {
    return [
      { label: "Progress", value: `${Math.round(386 + telemetry.co2SavedKg)} kg`, trend: "of 500 kg CO2" },
      { label: "Rank", value: "#3", trend: "weekly driver" },
      { label: "Avg score", value: `${Math.round(telemetry.ecoScore)}`, trend: "team smoothness" },
      { label: "Challenges", value: "3", trend: "active" }
    ];
  }

  if (mode === "fleet") {
    return [
      { label: "Active EVs", value: "6", trend: "campus fleet" },
      { label: "Avg score", value: `${Math.round((78 + telemetry.ecoScore) / 2)}`, trend: "demo adjusted" },
      { label: "CO2 month", value: "2.3 t", trend: "saved" },
      { label: "Alerts", value: `${telemetry.hardBrakes + 3}`, trend: "needs review" }
    ];
  }

  return [
    { label: "Eco score", value: `${Math.round(telemetry.ecoScore)}`, trend: telemetry.event.replaceAll("_", " ") },
    { label: "CO2 saved", value: `${telemetry.co2SavedKg.toFixed(2)} kg`, trend: "vs petrol baseline" },
    { label: "Range", value: `${Math.round(telemetry.rangeKm)} km`, trend: `${Math.round(telemetry.batteryPercent)}% battery` },
    { label: "EcoCoins", value: `${wallet.rawCoins}`, trend: `+${telemetry.coinsEarned} this packet` }
  ];
}

function buildAdvice(mode: ModeId, telemetry: ProcessedTelemetry, activeRouteId: RouteId | null) {
  if (telemetry.event === "harsh_brake") return "Brake earlier and hold a smoother deceleration curve. ESP32 would flash red and beep twice.";
  if (telemetry.event === "aggressive_acceleration") return "Ease acceleration. The motor draw spike is reducing the eco-score.";
  if (mode === "route") return "Choose the Lake 18 Eco Route for a slightly longer drive with lower energy use and higher EcoCoins.";
  if (mode === "city") return "Place Solar beside EV hub or Wind to increase Yield Coin income before redeeming rewards.";
  if (mode === "rewards") return "Redeem low-cost rewards first to prove the value loop during the pitch.";
  if (mode === "fleet") return "Watch the Demo Unit row: injected harsh events become command-centre alerts instantly.";
  if (activeRouteId === "eco") return "Hold current throttle. Regen window is optimal and the route is trending below target energy.";
  return "Select the eco route before the live drive to maximize scoring clarity for judges.";
}

function assetInitial(asset: CityAsset) {
  return asset.label
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2);
}

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}
