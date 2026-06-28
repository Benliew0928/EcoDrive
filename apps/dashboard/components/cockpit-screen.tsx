import { CockpitShell } from "./cockpit-shell";
import { cockpitModes, type ModeId } from "../data/cockpit-content";

type CockpitScreenProps = {
  mode: ModeId;
};

export function CockpitScreen({ mode }: CockpitScreenProps) {
  const screen = cockpitModes[mode];

  return (
    <CockpitShell activeMode={mode}>
      <main className={`cockpit-main cockpit-main--${mode}`}>
        <section className="primary-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">{screen.label}</p>
              <h1>{screen.headline}</h1>
            </div>
            <span className="auto-eco-pill">Auto Eco active</span>
          </div>
          <ModeVisual mode={mode} />
        </section>

        <aside className="metrics-panel">
          {screen.metrics.map((metric) => (
            <article className="metric-card" key={metric.label}>
              <p>{metric.label}</p>
              <strong>{metric.value}</strong>
              <span>{metric.trend}</span>
            </article>
          ))}
        </aside>

        <section className="advice-panel">
          <p>Eco co-pilot recommendation</p>
          <strong>{screen.advice}</strong>
        </section>

        <section className="secondary-panel">
          <SecondaryContent mode={mode} />
        </section>
      </main>
    </CockpitShell>
  );
}

function ModeVisual({ mode }: { mode: ModeId }) {
  if (mode === "city") {
    return <CityGrid />;
  }

  if (mode === "energy") {
    return <EnergyFlow />;
  }

  if (mode === "carbonTwin") {
    return <CarbonForest />;
  }

  if (mode === "rewards") {
    return <RewardsSurface />;
  }

  if (mode === "community") {
    return <CommunitySurface />;
  }

  if (mode === "fleet") {
    return <FleetSurface />;
  }

  return <RouteSurface routeMode={mode === "route" ? "compare" : "drive"} />;
}

function RouteSurface({ routeMode }: { routeMode: "drive" | "compare" }) {
  return (
    <div className="route-surface">
      <div className="map-grid" />
      <div className="route-line route-line--eco" />
      <div className="route-line route-line--fast" />
      <span className="vehicle-marker" />
      <span className="route-tag">{routeMode === "compare" ? "+50 EcoCoins" : "Smooth zone"}</span>
      <div className="vehicle-pod">
        <span />
        <span />
        <span />
      </div>
      {routeMode === "drive" ? <EcoGauge /> : <RouteComparison />}
    </div>
  );
}

function EcoGauge() {
  return (
    <div className="eco-gauge">
      <div className="gauge-ring">
        <strong>84</strong>
        <span>Eco score</span>
      </div>
      <p>MPU6050 signal stream</p>
      <div className="bars">
        {Array.from({ length: 18 }).map((_, index) => (
          <span key={index} style={{ height: `${24 + ((index * 13) % 56)}px` }} />
        ))}
      </div>
    </div>
  );
}

function RouteComparison() {
  return (
    <div className="route-comparison">
      <span className="segment segment--active">Eco</span>
      <span className="segment">Fast</span>
      <span className="segment">Balanced</span>
      <p>Eco route keeps speed smooth and avoids stop-start clusters.</p>
    </div>
  );
}

function EnergyFlow() {
  return (
    <div className="energy-flow">
      <div className="battery-module">
        <span>82%</span>
      </div>
      <div className="flow-line flow-line--regen">Regen +18 kW</div>
      <div className="flow-line flow-line--motor">Motor 42 kW</div>
      <div className="charger-card">UTAR Solar Hub | 2.3 km | RM 4.80 projected</div>
    </div>
  );
}

function CarbonForest() {
  return (
    <div className="forest-surface">
      {Array.from({ length: 42 }).map((_, index) => (
        <span className={index % 7 === 0 ? "tree tree--rare" : "tree"} key={index} />
      ))}
      <div className="forest-score">82.4 kg CO2 captured story</div>
    </div>
  );
}

function CityGrid() {
  const buildings = ["P", "S", "E", "R", "W", "C"];

  return (
    <div className="city-builder">
      <div className="city-grid">
        {Array.from({ length: 64 }).map((_, index) => (
          <span className={index % 9 === 0 ? "city-cell city-cell--active" : "city-cell"} key={index}>
            {index % 9 === 0 ? buildings[index % buildings.length] : ""}
          </span>
        ))}
      </div>
      <div className="building-palette">
        {["Park", "Solar", "EV hub", "Recycle", "Wind", "School"].map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    </div>
  );
}

function RewardsSurface() {
  return (
    <div className="rewards-surface">
      {["Campus coffee", "Parking discount", "EV charging credit"].map((reward, index) => (
        <article key={reward}>
          <strong>{reward}</strong>
          <span>{index === 0 ? "100" : index === 1 ? "180" : "320"} Yield Coins</span>
        </article>
      ))}
      <div className="qr-preview">QR</div>
    </div>
  );
}

function CommunitySurface() {
  return (
    <div className="community-surface">
      <div className="challenge-progress">
        <strong>386 / 500 kg CO2</strong>
        <span />
      </div>
      {["Ben", "Aina", "Wei", "Kumar", "Team FEGT"].map((name, index) => (
        <p key={name}>
          <span>{index + 1}</span>
          {name}
          <strong>{91 - index * 3}</strong>
        </p>
      ))}
    </div>
  );
}

function FleetSurface() {
  return (
    <div className="fleet-surface">
      {["Shuttle 01", "Shuttle 02", "Shuttle 03", "Shuttle 04", "Demo Unit"].map((vehicle, index) => (
        <p key={vehicle}>
          <span>{vehicle}</span>
          <strong>{index === 2 ? "vibration" : index === 1 ? "hard brake" : "normal"}</strong>
        </p>
      ))}
      <div className="risk-map">Gate Road braking cluster</div>
    </div>
  );
}

function SecondaryContent({ mode }: { mode: ModeId }) {
  if (mode === "fleet") {
    return (
      <>
        <p>Actionable fleet insight</p>
        <strong>Vehicle 03 shows unusual vibration. Inspect tyre pressure or hardware mount.</strong>
      </>
    );
  }

  if (mode === "city") {
    return (
      <>
        <p>Active adjacency bonus</p>
        <strong>Solar Farm + EV Charger gives +25% Yield Coin income.</strong>
      </>
    );
  }

  if (mode === "rewards") {
    return (
      <>
        <p>Marketplace status</p>
        <strong>Campus coffee reward is ready to redeem with a simulated QR code.</strong>
      </>
    );
  }

  return (
    <>
      <p>Hardware feedback mirror</p>
      <strong>LED: green pulse | OLED: Excellent driving | Buzzer: idle</strong>
    </>
  );
}

