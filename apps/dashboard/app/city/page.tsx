"use client";

import {
  type CSSProperties,
  type DragEvent,
  type MouseEvent,
  type PointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { CockpitShell } from "../../components/cockpit-shell";
import {
  cityBuildingMap,
  cityBuildings,
  cityStages,
  type CityBuildingId,
  type PlacedInfrastructure
} from "../../data/city-buildings";
import { useCityStore } from "../../lib/city-store";
import { useDashboardStore } from "../../lib/dashboard-store";

type PlacementMessage = { kind: "success" | "error"; text: string };
type TerrainPoint = { x: number; y: number };

const BUILDING_DRAG_TYPE = "application/x-ecodrive-building";
const INFRASTRUCTURE_DRAG_TYPE = "application/x-ecodrive-infrastructure";
const WAREHOUSE_DRAG_TYPE = "application/x-ecodrive-warehouse";

export default function CityPage() {
  const walletCoins = useDashboardStore((state) => state.walletCoins);
  const walletHasHydrated = useDashboardStore((state) => state.hasHydrated);
  const spendCoins = useDashboardStore((state) => state.spendCoins);
  const infrastructure = useCityStore((state) => state.infrastructure);
  const warehouse = useCityStore((state) => state.warehouse);
  const cityHasHydrated = useCityStore((state) => state.hasHydrated);
  const placeInfrastructure = useCityStore((state) => state.placeInfrastructure);
  const placeFromWarehouse = useCityStore((state) => state.placeFromWarehouse);
  const moveInfrastructure = useCityStore((state) => state.moveInfrastructure);
  const rotateInfrastructure = useCityStore((state) => state.rotateInfrastructure);
  const moveToWarehouse = useCityStore((state) => state.moveToWarehouse);

  const terrainRef = useRef<HTMLDivElement>(null);
  const terrainDragRef = useRef({ active: false, startX: 0, startY: 0, startYaw: 0, startPitch: 56 });
  const sellTimerRef = useRef<number | null>(null);
  const [selectedBuildingId, setSelectedBuildingId] = useState<CityBuildingId | null>(null);
  const [selectedInfrastructureId, setSelectedInfrastructureId] = useState<string | null>(null);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(null);
  const [storeOpen, setStoreOpen] = useState(false);
  const [terrainYaw, setTerrainYaw] = useState(-4);
  const [terrainPitch, setTerrainPitch] = useState(56);
  const [dropActive, setDropActive] = useState(false);
  const [placementPreview, setPlacementPreview] = useState<TerrainPoint | null>(null);
  const [sellCandidateId, setSellCandidateId] = useState<string | null>(null);
  const [sellingInfrastructureId, setSellingInfrastructureId] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [message, setMessage] = useState<PlacementMessage>({
    kind: "success",
    text: "Open the Store to grow your eco-city."
  });

  useEffect(() => {
    void useCityStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => {
      window.clearInterval(timer);
      if (sellTimerRef.current !== null) window.clearTimeout(sellTimerRef.current);
    };
  }, []);

  const selectedBuilding = selectedBuildingId ? cityBuildingMap[selectedBuildingId] : null;
  const selectedInfrastructure = infrastructure.find((item) => item.id === selectedInfrastructureId) ?? null;
  const sellCandidate = infrastructure.find((item) => item.id === sellCandidateId) ?? null;
  const storesReady = walletHasHydrated && cityHasHydrated;
  const cityStats = useMemo(() => calculateCityStats(infrastructure), [infrastructure]);
  const stageIndex = findStageIndex(cityStats.impact);
  const stage = cityStages[stageIndex];
  const nextStage = cityStages[stageIndex + 1];
  const stageProgress = nextStage
    ? ((cityStats.impact - stage.threshold) / (nextStage.threshold - stage.threshold)) * 100
    : 100;
  const bonusInfrastructure = useMemo(() => findBonusInfrastructure(infrastructure), [infrastructure]);
  const sunTimes = useMemo(() => getSunTimes(now, 3.139, 101.6869), [now]);
  const isDay = now >= sunTimes.sunrise && now < sunTimes.sunset;

  const purchaseAndPlace = (buildingId: CityBuildingId, x: number, y: number) => {
    if (!storesReady) {
      setMessage({ kind: "error", text: "Your saved city is still loading. Try again in a moment." });
      return;
    }
    const building = cityBuildingMap[buildingId];
    if (!spendCoins(building.cost)) {
      setMessage({ kind: "error", text: `You need ${building.cost - walletCoins} more EcoCoins for ${building.name}.` });
      return;
    }
    placeInfrastructure(buildingId, x, y);
    setSelectedBuildingId(null);
    setMessage({ kind: "success", text: `${building.name} added exactly where you placed it.` });
  };

  const restoreFromWarehouse = (id: string, x: number, y: number) => {
    const storedItem = warehouse.find((item) => item.id === id);
    if (!storedItem) return;
    placeFromWarehouse(id, x, y);
    setSelectedWarehouseId(null);
    setMessage({ kind: "success", text: `${cityBuildingMap[storedItem.buildingId].name} restored from your warehouse.` });
  };

  const confirmSale = () => {
    if (!sellCandidate || sellingInfrastructureId) return;
    const item = sellCandidate;
    const building = cityBuildingMap[item.buildingId];
    const refund = building.cost * 0.5;
    setSellCandidateId(null);
    setSellingInfrastructureId(item.id);
    sellTimerRef.current = window.setTimeout(() => {
      useCityStore.setState((state) => ({
        infrastructure: state.infrastructure.filter((placed) => placed.id !== item.id)
      }));
      useDashboardStore.setState((state) => ({
        walletCoins: state.walletCoins + refund,
        spentCoins: Math.max(0, state.spentCoins - refund)
      }));
      setSelectedInfrastructureId(null);
      setSellingInfrastructureId(null);
      setMessage({ kind: "success", text: `${building.name} sold. +${refund.toLocaleString()} EcoCoins refunded.` });
      sellTimerRef.current = null;
    }, 240);
  };

  const readTerrainPosition = (clientX: number, clientY: number) => {
    const terrain = terrainRef.current;
    if (!terrain) return { x: 50, y: 50 };
    const names = ["tl", "tr", "br", "bl"];
    const corners = names.map((name) => {
      const marker = terrain.querySelector<HTMLElement>(`[data-terrain-corner="${name}"]`);
      if (!marker) return null;
      const rect = marker.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    });
    if (corners.some((corner) => !corner)) {
      const bounds = terrain.getBoundingClientRect();
      return { x: clampPosition(((clientX - bounds.left) / bounds.width) * 100), y: clampPosition(((clientY - bounds.top) / bounds.height) * 100) };
    }
    const mapped = screenPointToUnitSquare({ x: clientX, y: clientY }, corners as TerrainPoint[]);
    return { x: clampPosition(mapped.x * 100), y: clampPosition(mapped.y * 100) };
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDropActive(false);
    setPlacementPreview(null);
    if (!storeOpen) return;
    const position = readTerrainPosition(event.clientX, event.clientY);
    const infrastructureId = event.dataTransfer.getData(INFRASTRUCTURE_DRAG_TYPE);
    const warehouseId = event.dataTransfer.getData(WAREHOUSE_DRAG_TYPE);
    const buildingId = event.dataTransfer.getData(BUILDING_DRAG_TYPE) as CityBuildingId;
    if (infrastructureId) {
      moveInfrastructure(infrastructureId, position.x, position.y);
      setSelectedInfrastructureId(null);
      setMessage({ kind: "success", text: "Infrastructure repositioned precisely. Layout saved." });
      return;
    }
    if (warehouseId) {
      restoreFromWarehouse(warehouseId, position.x, position.y);
      return;
    }
    if (buildingId && cityBuildingMap[buildingId]) purchaseAndPlace(buildingId, position.x, position.y);
  };

  const handleTerrainClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!storeOpen || (event.target as HTMLElement).closest("[data-infrastructure-id]")) return;
    const position = readTerrainPosition(event.clientX, event.clientY);
    if (selectedInfrastructureId) {
      moveInfrastructure(selectedInfrastructureId, position.x, position.y);
      setSelectedInfrastructureId(null);
      setMessage({ kind: "success", text: "Selected infrastructure moved to the highlighted position." });
      return;
    }
    if (selectedWarehouseId) {
      restoreFromWarehouse(selectedWarehouseId, position.x, position.y);
      return;
    }
    if (selectedBuildingId) {
      purchaseAndPlace(selectedBuildingId, position.x, position.y);
      return;
    }
    setMessage({ kind: "error", text: "Select an infrastructure from the Store before placing it." });
  };

  const beginTerrainRotation = (event: PointerEvent<HTMLDivElement>) => {
    if (storeOpen) return;
    terrainDragRef.current = { active: true, startX: event.clientX, startY: event.clientY, startYaw: terrainYaw, startPitch: terrainPitch };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const updateTerrainPointer = (event: PointerEvent<HTMLDivElement>) => {
    if (storeOpen) {
      setPlacementPreview(readTerrainPosition(event.clientX, event.clientY));
      return;
    }
    if (!terrainDragRef.current.active) return;
    setTerrainYaw(clampView(terrainDragRef.current.startYaw + (event.clientX - terrainDragRef.current.startX) * 0.12, -34, 34));
    setTerrainPitch(clampView(terrainDragRef.current.startPitch - (event.clientY - terrainDragRef.current.startY) * 0.12, 40, 68));
  };

  const stopTerrainRotation = (event: PointerEvent<HTMLDivElement>) => {
    terrainDragRef.current.active = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <CockpitShell activeMode="city">
      <main className={`city3d-page ${isDay ? "city3d-page--day" : "city3d-page--night"}`}>
        <section className="city3d-frame" aria-labelledby="city3d-title">
          <header className="city3d-header">
            <div>
              <p>Eco-City</p>
              <h1 id="city3d-title">Eco-City Builder</h1>
              <span>Invest EcoCoins. Build sustainable infrastructure. Generate passive Yield Coins.</span>
            </div>
            <div className="city3d-header-actions">
              <div className="city3d-sun-status">
                <i aria-hidden="true" />
                <span><b>{isDay ? "Daylight city" : "Night city"}</b><small>{isDay ? `Sunset ${formatTime(sunTimes.sunset)}` : `Sunrise ${formatTime(sunTimes.sunrise)}`}</small></span>
              </div>
              <button
                className={storeOpen ? "city3d-store-toggle city3d-store-toggle--active" : "city3d-store-toggle"}
                onClick={() => {
                  setStoreOpen((open) => !open);
                  setSelectedInfrastructureId(null);
                  setSelectedWarehouseId(null);
                  setPlacementPreview(null);
                  setMessage({ kind: "success", text: storeOpen ? "Store closed. Terrain camera unlocked." : "Store open. Drag or tap to place infrastructure." });
                }}
                type="button"
              >
                {storeOpen ? "Close Store" : "Open Store"}
              </button>
            </div>
          </header>

          <section className="city3d-summary" aria-label="City summary">
            <SummaryStat label="EcoCoins" value={walletCoins.toLocaleString()} tone="amber" />
            <SummaryStat label="Yield Coins" value={cityStats.yieldCoins.toLocaleString()} tone="green" />
            <SummaryStat label="Daily yield" value={`+${cityStats.dailyYield}`} tone="cyan" />
            <div className="city3d-stage">
              <div><span>City stage</span><strong>{stage.name}</strong></div>
              <small>{nextStage ? `${cityStats.impact}/${nextStage.threshold} impact` : "Maximum stage"}</small>
              <div className="city3d-stage-track"><i style={{ width: `${Math.max(4, Math.min(100, stageProgress))}%` }} /></div>
            </div>
          </section>

          <div className={storeOpen ? "city3d-workspace city3d-workspace--store" : "city3d-workspace"}>
            <section className="city3d-map-panel" aria-label="Interactive 3D eco-city terrain">
              <div className="city3d-map-heading">
                <div><small>District 01</small><strong>Lakeview eco district</strong></div>
                <div className={`city3d-message city3d-message--${message.kind}`}>{message.text}</div>
              </div>

              <div
                className={`city3d-field ${storeOpen ? "city3d-field--editing" : "city3d-field--viewing"} ${dropActive ? "city3d-field--drop" : ""}`}
                onClick={handleTerrainClick}
                onDragEnter={() => setDropActive(true)}
                onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) { setDropActive(false); setPlacementPreview(null); } }}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = event.dataTransfer.types.includes(BUILDING_DRAG_TYPE) ? "copy" : "move";
                  setDropActive(true);
                  setPlacementPreview(readTerrainPosition(event.clientX, event.clientY));
                }}
                onDrop={handleDrop}
                onPointerCancel={stopTerrainRotation}
                onPointerDown={beginTerrainRotation}
                onPointerMove={updateTerrainPointer}
                onPointerUp={stopTerrainRotation}
                ref={terrainRef}
                style={{
                  "--terrain-yaw": `${terrainYaw}deg`,
                  "--terrain-pitch": `${terrainPitch}deg`,
                  "--terrain-yaw-inverse": `${-terrainYaw}deg`,
                  "--terrain-pitch-inverse": `${-terrainPitch}deg`
                } as CSSProperties}
              >
                <div className="city3d-atmosphere" aria-hidden="true">
                  <span className="city3d-sky-orb" />
                  <span className="city3d-cloud city3d-cloud--one" />
                  <span className="city3d-cloud city3d-cloud--two" />
                  <span className="city3d-cloud city3d-cloud--three" />
                  <i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i />
                </div>
                <div className="city3d-world">
                  <div className="city3d-terrain">
                    <span className="city3d-road city3d-road--horizontal" />
                    <span className="city3d-road city3d-road--vertical" />
                    <span className="city3d-water" />
                    <span className="city3d-terrain-edge city3d-terrain-edge--front" />
                    <span className="city3d-terrain-edge city3d-terrain-edge--side" />
                  </div>
                  {(["tl", "tr", "br", "bl"] as const).map((corner) => <span className={`city3d-corner city3d-corner--${corner}`} data-terrain-corner={corner} key={corner} />)}

                  {placementPreview && storeOpen ? (
                    <span className="city3d-placement-preview" style={{ left: `${placementPreview.x}%`, top: `${placementPreview.y}%` }} />
                  ) : null}

                  {!infrastructure.length ? (
                    <div className="city3d-empty"><strong>Your terrain is ready</strong><span>Open the Store and place your first low-poly eco asset.</span></div>
                  ) : null}

                  {infrastructure.map((item) => (
                    <PlacedModel
                      isBonus={bonusInfrastructure.has(item.id)}
                      isEditing={storeOpen}
                      isSelected={item.id === selectedInfrastructureId}
                      isSelling={item.id === sellingInfrastructureId}
                      item={item}
                      key={item.id}
                      onRotate={() => {
                        rotateInfrastructure(item.id);
                        setMessage({ kind: "success", text: "Infrastructure rotated. Layout saved automatically." });
                      }}
                      onSelect={() => {
                        setSelectedInfrastructureId(item.id);
                        setSelectedWarehouseId(null);
                        setMessage({ kind: "success", text: `${cityBuildingMap[item.buildingId].name} selected. Tap a new grid area to reposition it.` });
                      }}
                    />
                  ))}
                </div>

                {storeOpen && selectedInfrastructure ? (
                  <div className="city3d-edit-toolbar">
                    <strong>{cityBuildingMap[selectedInfrastructure.buildingId].name}</strong>
                    <button onClick={(event) => { event.stopPropagation(); rotateInfrastructure(selectedInfrastructure.id); }} type="button">Rotate</button>
                    <button className="city3d-warehouse-action" onClick={(event) => {
                      event.stopPropagation();
                      moveToWarehouse(selectedInfrastructure.id);
                      setSelectedInfrastructureId(null);
                      setMessage({ kind: "success", text: "Infrastructure safely moved to your warehouse." });
                    }} type="button">Warehouse</button>
                    <button className="city3d-sell-action" onClick={(event) => {
                      event.stopPropagation();
                      setSellCandidateId(selectedInfrastructure.id);
                    }} type="button">Sell</button>
                  </div>
                ) : null}

                <div className="city3d-instruction">{storeOpen ? "Drag from the palette, or tap an item then tap the terrain" : "Drag left/right to turn · up/down to tilt"}</div>
              </div>

              <footer className="city3d-legend"><span><i /> Synergy bonus</span><span><i /> Auto-saved</span><strong>{infrastructure.length} assets placed</strong></footer>
            </section>

            {storeOpen ? (
              <aside className="city3d-palette" aria-label="Infrastructure Store">
                <div className="city3d-palette-heading"><div><small>Infrastructure</small><h2>Eco Store</h2></div><span>{walletCoins.toLocaleString()} coins</span></div>

                <section className="city3d-warehouse">
                  <div><strong>Warehouse</strong><span>{warehouse.length} stored</span></div>
                  {warehouse.length ? (
                    <div className="city3d-warehouse-list">
                      {warehouse.map((item) => {
                        const building = cityBuildingMap[item.buildingId];
                        return (
                          <button
                            className={selectedWarehouseId === item.id ? "city3d-warehouse-card city3d-warehouse-card--selected" : "city3d-warehouse-card"}
                            draggable
                            key={item.id}
                            onClick={() => { setSelectedWarehouseId(item.id); setSelectedInfrastructureId(null); setMessage({ kind: "success", text: `${building.name} selected from warehouse. Tap the terrain to place it.` }); }}
                            onDragEnd={() => setDropActive(false)}
                            onDragStart={(event) => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData(WAREHOUSE_DRAG_TYPE, item.id); setSelectedWarehouseId(item.id); }}
                            type="button"
                          >
                            <LowPolyModel buildingId={item.buildingId} compact />
                            <span><strong>{building.name}</strong><small>Owned · place free</small></span>
                          </button>
                        );
                      })}
                    </div>
                  ) : <p>Stored infrastructure appears here for free reuse.</p>}
                </section>

                <div className="city3d-palette-label">Build new infrastructure</div>
                <div className="city3d-palette-list">
                  {cityBuildings.map((building) => {
                    const selected = building.id === selectedBuildingId && !selectedWarehouseId && !selectedInfrastructureId;
                    const affordable = walletCoins >= building.cost;
                    return (
                      <button
                        aria-pressed={selected}
                        className={selected ? "city3d-palette-card city3d-palette-card--selected" : "city3d-palette-card"}
                        draggable={affordable && storesReady}
                        key={building.id}
                        onClick={() => { setSelectedBuildingId(building.id); setSelectedWarehouseId(null); setSelectedInfrastructureId(null); setMessage({ kind: "success", text: `${building.name} selected. Tap the exact terrain area where you want it.` }); }}
                        onDragEnd={() => { setDropActive(false); setPlacementPreview(null); }}
                        onDragStart={(event) => { event.dataTransfer.effectAllowed = "copy"; event.dataTransfer.setData(BUILDING_DRAG_TYPE, building.id); setSelectedBuildingId(building.id); setSelectedWarehouseId(null); setSelectedInfrastructureId(null); }}
                        style={{ "--building-color": building.color } as CSSProperties}
                        type="button"
                      >
                        <LowPolyModel buildingId={building.id} compact />
                        <span className="city3d-palette-copy"><strong>{building.name}</strong><small>+{building.yieldPerDay}/day · +{building.impact} impact</small></span>
                        <span className={affordable ? "city3d-cost" : "city3d-cost city3d-cost--locked"}><i />{building.cost}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="city3d-selected-detail">
                  {selectedBuilding ? <><strong>{selectedBuilding.name}</strong><p>{selectedBuilding.description}</p></> : <><strong>No infrastructure selected</strong><p>Select a Store item before placing another one.</p></>}
                </div>
              </aside>
            ) : null}
          </div>
        </section>
      </main>
      {sellCandidate ? (
        <div className="city3d-sell-overlay" onClick={() => setSellCandidateId(null)} role="presentation">
          <section aria-labelledby="city3d-sell-title" aria-modal="true" className="city3d-sell-dialog" onClick={(event) => event.stopPropagation()} role="dialog">
            <h2 id="city3d-sell-title">Sell {cityBuildingMap[sellCandidate.buildingId].name}?</h2>
            <p>You will receive <strong>{(cityBuildingMap[sellCandidate.buildingId].cost * 0.5).toLocaleString()} EcoCoins</strong> back.</p>
            <div className="city3d-sell-dialog-actions">
              <button onClick={() => setSellCandidateId(null)} type="button">Cancel</button>
              <button className="city3d-sell-confirm" onClick={confirmSale} type="button">Sell</button>
            </div>
          </section>
        </div>
      ) : null}
      <style>{styleSheet}</style>
    </CockpitShell>
  );
}

function SummaryStat({ label, value, tone }: { label: string; value: string; tone: "amber" | "green" | "cyan" }) {
  return <div className={`city3d-stat city3d-stat--${tone}`}><span>{label}</span><strong>{value}</strong></div>;
}

function PlacedModel({ item, isBonus, isEditing, isSelected, isSelling, onSelect, onRotate }: {
  item: PlacedInfrastructure;
  isBonus: boolean;
  isEditing: boolean;
  isSelected: boolean;
  isSelling: boolean;
  onSelect: () => void;
  onRotate: () => void;
}) {
  const building = cityBuildingMap[item.buildingId];
  const depthScale = 0.82 + item.y / 320;
  return (
    <button
      aria-label={`${building.name}. ${isEditing ? "Tap to select or drag to move." : "Placed infrastructure."}`}
      className={`city3d-asset ${isEditing ? "city3d-asset--editable" : "city3d-asset--locked"} ${isSelected ? "city3d-asset--selected" : ""} ${isSelling ? "city3d-asset--selling" : ""}`}
      data-infrastructure-id={item.id}
      draggable={isEditing}
      onClick={(event) => { if (!isEditing) return; event.stopPropagation(); onSelect(); }}
      onDoubleClick={(event) => { if (!isEditing) return; event.stopPropagation(); onRotate(); }}
      onDragStart={(event) => { if (!isEditing) { event.preventDefault(); return; } event.stopPropagation(); event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData(INFRASTRUCTURE_DRAG_TYPE, item.id); }}
      style={{ left: `${item.x}%`, top: `${item.y}%`, transform: `translate(-50%, -76%) scale(${depthScale})`, zIndex: Math.round(item.y) + 20, "--model-rotation": `${item.rotation}deg`, "--building-color": building.color } as CSSProperties}
      type="button"
    >
      <span className="city3d-asset-shadow" />
      <span className="city3d-asset-upright">
        <LowPolyModel buildingId={item.buildingId} />
        <span className="city3d-asset-label">{building.shortName}</span>
        {isBonus ? <span className="city3d-bonus">BONUS</span> : null}
      </span>
    </button>
  );
}

function LowPolyModel({ buildingId, compact = false }: { buildingId: CityBuildingId; compact?: boolean }) {
  return (
    <span className={`lowpoly lowpoly--${buildingId} ${compact ? "lowpoly--compact" : ""}`} aria-hidden="true">
      <span className="lowpoly-ground" />
      {buildingId === "wind" ? <><ModelBox className="wind-platform3d" /><ModelBox className="wind-house3d" /><span className="wind-roof3d" /><ModelBox className="wind-tower3d" /><ModelBox className="wind-hub3d" /><ModelBox className="wind-blade3d wind-blade3d--one" /><ModelBox className="wind-blade3d wind-blade3d--two" /><ModelBox className="wind-blade3d wind-blade3d--three" /><ModelTree className="wind-tree3d" /></> : null}
      {buildingId === "solar" ? <><ModelBox className="solar-pad3d" /><ModelBox className="solar-stand3d solar-stand3d--one" /><ModelBox className="solar-stand3d solar-stand3d--two" /><ModelBox className="solar-panel3d solar-panel3d--one" /><ModelBox className="solar-panel3d solar-panel3d--two" /></> : null}
      {buildingId === "park" ? <><ModelBox className="park-platform3d" /><span className="park-water3d" /><ModelTree className="park-tree3d park-tree3d--one" /><ModelTree className="park-tree3d park-tree3d--two" /><ModelTree className="park-tree3d park-tree3d--three" /><ModelBox className="park-bench3d" /></> : null}
      {buildingId === "charger" ? <><ModelBox className="charger-pad3d" /><ModelBox className="charger-canopy3d" /><ModelBox className="charger-pillar3d charger-pillar3d--one" /><ModelBox className="charger-pillar3d charger-pillar3d--two" /><ModelBox className="charger-unit3d charger-unit3d--one" /><ModelBox className="charger-unit3d charger-unit3d--two" /><i className="charger-light3d charger-light3d--one" /><i className="charger-light3d charger-light3d--two" /></> : null}
      {buildingId === "recycling" ? <><ModelBox className="recycling-pad3d" /><ModelBox className="recycling-building3d" /><ModelBox className="recycling-roof3d" /><ModelBox className="recycling-stack3d" /><ModelBox className="recycling-bin3d recycling-bin3d--one" /><ModelBox className="recycling-bin3d recycling-bin3d--two" /><i className="model-window3d recycling-window3d" /></> : null}
      {buildingId === "school" ? <><ModelBox className="school-yard3d" /><ModelBox className="school-building3d" /><ModelBox className="school-roof3d" /><ModelBox className="school-wing3d" /><i className="model-window3d school-window3d school-window3d--one" /><i className="model-window3d school-window3d school-window3d--two" /><ModelTree className="school-tree3d" /></> : null}
    </span>
  );
}

function ModelBox({ className }: { className: string }) {
  return <span className={`model-box ${className}`}><i className="model-face model-face--front" /><i className="model-face model-face--back" /><i className="model-face model-face--left" /><i className="model-face model-face--right" /><i className="model-face model-face--top" /><i className="model-face model-face--bottom" /></span>;
}

function ModelTree({ className }: { className: string }) {
  return <span className={`model-tree3d ${className}`}><ModelBox className="model-tree-trunk3d" /><i className="model-tree-crown3d model-tree-crown3d--low" /><i className="model-tree-crown3d model-tree-crown3d--high" /></span>;
}

function screenPointToUnitSquare(point: TerrainPoint, quad: TerrainPoint[]) {
  const [p0, p1, p2, p3] = quad;
  const dx1 = p1.x - p2.x;
  const dx2 = p3.x - p2.x;
  const dx3 = p0.x - p1.x + p2.x - p3.x;
  const dy1 = p1.y - p2.y;
  const dy2 = p3.y - p2.y;
  const dy3 = p0.y - p1.y + p2.y - p3.y;
  const denominator = dx1 * dy2 - dx2 * dy1;
  const g = Math.abs(denominator) < 0.0001 ? 0 : (dx3 * dy2 - dx2 * dy3) / denominator;
  const h = Math.abs(denominator) < 0.0001 ? 0 : (dx1 * dy3 - dx3 * dy1) / denominator;
  const matrix = [p1.x - p0.x + g * p1.x, p3.x - p0.x + h * p3.x, p0.x, p1.y - p0.y + g * p1.y, p3.y - p0.y + h * p3.y, p0.y, g, h, 1];
  const inverse = invertMatrix3(matrix);
  if (!inverse) return { x: 0.5, y: 0.5 };
  const w = inverse[6] * point.x + inverse[7] * point.y + inverse[8];
  return { x: (inverse[0] * point.x + inverse[1] * point.y + inverse[2]) / w, y: (inverse[3] * point.x + inverse[4] * point.y + inverse[5]) / w };
}

function invertMatrix3(m: number[]) {
  const determinant = m[0] * (m[4] * m[8] - m[5] * m[7]) - m[1] * (m[3] * m[8] - m[5] * m[6]) + m[2] * (m[3] * m[7] - m[4] * m[6]);
  if (Math.abs(determinant) < 0.000001) return null;
  return [
    (m[4] * m[8] - m[5] * m[7]) / determinant, (m[2] * m[7] - m[1] * m[8]) / determinant, (m[1] * m[5] - m[2] * m[4]) / determinant,
    (m[5] * m[6] - m[3] * m[8]) / determinant, (m[0] * m[8] - m[2] * m[6]) / determinant, (m[2] * m[3] - m[0] * m[5]) / determinant,
    (m[3] * m[7] - m[4] * m[6]) / determinant, (m[1] * m[6] - m[0] * m[7]) / determinant, (m[0] * m[4] - m[1] * m[3]) / determinant
  ];
}

function clampPosition(value: number) { return Math.min(94, Math.max(6, value)); }
function clampView(value: number, minimum: number, maximum: number) { return Math.min(maximum, Math.max(minimum, value)); }
function formatTime(date: Date) {
  const hour = date.getHours();
  return `${hour % 12 || 12}:${date.getMinutes().toString().padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
}

function calculateCityStats(items: PlacedInfrastructure[]) {
  let dailyYield = 0;
  let impact = 0;
  let bonusYield = 0;
  items.forEach((item, index) => {
    const building = cityBuildingMap[item.buildingId];
    dailyYield += building.yieldPerDay;
    impact += building.impact;
    items.slice(index + 1).forEach((other) => {
      if (!isSynergyPair(item.buildingId, other.buildingId) || distance(item, other) > 19) return;
      bonusYield += (building.yieldPerDay + cityBuildingMap[other.buildingId].yieldPerDay) * 0.25;
    });
  });
  dailyYield = Math.round(dailyYield + bonusYield);
  return { dailyYield, impact, yieldCoins: items.length ? 420 + dailyYield * 7 : 0 };
}

function findBonusInfrastructure(items: PlacedInfrastructure[]) {
  const bonusIds = new Set<string>();
  items.forEach((item, index) => items.slice(index + 1).forEach((other) => {
    if (isSynergyPair(item.buildingId, other.buildingId) && distance(item, other) <= 19) { bonusIds.add(item.id); bonusIds.add(other.id); }
  }));
  return bonusIds;
}

function isSynergyPair(first: CityBuildingId, second: CityBuildingId) {
  return (first === "solar" && second === "charger") || (first === "charger" && second === "solar") || (first === "recycling" && second === "school") || (first === "school" && second === "recycling");
}

function distance(first: PlacedInfrastructure, second: PlacedInfrastructure) { return Math.hypot(first.x - second.x, first.y - second.y); }
function findStageIndex(impact: number) { for (let index = cityStages.length - 1; index >= 0; index -= 1) if (impact >= cityStages[index].threshold) return index; return 0; }

function getSunTimes(date: Date, latitude: number, longitude: number) {
  const rad = Math.PI / 180;
  const dayMs = 86_400_000;
  const j1970 = 2_440_588;
  const j2000 = 2_451_545;
  const toJulian = (value: Date) => value.valueOf() / dayMs - 0.5 + j1970;
  const fromJulian = (value: number) => new Date((value + 0.5 - j1970) * dayMs);
  const days = toJulian(date) - j2000;
  const lw = -longitude * rad;
  const phi = latitude * rad;
  const cycle = Math.round(days - 0.0009 - lw / (2 * Math.PI));
  const transit = (hour: number) => 0.0009 + (hour + lw) / (2 * Math.PI) + cycle;
  const meanAnomaly = (357.5291 + 0.98560028 * transit(0)) * rad;
  const equation = 1.9148 * rad * Math.sin(meanAnomaly) + 0.02 * rad * Math.sin(2 * meanAnomaly) + 0.0003 * rad * Math.sin(3 * meanAnomaly);
  const eclipticLongitude = meanAnomaly + equation + 102.9372 * rad + Math.PI;
  const declination = Math.asin(Math.sin(eclipticLongitude) * Math.sin(23.4397 * rad));
  const solarNoon = j2000 + transit(0) + 0.0053 * Math.sin(meanAnomaly) - 0.0069 * Math.sin(2 * eclipticLongitude);
  const altitude = -0.833 * rad;
  const hourAngle = Math.acos((Math.sin(altitude) - Math.sin(phi) * Math.sin(declination)) / (Math.cos(phi) * Math.cos(declination)));
  const set = j2000 + transit(hourAngle) + 0.0053 * Math.sin(meanAnomaly) - 0.0069 * Math.sin(2 * eclipticLongitude);
  return { sunrise: fromJulian(solarNoon - (set - solarNoon)), sunset: fromJulian(set) };
}

const styleSheet = `
  .city3d-page { min-height: 100vh; padding: 86px 24px 108px; transition: background .8s ease; }
  .city3d-frame { background: radial-gradient(circle at 75% 0%, rgba(55,229,143,.08), transparent 28%), #081312; border: 1px solid rgba(86,115,108,.28); border-radius: 20px; box-shadow: 0 30px 90px rgba(0,0,0,.32); margin: 0 auto; max-width: 1460px; overflow: hidden; padding: 22px; }
  .city3d-header { align-items: center; display: flex; gap: 24px; justify-content: space-between; padding: 4px 4px 20px; }
  .city3d-header p { color: #37e58f; font-size: 11px; font-weight: 900; letter-spacing: .12em; margin: 0; text-transform: uppercase; }
  .city3d-header h1 { color: #f4fff9; font-size: clamp(30px,3.2vw,46px); letter-spacing: -.04em; margin: 5px 0 0; }
  .city3d-header > div:first-child > span { color: #8fa69f; display: block; font-size: 12px; margin-top: 7px; }
  .city3d-header-actions { align-items: center; display: flex; gap: 10px; }
  .city3d-sun-status { align-items: center; background: rgba(15,28,27,.84); border: 1px solid rgba(91,119,112,.24); border-radius: 12px; display: flex; gap: 9px; padding: 9px 12px; }
  .city3d-sun-status > i { background: #ffc45f; border-radius: 50%; box-shadow: 0 0 16px rgba(255,196,95,.55); height: 19px; width: 19px; }
  .city3d-page--night .city3d-sun-status > i { background: #b9d8ff; box-shadow: -5px 1px 0 #102226, 0 0 15px rgba(126,181,255,.46); }
  .city3d-sun-status span { display: grid; gap: 1px; }
  .city3d-sun-status b { color: #e9fff4; font-size: 10px; }
  .city3d-sun-status small { color: #82958f; font-size: 8px; }
  .city3d-store-toggle { background: rgba(245,184,75,.09); border: 1px solid rgba(245,184,75,.38); border-radius: 10px; color: #f5b84b; cursor: pointer; font-size: 10px; font-weight: 900; min-height: 42px; padding: 0 15px; }
  .city3d-store-toggle--active { background: rgba(55,229,143,.13); border-color: rgba(55,229,143,.56); color: #37e58f; }
  .city3d-summary { background: rgba(6,14,14,.68); border: 1px solid rgba(84,112,105,.22); border-radius: 14px; display: grid; gap: 9px; grid-template-columns: repeat(3,minmax(120px,.65fr)) minmax(220px,1.2fr); margin-bottom: 14px; padding: 10px; }
  .city3d-stat,.city3d-stage { background: linear-gradient(145deg,rgba(17,31,29,.96),rgba(10,20,20,.96)); border: 1px solid rgba(89,117,110,.2); border-radius: 10px; }
  .city3d-stat { display: grid; gap: 4px; padding: 11px; }
  .city3d-stat span,.city3d-stage span,.city3d-stage small { color: #829891; font-size: 9px; }
  .city3d-stat strong { font-size: 20px; }
  .city3d-stat--amber strong { color: #f5b84b; }.city3d-stat--green strong { color: #37e58f; }.city3d-stat--cyan strong { color: #55cfff; }
  .city3d-stage { display: grid; gap: 6px; padding: 10px 12px; }
  .city3d-stage > div:first-child { display: flex; justify-content: space-between; }.city3d-stage strong { color: #37e58f; font-size: 12px; }
  .city3d-stage-track { background: rgba(134,160,153,.11); border-radius: 999px; height: 5px; overflow: hidden; }.city3d-stage-track i { background: linear-gradient(90deg,#37e58f,#4bc8ff); display: block; height: 100%; }
  .city3d-workspace { display: grid; gap: 14px; grid-template-columns: 1fr; }.city3d-workspace--store { grid-template-columns: minmax(0,1fr) minmax(270px,330px); }
  .city3d-map-panel,.city3d-palette { background: rgba(7,16,16,.88); border: 1px solid rgba(89,117,110,.22); border-radius: 14px; min-width: 0; overflow: hidden; }
  .city3d-map-heading { align-items: center; display: flex; gap: 16px; justify-content: space-between; min-height: 62px; padding: 10px 14px; }
  .city3d-map-heading > div:first-child { display: grid; gap: 3px; }.city3d-map-heading small,.city3d-palette-heading small { color: #37e58f; font-size: 9px; font-weight: 900; letter-spacing: .1em; text-transform: uppercase; }.city3d-map-heading strong { color: #f4fff9; font-size: 14px; }
  .city3d-message { background: rgba(55,229,143,.07); border: 1px solid rgba(55,229,143,.2); border-radius: 8px; color: #8feeb9; font-size: 9px; line-height: 1.35; max-width: 380px; padding: 8px 10px; }.city3d-message--error { background: rgba(255,95,80,.08); border-color: rgba(255,95,80,.28); color: #ff867a; }
  .city3d-field { background: linear-gradient(180deg,#48afe0 0%,#8ed5e8 48%,#174239 100%); cursor: grab; height: clamp(480px,58vw,680px); overflow: hidden; perspective: 980px; position: relative; touch-action: none; transition: background .8s ease,box-shadow .2s ease; }
  .city3d-field:active { cursor: grabbing; }.city3d-field--editing { cursor: crosshair; }.city3d-field--drop { box-shadow: inset 0 0 0 2px rgba(55,229,143,.72),inset 0 0 70px rgba(55,229,143,.1); }
  .city3d-page--night .city3d-field { background:linear-gradient(180deg,#071326 0%,#0b2340 52%,#071a1c 100%); }
  .city3d-atmosphere { background:linear-gradient(180deg,rgba(181,235,255,.2),rgba(255,236,183,.08) 52%,transparent 72%); inset:0; pointer-events:none; position:absolute; transition:background .8s ease; }.city3d-page--night .city3d-atmosphere{background:radial-gradient(circle at 50% 55%,rgba(57,116,174,.16),transparent 48%),linear-gradient(180deg,rgba(3,10,28,.22),transparent 72%)}
  .city3d-sky-orb{background:radial-gradient(circle at 37% 34%,#fffbd5 0 13%,#ffe184 38%,#ffb73f 72%);border-radius:50%;box-shadow:0 0 26px rgba(255,194,78,.64),0 0 72px rgba(255,190,65,.2);height:68px;position:absolute;right:9%;top:10%;transition:background .8s ease,box-shadow .8s ease,transform .8s ease;width:68px}.city3d-page--night .city3d-sky-orb{background:radial-gradient(circle at 35% 30%,#f7fbff,#ccdcf5 64%,#9fb9de);box-shadow:-12px 4px 0 1px rgba(5,16,29,.76),0 0 30px rgba(156,197,255,.38);transform:scale(.82)}
  .city3d-atmosphere i{background:rgba(255,255,255,.82);border-radius:50%;height:2px;opacity:0;position:absolute;transition:opacity .8s ease;width:2px}.city3d-page--night .city3d-atmosphere i{opacity:.86;box-shadow:0 0 6px #cce7ff}.city3d-atmosphere i:nth-of-type(1){left:13%;top:17%}.city3d-atmosphere i:nth-of-type(2){right:23%;top:27%}.city3d-atmosphere i:nth-of-type(3){left:48%;top:12%}.city3d-atmosphere i:nth-of-type(4){left:31%;top:31%;height:1px;width:1px}.city3d-atmosphere i:nth-of-type(5){right:13%;top:40%}.city3d-atmosphere i:nth-of-type(6){left:68%;top:20%;height:1px;width:1px}
  .city3d-atmosphere i:nth-of-type(7){left:8%;top:39%}.city3d-atmosphere i:nth-of-type(8){left:39%;top:22%;height:1px;width:1px}.city3d-atmosphere i:nth-of-type(9){right:37%;top:35%}.city3d-atmosphere i:nth-of-type(10){right:7%;top:17%;height:1px;width:1px}.city3d-atmosphere i:nth-of-type(11){left:58%;top:42%}.city3d-atmosphere i:nth-of-type(12){left:24%;top:9%;height:1px;width:1px}
  .city3d-cloud{background:rgba(255,255,255,.78);border-radius:999px;box-shadow:0 9px 22px rgba(45,112,141,.12);height:16px;opacity:.88;position:absolute;transition:opacity .8s ease,transform .8s ease;width:88px}.city3d-cloud::before,.city3d-cloud::after{background:inherit;border-radius:50%;content:"";position:absolute}.city3d-cloud::before{height:31px;left:17px;top:-16px;width:37px}.city3d-cloud::after{height:23px;right:12px;top:-10px;width:29px}.city3d-cloud--one{left:9%;top:18%;transform:scale(.82)}.city3d-cloud--two{left:42%;top:10%;transform:scale(.58)}.city3d-cloud--three{right:18%;top:29%;transform:scale(.7)}.city3d-page--night .city3d-cloud{opacity:0;transform:translateY(-8px) scale(.65)}
  .city3d-world { aspect-ratio:1; left:50%; position:absolute; top:49%; transform:translate(-50%,-50%) rotateX(var(--terrain-pitch)) rotateZ(var(--terrain-yaw)); transform-origin:center; transform-style:preserve-3d; transition:transform .09s linear; width:min(76%,690px); }
  .city3d-terrain { background:linear-gradient(rgba(117,195,139,.13) 1px,transparent 1px),linear-gradient(90deg,rgba(117,195,139,.13) 1px,transparent 1px),linear-gradient(145deg,#28704d,#174c38 55%,#216142); background-size:42px 42px,42px 42px,auto; border:1px solid rgba(127,220,158,.38); border-radius:25px; box-shadow:0 45px 75px rgba(0,0,0,.48),inset 0 0 70px rgba(102,238,158,.08); inset:0; overflow:hidden; position:absolute; transition:background .8s ease,box-shadow .8s ease; }
  .city3d-page--night .city3d-terrain { background:linear-gradient(rgba(73,143,115,.13) 1px,transparent 1px),linear-gradient(90deg,rgba(73,143,115,.13) 1px,transparent 1px),linear-gradient(145deg,#12372f,#0a2522 58%,#102f2a); background-size:42px 42px,42px 42px,auto; box-shadow:0 45px 85px rgba(0,0,0,.68),inset 0 0 90px rgba(55,109,171,.14); }
  .city3d-page--day .city3d-terrain{background:linear-gradient(rgba(220,255,226,.15) 1px,transparent 1px),linear-gradient(90deg,rgba(220,255,226,.15) 1px,transparent 1px),linear-gradient(145deg,#43aa63,#23854f 55%,#2f9d59);background-size:42px 42px,42px 42px,auto;box-shadow:0 38px 70px rgba(19,68,49,.34),inset -30px -22px 65px rgba(17,87,50,.16),inset 24px 18px 55px rgba(255,244,179,.12)}
  .city3d-road { background:linear-gradient(90deg,#263534,#3b4a48,#253331); box-shadow:0 0 0 6px rgba(24,55,44,.5); position:absolute; }.city3d-road::after { background:repeating-linear-gradient(90deg,rgba(242,220,130,.46) 0 13px,transparent 13px 29px); content:""; height:2px; left:0; position:absolute; right:0; top:50%; }
  .city3d-road--horizontal { height:8%; left:-2%; top:50%; transform:rotate(-4deg); width:106%; }.city3d-road--vertical { height:112%; left:68%; top:-6%; transform:rotate(7deg); width:7%; }.city3d-road--vertical::after { background:repeating-linear-gradient(180deg,rgba(242,220,130,.42) 0 13px,transparent 13px 29px); height:100%; left:50%; top:0; width:2px; }
  .city3d-water { background:radial-gradient(ellipse at 40% 35%,#55c9d2,#177789 68%,#0b5062); border:3px solid rgba(157,235,224,.28); border-radius:50%; bottom:7%; box-shadow:inset 0 0 18px rgba(255,255,255,.18); height:24%; left:8%; position:absolute; width:29%; }
  .city3d-terrain-edge { background:linear-gradient(#143e2d,#082018); position:absolute; }.city3d-terrain-edge--front { bottom:-15px; height:18px; left:3%; transform:rotateX(90deg); transform-origin:top; width:94%; }.city3d-terrain-edge--side { height:94%; right:-15px; top:3%; transform:rotateY(90deg); transform-origin:left; width:18px; }
  .city3d-corner { height:2px; pointer-events:none; position:absolute; width:2px; }.city3d-corner--tl{left:0;top:0}.city3d-corner--tr{right:0;top:0}.city3d-corner--br{bottom:0;right:0}.city3d-corner--bl{bottom:0;left:0}
  .city3d-placement-preview { background:rgba(55,229,143,.16); border:2px solid rgba(55,229,143,.86); border-radius:12px; box-shadow:0 0 18px rgba(55,229,143,.35),inset 0 0 16px rgba(55,229,143,.18); height:62px; pointer-events:none; position:absolute; transform:translate(-50%,-50%); width:62px; z-index:12; }
  .city3d-empty { color:#b7d6ca; display:grid; gap:6px; left:50%; place-items:center; pointer-events:none; position:absolute; text-align:center; top:43%; transform:translate(-50%,-50%); width:260px; }.city3d-empty strong{color:#f4fff9;font-size:18px}.city3d-empty span{font-size:10px}
  .city3d-asset { background:transparent;border:0;height:108px;padding:0;position:absolute;transform-origin:center bottom;width:108px}.city3d-asset--locked{pointer-events:none}.city3d-asset--editable{cursor:grab}.city3d-asset--selected{filter:drop-shadow(0 0 13px #37e58f)}.city3d-asset--selling{animation:city3d-sell-away .24s cubic-bezier(.4,0,.8,.2) forwards;pointer-events:none}
  .city3d-asset-shadow { background:rgba(0,0,0,.4);border-radius:50%;bottom:4px;filter:blur(5px);height:18px;left:17px;position:absolute;transform:translateZ(-5px);width:74px}.city3d-asset-upright{bottom:4px;height:108px;left:0;pointer-events:none;position:absolute;transform:rotateX(var(--terrain-pitch-inverse));transform-origin:center bottom;transform-style:preserve-3d;width:108px}.city3d-asset-label{background:rgba(4,13,12,.88);border:1px solid rgba(178,218,205,.2);border-radius:999px;bottom:-1px;color:#eafff5;font-size:8px;font-weight:900;left:50%;padding:4px 8px;position:absolute;transform:translateX(-50%) translateZ(18px);white-space:nowrap}.city3d-bonus{background:#f5b84b;border-radius:999px;color:#171006;font-size:6px;font-weight:950;padding:3px 5px;position:absolute;right:0;top:6px;transform:translateZ(22px)}
  .lowpoly { bottom:14px;display:block;height:88px;left:10px;position:absolute;transform:scale(1.25) rotateX(-25deg) rotateY(calc(var(--model-rotation,12deg) + var(--terrain-yaw,0deg)));transform-origin:center bottom;transform-style:preserve-3d;transition:transform .12s linear;width:88px}.lowpoly *{box-sizing:border-box;position:absolute}.lowpoly-ground{background:radial-gradient(ellipse,rgba(0,0,0,.42),transparent 68%);bottom:-2px;filter:blur(2px);height:18px;left:4px;transform:rotateX(74deg) translateZ(-6px);width:80px}.lowpoly--compact{bottom:auto;height:62px;left:auto;position:relative;transform:scale(.74) rotateX(-25deg) rotateY(22deg);transform-origin:center;width:76px}.lowpoly--compact .lowpoly-ground{bottom:0}
  .model-box{--box-d:16px;--box-h:20px;--box-w:20px;--face-back:#41675d;--face-bottom:#29473f;--face-front:#8cb9aa;--face-left:#517d70;--face-right:#3e655a;--face-top:#c7ded5;height:var(--box-h);transform-style:preserve-3d;width:var(--box-w)}.model-face{backface-visibility:hidden;display:block}.model-face--front,.model-face--back{height:var(--box-h);left:0;top:0;width:var(--box-w)}.model-face--front{background:var(--face-front);transform:translateZ(calc(var(--box-d) * .5))}.model-face--back{background:var(--face-back);transform:rotateY(180deg) translateZ(calc(var(--box-d) * .5))}.model-face--left,.model-face--right{height:var(--box-h);left:calc((var(--box-w) - var(--box-d)) * .5);top:0;width:var(--box-d)}.model-face--left{background:var(--face-left);transform:rotateY(-90deg) translateZ(calc(var(--box-w) * .5))}.model-face--right{background:var(--face-right);transform:rotateY(90deg) translateZ(calc(var(--box-w) * .5))}.model-face--top,.model-face--bottom{height:var(--box-d);left:0;top:calc((var(--box-h) - var(--box-d)) * .5);width:var(--box-w)}.model-face--top{background:var(--face-top);transform:rotateX(90deg) translateZ(calc(var(--box-h) * .5))}.model-face--bottom{background:var(--face-bottom);transform:rotateX(-90deg) translateZ(calc(var(--box-h) * .5))}
  .wind-platform3d{--box-d:48px;--box-h:7px;--box-w:72px;--face-front:#159348;--face-left:#0c7137;--face-right:#095e30;--face-top:linear-gradient(135deg,#75dc66,#2dae50);bottom:4px;left:8px}.wind-house3d{--box-d:18px;--box-h:18px;--box-w:22px;--face-front:#edf2e7;--face-left:#b7c9bc;--face-right:#91aaa0;--face-top:#fff3cf;bottom:11px;left:5px}.wind-roof3d{background:linear-gradient(135deg,#fff3cf,#c8c0a8);bottom:29px;clip-path:polygon(50% 0,100% 100%,0 100%);height:11px;left:2px;transform:translateZ(1px);width:28px}.wind-tower3d{--box-d:9px;--box-h:58px;--box-w:9px;--face-front:linear-gradient(90deg,#b8cccd,#f8fcf8);--face-left:#8ca7aa;--face-right:#6f8d91;--face-top:#f7fbf8;bottom:11px;left:40px}.wind-hub3d{--box-d:12px;--box-h:13px;--box-w:13px;--face-front:#eef7f5;--face-left:#9eb7b9;--face-right:#78999c;--face-top:#fff;left:38px;top:5px;transform:translateZ(6px);z-index:9}.wind-blade3d{--box-d:3px;--box-h:39px;--box-w:5px;--face-front:linear-gradient(#f8fcfa,#a8bdc1);--face-left:#8da6aa;--face-right:#758f93;--face-top:#fff;left:42px;top:-27px;transform-origin:50% 100%;z-index:8}.wind-blade3d--one{transform:translateZ(6px)}.wind-blade3d--two{transform:translateZ(6px) rotateZ(120deg)}.wind-blade3d--three{transform:translateZ(6px) rotateZ(240deg)}
  .solar-pad3d{--box-d:48px;--box-h:6px;--box-w:76px;--face-front:#267250;--face-left:#174f3a;--face-right:#103f31;--face-top:#3d9b68;bottom:4px;left:6px}.solar-stand3d{--box-d:5px;--box-h:27px;--box-w:5px;--face-front:#b5cbc7;--face-left:#718d88;--face-right:#58746f;--face-top:#e6f3ef;bottom:9px}.solar-stand3d--one{left:23px}.solar-stand3d--two{right:17px}.solar-panel3d{--box-d:27px;--box-h:5px;--box-w:40px;--face-front:#0a3554;--face-left:#36566b;--face-right:#18384d;--face-top:linear-gradient(rgba(83,190,255,.42) 1px,transparent 1px),linear-gradient(90deg,rgba(83,190,255,.42) 1px,transparent 1px),linear-gradient(145deg,#176f9d,#092d52);background-size:10px 10px;top:24px;transform:rotateX(-22deg) rotateZ(-5deg)}.solar-panel3d--one{left:1px}.solar-panel3d--two{right:0;top:31px}
  .solar-panel3d .model-face--top{background-size:10px 10px,10px 10px,auto}
  .park-platform3d{--box-d:54px;--box-h:7px;--box-w:76px;--face-front:#27945a;--face-left:#176f45;--face-right:#0e5738;--face-top:linear-gradient(135deg,#6bd377,#2e9b5b);bottom:4px;left:6px}.park-water3d{background:radial-gradient(ellipse at 40% 30%,#85eaf0,#2796b3 65%,#12677e);border:1px solid rgba(190,255,249,.65);border-radius:50%;bottom:12px;height:14px;left:12px;transform:rotateX(72deg) translateZ(8px);width:28px}.model-tree3d{height:48px;transform-style:preserve-3d;width:27px}.model-tree-trunk3d{--box-d:6px;--box-h:27px;--box-w:6px;--face-front:#9a673d;--face-left:#684226;--face-right:#56361f;--face-top:#b47a48;bottom:0;left:10px}.model-tree-crown3d{background:radial-gradient(circle at 33% 24%,#94ec91,#35a95d 58%,#13703e);border-radius:48% 52% 46% 54%;box-shadow:inset -5px -5px 8px rgba(10,77,40,.28),0 5px 7px rgba(0,0,0,.16);height:27px;left:0;transform:translateZ(2px);width:27px}.model-tree-crown3d--low{top:9px}.model-tree-crown3d--high{height:23px;left:2px;top:0;transform:translateZ(-3px);width:23px}.park-tree3d--one{bottom:13px;left:38px}.park-tree3d--two{bottom:8px;left:59px;transform:scale(.76)}.park-tree3d--three{bottom:7px;left:20px;transform:scale(.65)}.wind-tree3d{bottom:8px;right:2px;transform:scale(.72)}.park-bench3d{--box-d:7px;--box-h:5px;--box-w:23px;--face-front:#c18a51;--face-left:#77502d;--face-right:#684325;--face-top:#e0b177;bottom:11px;left:48px;transform:rotateY(-18deg)}
  .charger-pad3d{--box-d:48px;--box-h:6px;--box-w:72px;--face-front:#276955;--face-left:#174a3c;--face-right:#10392f;--face-top:#428e76;bottom:4px;left:8px}.charger-canopy3d{--box-d:27px;--box-h:8px;--box-w:64px;--face-front:#2eaaa0;--face-left:#176f6b;--face-right:#115c59;--face-top:linear-gradient(135deg,#78e1d5,#2da8a0);left:11px;top:17px}.charger-pillar3d{--box-d:6px;--box-h:39px;--box-w:6px;--face-front:#d6e9e4;--face-left:#819c96;--face-right:#66817b;--face-top:#effaf7;bottom:8px}.charger-pillar3d--one{left:18px}.charger-pillar3d--two{right:15px}.charger-unit3d{--box-d:10px;--box-h:26px;--box-w:13px;--face-front:#dceee9;--face-left:#78938d;--face-right:#5b7771;--face-top:#f5fffc;bottom:9px}.charger-unit3d--one{left:27px}.charger-unit3d--two{right:23px}.charger-light3d{background:#48f0b6;border-radius:2px;box-shadow:0 0 8px #37e58f;height:7px;bottom:24px;transform:translateZ(6px);width:7px}.charger-light3d--one{left:30px}.charger-light3d--two{right:26px}
  .recycling-pad3d,.school-yard3d{--box-d:50px;--box-h:6px;--box-w:76px;--face-front:#2b8156;--face-left:#185b40;--face-right:#104632;--face-top:#4aab70;bottom:4px;left:6px}.recycling-building3d{--box-d:28px;--box-h:41px;--box-w:52px;--face-front:linear-gradient(145deg,#a9d7b0,#4d9464);--face-left:#3c7651;--face-right:#2e6042;--face-top:#b8ddbe;bottom:10px;left:17px}.recycling-roof3d{--box-d:34px;--box-h:6px;--box-w:56px;--face-front:#709f79;--face-left:#426d50;--face-right:#355d44;--face-top:#b7d8b8;bottom:49px;left:15px}.recycling-stack3d{--box-d:8px;--box-h:25px;--box-w:8px;--face-front:#aec9c0;--face-left:#647e77;--face-right:#4d6861;--face-top:#dae9e4;bottom:53px;left:61px}.recycling-bin3d{--box-d:11px;--box-h:17px;--box-w:14px;--face-front:#37ac6c;--face-left:#23734b;--face-right:#1c5f3f;--face-top:#74d69b;bottom:7px}.recycling-bin3d--one{left:5px}.recycling-bin3d--two{--face-front:#3b98bd;--face-left:#296a85;--face-right:#20566c;--face-top:#77c6df;right:3px}.model-window3d{background:#c4ffe0;border-radius:2px;box-shadow:0 0 8px rgba(90,255,173,.4);height:10px;transform:translateZ(16px);width:14px}.recycling-window3d{bottom:27px;left:28px}
  .school-yard3d{--face-front:#367d54;--face-left:#21583d;--face-right:#17452f;--face-top:#55ad73}.school-building3d{--box-d:30px;--box-h:40px;--box-w:53px;--face-front:linear-gradient(145deg,#dceae4,#86aaa0);--face-left:#6f9188;--face-right:#587970;--face-top:#b8d1c8;bottom:10px;left:8px}.school-roof3d{--box-d:35px;--box-h:7px;--box-w:57px;--face-front:#568c67;--face-left:#376347;--face-right:#2b523b;--face-top:#73b586;bottom:48px;left:6px}.school-wing3d{--box-d:22px;--box-h:25px;--box-w:29px;--face-front:#b9d1c8;--face-left:#74958c;--face-right:#5d7d74;--face-top:#d8e7e1;bottom:10px;right:1px}.school-window3d{bottom:27px}.school-window3d--one{left:17px}.school-window3d--two{left:37px}.school-tree3d{bottom:8px;right:0;transform:scale(.61)}
  .wind-island{background:radial-gradient(circle at 72% 24%,#b8f45a,#43c849 52%,#15933d 82%);border-radius:48% 52% 46% 54%;bottom:2px;box-shadow:0 7px 0 #087532,0 12px 15px rgba(0,0,0,.28);height:37px;left:0;transform:rotateX(61deg);width:88px}.wind-base{background:#d7e8e5;border-radius:50%;bottom:13px;height:8px;left:35px;width:24px}.wind-tower{background:linear-gradient(90deg,#8ba9ad,#f7fbf7 46%,#abc0c1 72%,#76969a);bottom:16px;clip-path:polygon(41% 0,59% 0,78% 100%,22% 100%);height:62px;left:38px;width:18px}.wind-head{background:linear-gradient(145deg,#f8fcf9,#9ebcc0);border:1px solid rgba(108,147,153,.35);border-radius:50%;box-shadow:0 3px 5px rgba(0,0,0,.2);height:14px;left:40px;top:3px;width:14px;z-index:4}.wind-head i{background:linear-gradient(145deg,#f8fcfa,#9ab9bd);border-radius:50%;height:8px;left:2px;top:2px;width:8px;z-index:5}.wind-blade{background:linear-gradient(90deg,#a8bdc1,#f7fbfa 55%,#c6d4d5);clip-path:polygon(36% 0,66% 1%,59% 100%,42% 100%);height:48px;left:1px;top:-42px;transform-origin:6px 48px;width:12px}.wind-blade--one{transform:rotate(0deg)}.wind-blade--two{transform:rotate(120deg)}.wind-blade--three{transform:rotate(240deg)}.wind-house{background:linear-gradient(90deg,#dfe9df,#f6f1d8);border-radius:2px;bottom:17px;height:19px;left:8px;width:22px}.wind-house i{background:#f2ead3;clip-path:polygon(50% 0,100% 100%,0 100%);height:12px;left:-3px;top:-10px;width:28px}.wind-house b{background:#317395;border-radius:1px;bottom:5px;height:7px;left:4px;width:5px}.wind-tree{bottom:14px;height:35px;right:4px;width:21px}.wind-tree i{background:#9a5934;bottom:0;height:12px;left:8px;width:5px}.wind-tree b,.wind-tree em{background:linear-gradient(145deg,#69d93e,#168c38);clip-path:polygon(50% 0,100% 100%,0 100%);height:22px;left:0;top:8px;width:21px}.wind-tree em{background:linear-gradient(145deg,#8be246,#239940);height:19px;left:2px;top:0;width:18px}
  .solar-panel{background:linear-gradient(rgba(95,198,255,.32) 1px,transparent 1px),linear-gradient(90deg,rgba(95,198,255,.32) 1px,transparent 1px),linear-gradient(145deg,#17618b,#092d52);background-size:12px 12px;border:2px solid #6b91a4;box-shadow:0 5px 0 #071b29,0 8px 12px rgba(0,0,0,.3);height:31px;top:22px;transform:rotateX(48deg) rotateZ(-6deg);width:48px}.solar-panel--one{left:1px}.solar-panel--two{right:-3px;top:30px}.solar-stand{background:linear-gradient(90deg,#7d9997,#d9ebe5);bottom:12px;height:33px;width:5px}.solar-stand--one{left:25px}.solar-stand--two{right:20px}
  .park-island{background:linear-gradient(145deg,#4ebd72,#1e784b);border:3px solid #61ce83;border-radius:50% 42% 48% 38%;bottom:7px;height:43px;left:7px;transform:rotateX(64deg);width:76px}.park-pond{background:#39a9c3;border:2px solid #79d7d9;border-radius:50%;bottom:17px;height:15px;left:14px;transform:rotateX(60deg);width:25px}.park-tree i,.school-tree i{background:#76523a;bottom:8px;height:27px;left:10px;width:6px}.park-tree b,.school-tree b{background:radial-gradient(circle at 35% 25%,#85e59c,#2f9c57 65%,#12643c);border-radius:48% 53% 44% 58%;height:30px;left:0;top:0;width:28px}.park-tree{height:50px;width:30px}.park-tree--one{bottom:20px;left:38px}.park-tree--two{bottom:14px;left:59px;transform:scale(.76)}.park-tree--three{bottom:12px;left:20px;transform:scale(.66)}.park-bench{background:#d1a36b;bottom:17px;height:5px;left:49px;transform:rotate(-12deg);width:22px}
  .charger-pad{background:#315d52;border:2px solid #4ea685;bottom:7px;height:34px;left:9px;transform:rotateX(62deg);width:72px}.charger-canopy{background:linear-gradient(145deg,#66d4c9,#167c78);border-radius:5px;height:16px;left:9px;top:17px;transform:skewX(-18deg);width:66px}.charger-canopy i,.charger-canopy b{background:#b5d8d1;bottom:-39px;height:40px;width:5px}.charger-canopy i{left:8px}.charger-canopy b{right:8px}.charger-post{background:linear-gradient(90deg,#dff8f0,#6f9690);border-radius:4px;bottom:16px;height:32px;width:14px}.charger-post--one{left:24px}.charger-post--two{right:18px}.charger-post i{background:#45e0b0;border-radius:2px;height:8px;left:3px;top:5px;width:8px;box-shadow:0 0 7px #37e58f}
  .eco-building{bottom:10px;height:47px;left:15px;transform-style:preserve-3d;width:58px}.cube-front{background:linear-gradient(145deg,#d4e8df,#78a69a);border-radius:5px;inset:0;transform:translateZ(12px)}.cube-side{background:#547d73;height:100%;right:-12px;top:6px;transform:skewY(-28deg);width:14px}.cube-top{background:#a8c9bc;height:19px;left:6px;top:-12px;transform:skewX(-32deg);width:57px}.model-window{background:#bdf8d5;border-radius:2px;box-shadow:0 0 8px rgba(90,255,173,.4);height:11px;left:10px;top:13px;width:16px}.model-window--two{left:32px}.recycling-building .cube-front{background:linear-gradient(145deg,#a9d7b0,#4d9464)}.recycling-stack{background:linear-gradient(90deg,#567d72,#c4d9d1);bottom:53px;height:25px;left:60px;width:9px}.recycling-bin{background:#36a969;border-radius:3px;bottom:9px;height:17px;width:14px}.recycling-bin--one{left:8px}.recycling-bin--two{background:#3b98bd;right:5px}
  .school-yard{background:#3f9a62;border-radius:50%;bottom:5px;height:38px;left:2px;transform:rotateX(63deg);width:82px}.school-building{left:8px;width:62px}.school-building .cube-front{background:linear-gradient(145deg,#d9e7df,#83a79a)}.school-building .cube-top{background:#5f9d73}.school-wing{background:linear-gradient(#c9ddd5,#71978b);border-radius:3px;bottom:12px;height:26px;right:1px;transform:skewY(-12deg);width:28px}.school-tree{bottom:13px;height:47px;right:4px;transform:scale(.64);width:28px}
  .city3d-page--night .model-window,.city3d-page--night .model-window3d{background:#ffe28a;box-shadow:0 0 12px #ffc95b}.city3d-page--night .charger-post i,.city3d-page--night .wind-house b{background:#ffe28a;box-shadow:0 0 11px #ffc95b}.city3d-page--night .eco-building{filter:drop-shadow(0 0 9px rgba(86,151,255,.2))}.city3d-page--night .lowpoly{filter:drop-shadow(0 9px 8px rgba(0,0,0,.45)) brightness(.9) saturate(.92)}.city3d-page--day .lowpoly{filter:drop-shadow(-8px 10px 6px rgba(0,0,0,.25)) brightness(1.1) saturate(1.08)}
  .city3d-edit-toolbar{align-items:center;background:rgba(4,13,13,.94);border:1px solid rgba(55,229,143,.35);border-radius:10px;display:flex;gap:6px;left:50%;padding:7px;position:absolute;top:12px;transform:translateX(-50%);z-index:180}.city3d-edit-toolbar strong{color:#f4fff9;font-size:9px;padding:0 5px}.city3d-edit-toolbar button{background:rgba(55,229,143,.1);border:1px solid rgba(55,229,143,.3);border-radius:6px;color:#37e58f;cursor:pointer;font-size:8px;font-weight:900;padding:6px 8px}.city3d-edit-toolbar .city3d-warehouse-action{border-color:rgba(245,184,75,.35);color:#f5b84b}.city3d-edit-toolbar .city3d-sell-action{background:rgba(255,92,78,.1);border-color:rgba(255,92,78,.48);color:#ff796c}
  .city3d-sell-overlay{align-items:center;background:rgba(2,8,9,.48);backdrop-filter:blur(2px);display:flex;inset:0;justify-content:center;padding:12px;position:fixed;z-index:1200}.city3d-sell-dialog{background:#0a1615;border:1px solid rgba(255,111,94,.3);border-radius:10px;box-shadow:0 14px 38px rgba(0,0,0,.46);max-width:310px;padding:14px;width:min(86vw,310px)}.city3d-sell-dialog h2{color:#f5fff9;font-size:16px;letter-spacing:-.02em;margin:0}.city3d-sell-dialog p{color:#91a59f;font-size:9px;line-height:1.4;margin:6px 0 12px}.city3d-sell-dialog p strong{color:#f5b84b}.city3d-sell-dialog-actions{display:grid;gap:7px;grid-template-columns:1fr 1fr}.city3d-sell-dialog-actions button{background:#142220;border:1px solid rgba(113,142,135,.28);border-radius:7px;color:#b4c7c1;cursor:pointer;font-size:9px;font-weight:900;height:31px}.city3d-sell-dialog-actions .city3d-sell-confirm{background:#df5849;border-color:#ff796c;color:#fff}.city3d-sell-dialog-actions .city3d-sell-confirm:hover{background:#f36b5b}
  @keyframes city3d-sell-away{to{opacity:0;transform:translate(-50%,-76%) scale(.08) rotate(8deg)}}
  .city3d-instruction{background:rgba(4,13,13,.78);border:1px solid rgba(142,165,160,.2);border-radius:999px;bottom:12px;color:#81968f;font-size:8px;left:12px;padding:7px 10px;pointer-events:none;position:absolute;z-index:160}.city3d-legend{align-items:center;display:flex;gap:15px;min-height:38px;padding:6px 13px}.city3d-legend span{align-items:center;color:#81968f;display:flex;font-size:8px;gap:5px}.city3d-legend i{border:1px solid #719188;border-radius:2px;height:8px;width:8px}.city3d-legend span:first-child i{background:#f5b84b;border:0}.city3d-legend strong{color:#dff6ed;font-size:8px;margin-left:auto}
  .city3d-palette{display:flex;flex-direction:column;gap:9px;max-height:760px;overflow:auto;padding:12px}.city3d-palette-heading{align-items:center;display:flex;justify-content:space-between}.city3d-palette-heading h2{color:#f4fff9;font-size:17px;margin:3px 0 0}.city3d-palette-heading>span{color:#f5b84b;font-size:9px;font-weight:900}
  .city3d-warehouse{background:rgba(56,189,248,.06);border:1px solid rgba(56,189,248,.2);border-radius:9px;display:grid;gap:7px;padding:8px}.city3d-warehouse>div:first-child{display:flex;justify-content:space-between}.city3d-warehouse>div:first-child strong{color:#6dd5ff;font-size:9px}.city3d-warehouse>div:first-child span,.city3d-warehouse p{color:#7f958e;font-size:7px;margin:0}.city3d-warehouse-list{display:grid;gap:5px;grid-template-columns:repeat(2,minmax(0,1fr))}.city3d-warehouse-card{align-items:center;background:#0a1817;border:1px solid rgba(112,142,134,.2);border-radius:7px;color:#eafff5;cursor:grab;display:grid;grid-template-columns:54px minmax(0,1fr);min-width:0;padding:4px;text-align:left}.city3d-warehouse-card--selected{border-color:#37e58f}.city3d-warehouse-card>span:last-child{display:grid;min-width:0}.city3d-warehouse-card strong{font-size:7px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.city3d-warehouse-card small{color:#789088;font-size:6px}
  .city3d-palette-label{border-top:1px solid rgba(93,119,113,.18);color:#8da39c;font-size:8px;font-weight:900;padding-top:9px;text-transform:uppercase}.city3d-palette-list{display:grid;gap:6px}.city3d-palette-card{align-items:center;background:linear-gradient(145deg,rgba(17,30,29,.96),rgba(9,19,18,.96));border:1px solid rgba(91,119,112,.2);border-radius:9px;color:#f4fff9;cursor:grab;display:grid;gap:7px;grid-template-columns:66px minmax(0,1fr) auto;min-height:70px;padding:5px 8px;text-align:left;transition:border-color .18s ease,transform .18s ease}.city3d-palette-card:hover,.city3d-palette-card--selected{border-color:var(--building-color);transform:translateX(-2px)}.city3d-palette-copy{display:grid;gap:3px;min-width:0}.city3d-palette-copy strong{font-size:9px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.city3d-palette-copy small{color:#799088;font-size:7px}.city3d-cost{align-items:center;color:#f5b84b;display:flex;font-size:9px;font-weight:900;gap:3px}.city3d-cost i{border:2px solid #f5b84b;border-radius:50%;height:9px;width:9px}.city3d-cost--locked{color:#657b74}.city3d-cost--locked i{border-color:#657b74}.city3d-selected-detail{background:rgba(55,229,143,.05);border:1px solid rgba(55,229,143,.15);border-radius:8px;padding:9px}.city3d-selected-detail strong{color:#37e58f;font-size:9px}.city3d-selected-detail p{color:#81968f;font-size:7px;line-height:1.5;margin:4px 0 0}
  .city3d-page{box-sizing:border-box;height:100dvh;min-height:0;overflow:hidden;padding:68px 18px 76px}.city3d-frame{box-sizing:border-box;display:flex;flex-direction:column;height:100%;padding:12px}.city3d-header{flex:0 0 auto;padding:1px 3px 9px}.city3d-header h1{font-size:clamp(24px,2.5vw,34px)}.city3d-header>div:first-child>span{font-size:10px;margin-top:3px}.city3d-sun-status{padding:6px 9px}.city3d-store-toggle{min-height:36px}.city3d-summary{flex:0 0 auto;margin-bottom:8px;padding:6px}.city3d-stat{gap:2px;padding:6px 9px}.city3d-stat strong{font-size:16px}.city3d-stage{gap:3px;padding:6px 9px}.city3d-workspace{flex:1;min-height:0}.city3d-map-panel{display:flex;flex-direction:column;min-height:0}.city3d-map-heading{flex:0 0 auto;min-height:46px;padding:6px 11px}.city3d-field{flex:1;height:auto;min-height:0}.city3d-world{width:min(68%,570px)}.city3d-legend{flex:0 0 auto;min-height:30px;padding:3px 11px}.city3d-palette{height:100%;max-height:none;min-height:0;overflow:auto;padding:9px}.city3d-palette-card{min-height:62px}.city3d-palette-list{gap:5px}
  @media(max-width:1100px){.city3d-workspace--store{grid-template-columns:minmax(0,1fr) minmax(235px,285px)}.city3d-world{width:min(74%,540px)}.city3d-palette-card{grid-template-columns:54px minmax(0,1fr) auto;min-height:58px}.city3d-palette-card .lowpoly--compact{transform:scale(.62) rotateY(14deg);transform-origin:center}.city3d-warehouse-list{grid-template-columns:1fr}.city3d-selected-detail{padding:7px}}
  @media(max-width:760px){.city3d-page{padding:60px 7px 70px}.city3d-frame{border-radius:12px;padding:7px}.city3d-header{gap:7px}.city3d-header>div:first-child>span{display:none}.city3d-header h1{font-size:21px}.city3d-header-actions{gap:5px}.city3d-sun-status{padding:5px 7px}.city3d-store-toggle{min-height:32px;padding:0 9px}.city3d-summary{gap:4px;grid-template-columns:repeat(3,1fr)}.city3d-stage{display:none}.city3d-stat{padding:5px}.city3d-stat span{font-size:7px}.city3d-stat strong{font-size:13px}.city3d-workspace--store{grid-template-columns:minmax(0,1fr);grid-template-rows:minmax(0,1fr) 128px}.city3d-map-heading{min-height:38px}.city3d-map-heading>div:first-child{display:none}.city3d-message{max-width:none;width:100%}.city3d-world{width:88%}.city3d-palette{display:grid;gap:5px;grid-template-columns:auto minmax(0,1fr);grid-template-rows:auto minmax(0,1fr);overflow:hidden}.city3d-palette-heading{grid-column:1/-1}.city3d-warehouse,.city3d-palette-label,.city3d-selected-detail{display:none}.city3d-palette-list{display:flex;grid-column:1/-1;overflow-x:auto;padding-bottom:3px;scrollbar-width:none}.city3d-palette-list::-webkit-scrollbar{display:none}.city3d-palette-card{flex:0 0 205px;min-height:56px}.city3d-legend{min-height:25px}.city3d-sky-orb{height:46px;width:46px}.city3d-instruction{bottom:7px;left:7px;max-width:78%}}
`;
