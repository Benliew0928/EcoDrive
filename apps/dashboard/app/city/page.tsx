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
      setSelectedInfrastructureId(null);
      setMessage({ kind: "success", text: "Infrastructure deselected." });
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
            <SummaryStat label="EcoCoins" value={walletCoins.toLocaleString()} tone="amber" coin />
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
                    <button className="city3d-done-action" onClick={(event) => {
                      event.stopPropagation();
                      setSelectedInfrastructureId(null);
                      setMessage({ kind: "success", text: "Done editing. Infrastructure deselected." });
                    }} type="button">✓ Done</button>
                  </div>
                ) : null}

                <div className="city3d-instruction">{storeOpen ? "Drag from the palette, or tap an item then tap the terrain" : "Drag left/right to turn · up/down to tilt"}</div>
              </div>

              <footer className="city3d-legend"><span><i /> Synergy bonus</span><span><i /> Auto-saved</span><strong>{infrastructure.length} assets placed</strong></footer>
            </section>

            {storeOpen ? (
              <aside className="city3d-palette" aria-label="Infrastructure Store">
                <div className="city3d-palette-heading"><div><small>Infrastructure</small><h2>Eco Store</h2></div><span className="city3d-palette-coins"><CityEcoCoin size={16} />{walletCoins.toLocaleString()} coins</span></div>

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
                        <span className={affordable ? "city3d-cost" : "city3d-cost city3d-cost--locked"}><CityEcoCoin size={14} />{building.cost}</span>
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
            <p>You will receive <strong><CityEcoCoin size={12} />{(cityBuildingMap[sellCandidate.buildingId].cost * 0.5).toLocaleString()} EcoCoins</strong> back.</p>
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

function SummaryStat({ label, value, tone, coin }: { label: string; value: string; tone: "amber" | "green" | "cyan"; coin?: boolean }) {
  return <div className={`city3d-stat city3d-stat--${tone}`}><span>{label}</span><strong>{coin ? <><CityEcoCoin size={18} />{value}</> : value}</strong></div>;
}

function CityEcoCoin({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ verticalAlign: "middle", flexShrink: 0 }}>
      <circle cx="12" cy="12" r="11" fill="url(#cCoinOuter)" stroke="#EAB308" strokeWidth="0.5" />
      <circle cx="12" cy="12" r="8.5" fill="url(#cCoinInner)" stroke="#CA8A04" strokeWidth="0.5" />
      <g transform="translate(4.5, 4.5) scale(0.62)">
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5 1 8a7 7 0 0 1-9 10Z" fill="url(#cCoinLeaf)" stroke="#9A3412" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 22v-4h-4" stroke="#9A3412" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <defs>
        <linearGradient id="cCoinOuter" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE047" /><stop offset="50%" stopColor="#EAB308" /><stop offset="100%" stopColor="#A16207" />
        </linearGradient>
        <linearGradient id="cCoinInner" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#EAB308" /><stop offset="50%" stopColor="#CA8A04" /><stop offset="100%" stopColor="#854D0E" />
        </linearGradient>
        <linearGradient id="cCoinLeaf" x1="0" y1="0" x2="20" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF08A" /><stop offset="50%" stopColor="#FDE047" /><stop offset="100%" stopColor="#CA8A04" />
        </linearGradient>
      </defs>
    </svg>
  );
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
      style={{ left: `${item.x}%`, top: `${item.y}%`, transform: `translate(-50%, -96%) scale(${depthScale})`, zIndex: Math.round(item.y) + 20, "--model-rotation": `${item.rotation}deg`, "--building-color": building.color } as CSSProperties}
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
      {buildingId === "wind" ? (
        <>
          <ModelBox className="wind-platform3d" />
          <ModelBox className="wind-tower3d" />
          <ModelBox className="wind-nacelle3d" />
          <span className="wind-rotor3d">
            <ModelBox className="wind-hub3d" />
            <ModelBox className="wind-blade3d wind-blade3d--one" />
            <ModelBox className="wind-blade3d wind-blade3d--two" />
            <ModelBox className="wind-blade3d wind-blade3d--three" />
          </span>
          <ModelTree className="wind-tree3d" />
        </>
      ) : null}
      {buildingId === "solar" ? (
        <>
          <ModelBox className="solar-pad3d" />
          <ModelBox className="solar-stand3d solar-stand3d--one" />
          <ModelBox className="solar-stand3d solar-stand3d--two" />
          <ModelBox className="solar-stand3d solar-stand3d--three" />
          <ModelBox className="solar-stand3d solar-stand3d--four" />
          <ModelBox className="solar-panel3d solar-panel3d--one" />
          <ModelBox className="solar-panel3d solar-panel3d--two" />
        </>
      ) : null}
      {buildingId === "park" ? (
        <>
          <ModelBox className="park-platform3d" />
          <ModelBox className="park-path3d park-path3d--one" />
          <ModelBox className="park-path3d park-path3d--two" />
          <ModelBox className="park-fountain-base3d" />
          <ModelBox className="park-fountain-pillar3d" />
          <ModelBox className="park-fountain-water3d" />
          <ModelTree className="park-tree3d park-tree3d--one" />
          <ModelTree className="park-tree3d park-tree3d--two" />
          <ModelTree className="park-tree3d park-tree3d--three" />
          <ModelBox className="park-bench3d" />
          <ModelBox className="park-bush3d park-bush3d--one" />
          <ModelBox className="park-bush3d park-bush3d--two" />
        </>
      ) : null}
      {buildingId === "charger" ? (
        <>
          <ModelBox className="charger-pad3d" />
          <ModelBox className="charger-column3d charger-column3d--one" />
          <ModelBox className="charger-column3d charger-column3d--two" />
          <ModelBox className="charger-canopy3d" />
          <ModelBox className="charger-unit3d charger-unit3d--one" />
          <ModelBox className="charger-unit3d charger-unit3d--two" />
          <ModelBox className="charger-screen3d charger-screen3d--one" />
          <ModelBox className="charger-screen3d charger-screen3d--two" />
        </>
      ) : null}
      {buildingId === "recycling" ? (
        <>
          <ModelBox className="recycling-pad3d" />
          <ModelBox className="recycling-main-building3d" />
          <ModelBox className="recycling-side-building3d" />
          <ModelBox className="recycling-dock3d" />
          <ModelBox className="recycling-dock-door3d" />
          <ModelBox className="recycling-vent3d" />
          <ModelBox className="recycling-chimney3d" />
          <ModelBox className="recycling-bin3d recycling-bin3d--blue" />
          <ModelBox className="recycling-bin3d recycling-bin3d--green" />
          <ModelBox className="recycling-bin3d recycling-bin3d--yellow" />
        </>
      ) : null}
      {buildingId === "school" ? (
        <>
          <ModelBox className="school-yard3d" />
          <ModelBox className="school-ground-floor3d" />
          <ModelBox className="school-first-floor3d" />
          <ModelBox className="school-step3d school-step3d--bottom" />
          <ModelBox className="school-step3d school-step3d--top" />
          <ModelBox className="school-window-frame3d school-window-frame3d--one" />
          <ModelBox className="school-window-frame3d school-window-frame3d--two" />
          <ModelBox className="school-window-frame3d school-window-frame3d--three" />
          <ModelBox className="school-window-frame3d school-window-frame3d--four" />
          <ModelBox className="school-roof-solar3d school-roof-solar3d--one" />
          <ModelBox className="school-roof-solar3d school-roof-solar3d--two" />
          <ModelTree className="school-tree3d school-tree3d--one" />
          <ModelTree className="school-tree3d school-tree3d--two" />
        </>
      ) : null}
    </span>
  );
}

function ModelBox({ className }: { className: string }) {
  return <span className={`model-box ${className}`}><i className="model-face model-face--front" /><i className="model-face model-face--back" /><i className="model-face model-face--left" /><i className="model-face model-face--right" /><i className="model-face model-face--top" /><i className="model-face model-face--bottom" /></span>;
}

function ModelTree({ className }: { className: string }) {
  return (
    <span className={`model-tree3d ${className}`}>
      <ModelBox className="model-tree-trunk3d" />
      <ModelBox className="model-tree-foliage3d model-tree-foliage3d--base" />
      <ModelBox className="model-tree-foliage3d model-tree-foliage3d--mid" />
      <ModelBox className="model-tree-foliage3d model-tree-foliage3d--top" />
    </span>
  );
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
}const styleSheet = `
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
  .city3d-field { background: linear-gradient(180deg,#48afe0 0%,#8ed5e8 48%,#174239 100%); cursor: grab; height: clamp(480px,58vw,680px); overflow: hidden; perspective: 980px; position: relative; touch-action: none; transition: background .8s ease,box-shadow .2s ease; transform-style: preserve-3d; }
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

  /* Assets container & uprights */
  .city3d-asset { background:transparent;border:0;height:108px;padding:0;position:absolute;transform-origin:center bottom;width:108px;transform-style:preserve-3d}
  .city3d-asset--locked{pointer-events:none}
  .city3d-asset--editable{cursor:grab}
  .city3d-asset--editable::after{content:"";position:absolute;inset:-10px;border-radius:12px;z-index:1}
  .city3d-asset--editable:hover::after{background:rgba(55,229,143,.08);border:1px dashed rgba(55,229,143,.35)}
  .city3d-asset--selected .city3d-asset-shadow{background:rgba(55,229,143,.5);box-shadow:0 0 18px 6px rgba(55,229,143,.45);filter:blur(8px)}
  .city3d-asset--selling{animation:city3d-sell-away .24s cubic-bezier(.4,0,.8,.2) forwards;pointer-events:none}
  .city3d-asset-shadow { background:rgba(0,0,0,.35);border-radius:50%;bottom:0;filter:blur(6px);height:20px;left:14px;position:absolute;transform:translateZ(-2px);width:80px;opacity:0.85}
  .city3d-asset-upright{bottom:0;height:108px;left:0;pointer-events:none;position:absolute;transform:rotateX(-90deg) rotateY(var(--model-rotation,0deg));transform-origin:center bottom;transform-style:preserve-3d;width:108px;transition:transform .35s cubic-bezier(.34,1.56,.64,1)}
  .city3d-asset-label{background:rgba(4,13,12,.88);border:1px solid rgba(178,218,205,.2);border-radius:999px;bottom:-1px;color:#eafff5;font-size:8px;font-weight:900;left:50%;padding:4px 8px;position:absolute;transform:translateX(-50%) translateZ(48px) rotateX(90deg);white-space:nowrap}
  .city3d-bonus{background:#f5b84b;border-radius:999px;color:#171006;font-size:6px;font-weight:950;padding:3px 5px;position:absolute;right:0;top:6px;transform:translateZ(54px) rotateX(90deg)}

  /* LowPoly structure */
  .lowpoly { bottom:0;display:block;height:88px;left:10px;position:absolute;transform:scale(1.25);transform-origin:center bottom;transform-style:preserve-3d;width:88px}
  .lowpoly-ground{background:radial-gradient(ellipse,rgba(0,0,0,.42),transparent 68%);bottom:-2px;filter:blur(2px);height:18px;left:4px;transform:rotateX(74deg) translateZ(-6px);width:80px}
  .lowpoly--compact{bottom:auto;height:62px;left:auto;position:relative;transform:scale(.74) rotateX(-30deg) rotateY(35deg);transform-origin:center;transform-style:preserve-3d;width:76px}
  .lowpoly--compact .lowpoly-ground{bottom:0}

  /* Model Box primitive */
  .model-box{--box-d:16px;--box-h:20px;--box-w:20px;--face-back:#41675d;--face-bottom:#29473f;--face-front:#8cb9aa;--face-left:#517d70;--face-right:#3e655a;--face-top:#c7ded5;height:var(--box-h);position:absolute;transform-style:preserve-3d;width:var(--box-w)}
  .model-face{backface-visibility:hidden;display:block;position:absolute;box-shadow:inset 0 0 10px rgba(0,0,0,0.05)}
  .model-face--front,.model-face--back,.model-face--left,.model-face--right {
    background-image:linear-gradient(to top, rgba(0,0,0,0.22) 0%, transparent 60%);
    background-blend-mode:multiply;
  }
  .model-face--front,.model-face--back{height:var(--box-h);left:0;top:0;width:var(--box-w)}
  .model-face--front{background-color:var(--face-front);transform:translateZ(calc(var(--box-d) * .5))}
  .model-face--back{background-color:var(--face-back);transform:rotateY(180deg) translateZ(calc(var(--box-d) * .5))}
  .model-face--left,.model-face--right{height:var(--box-h);left:calc((var(--box-w) - var(--box-d)) * .5);top:0;width:var(--box-d)}
  .model-face--left{background-color:var(--face-left);transform:rotateY(-90deg) translateZ(calc(var(--box-w) * .5))}
  .model-face--right{background-color:var(--face-right);transform:rotateY(90deg) translateZ(calc(var(--box-w) * .5))}
  .model-face--top,.model-face--bottom{height:var(--box-d);left:0;top:calc((var(--box-h) - var(--box-d)) * .5);width:var(--box-w)}
  .model-face--top{background:var(--face-top);transform:rotateX(90deg) translateZ(calc(var(--box-h) * .5))}
  .model-face--bottom{background:var(--face-bottom);transform:rotateX(-90deg) translateZ(calc(var(--box-h) * .5))}

  /* 3D rounded foliage trees */
  .model-tree3d { height:52px; transform-style:preserve-3d; width:28px; position:absolute; }
  .model-tree-trunk3d {
    --box-d: 5px; --box-h: 22px; --box-w: 5px;
    --face-front: #805333; --face-left: #5c3b24; --face-right: #4d311d; --face-top: #a6724b;
    bottom: 0px; left: 11px; transform: translateZ(0);
  }
  .model-tree-foliage3d {
    --face-front: #2b7d41; --face-left: #1b592d; --face-right: #164a25; --face-top: #4caf50;
  }
  .model-tree-foliage3d--base {
    --box-d: 22px; --box-h: 16px; --box-w: 22px;
    bottom: 14px; left: 3px; transform: translateZ(0);
  }
  .model-tree-foliage3d--mid {
    --box-d: 18px; --box-h: 12px; --box-w: 18px;
    bottom: 24px; left: 5px; transform: rotateY(45deg);
  }
  .model-tree-foliage3d--top {
    --box-d: 12px; --box-h: 10px; --box-w: 12px;
    bottom: 32px; left: 8px; transform: translateZ(0);
  }

  /* Wind Turbine */
  .wind-platform3d {
    --box-d: 60px; --box-h: 8px; --box-w: 60px;
    --face-front: #159348; --face-left: #0c7137; --face-right: #095e30;
    --face-top: linear-gradient(135deg, #75dc66, #2dae50);
    bottom: 0px; left: 14px; transform: translateZ(0);
  }
  .wind-tower3d {
    --box-d: 6px; --box-h: 70px; --box-w: 6px;
    --face-front: #e9f0f0; --face-left: #c2d2d4; --face-right: #aabebf; --face-back: #c2d2d4; --face-top: #f7fbf8;
    bottom: 8px; left: 41px; transform: translateZ(0);
  }
  .wind-nacelle3d {
    --box-d: 22px; --box-h: 12px; --box-w: 14px;
    --face-front: #e0eaea; --face-left: #b8c8c9; --face-right: #a0b2b3; --face-back: #8fa0a1; --face-top: #ffffff;
    bottom: 78px; left: 37px; transform: translateZ(-2px);
  }
  .wind-rotor3d {
    position: absolute; bottom: 82px; left: 40px; width: 0; height: 0;
    transform-style: preserve-3d;
    transform: translateZ(10px);
    animation: spin-rotor 3.6s linear infinite;
  }
  @keyframes spin-rotor {
    from { transform: translateZ(10px) rotateZ(0deg); }
    to { transform: translateZ(10px) rotateZ(360deg); }
  }
  .wind-hub3d {
    --box-d: 8px; --box-h: 8px; --box-w: 8px;
    --face-front: #ffffff; --face-left: #d5e2e3; --face-right: #b2c5c7; --face-top: #ffffff;
    left: -4px; bottom: -4px; transform: translateZ(0);
  }
  .wind-blade3d {
    --box-d: 2px; --box-h: 36px; --box-w: 4px;
    --face-front: #ffffff; --face-left: #cbdad9; --face-right: #cbdad9; --face-top: #ffffff;
    left: -2px; bottom: 4px; transform-origin: center bottom;
  }
  .wind-blade3d--one { transform: translateZ(2px); }
  .wind-blade3d--two { transform: translateZ(2px) rotateZ(120deg); }
  .wind-blade3d--three { transform: translateZ(2px) rotateZ(240deg); }
  .wind-tree3d { bottom: 8px; left: 18px; transform: scale(0.65) translateZ(12px); }

  /* Solar Farm */
  .solar-pad3d {
    --box-d: 64px; --box-h: 6px; --box-w: 76px;
    --face-front: #3d4a46; --face-left: #2d3835; --face-right: #232c29; --face-top: #52635e;
    bottom: 0px; left: 6px;
  }
  .solar-stand3d {
    --box-d: 3px; --box-h: 18px; --box-w: 3px;
    --face-front: #b5cbc7; --face-left: #718d88; --face-right: #58746f; --face-top: #e6f3ef;
    bottom: 6px;
  }
  .solar-stand3d--one { left: 18px; transform: translateZ(-16px); }
  .solar-stand3d--two { left: 18px; transform: translateZ(16px); }
  .solar-stand3d--three { left: 58px; transform: translateZ(-16px); }
  .solar-stand3d--four { left: 58px; transform: translateZ(16px); }
  .solar-panel3d {
    --box-d: 42px; --box-h: 4px; --box-w: 32px;
    --face-front: #0f1c24; --face-left: #243b4a; --face-right: #1b2d38; --face-back: #0f1c24;
    --face-top: linear-gradient(rgba(83,190,255,.42) 2px,transparent 2px), linear-gradient(90deg,rgba(83,190,255,.42) 2px,transparent 2px), linear-gradient(145deg,#176f9d,#092d52);
    bottom: 20px; transform: rotateX(-22deg);
  }
  .solar-panel3d--one { left: 10px; }
  .solar-panel3d--two { left: 46px; }
  .solar-panel3d .model-face--top { background-size: 8px 8px, 8px 8px, auto; }

  /* EV Charger */
  .charger-pad3d {
    --box-d: 64px; --box-h: 5px; --box-w: 76px;
    --face-front: #1c2624; --face-left: #121a18; --face-right: #0f1413;
    --face-top: linear-gradient(90deg, transparent 46%, #ffffff 46%, #ffffff 54%, transparent 54%), #2d3835;
    bottom: 0px; left: 6px;
  }
  .charger-pad3d .model-face--top { background-size: 20px 100%; background-repeat: no-repeat; background-position: center; }
  .charger-column3d {
    --box-d: 6px; --box-h: 44px; --box-w: 6px;
    --face-front: #edf3f2; --face-left: #879e9a; --face-right: #6c8480; --face-top: #ffffff;
    bottom: 5px;
  }
  .charger-column3d--one { left: 12px; transform: translateZ(0); }
  .charger-column3d--two { left: 70px; transform: translateZ(0); }
  .charger-canopy3d {
    --box-d: 56px; --box-h: 6px; --box-w: 74px;
    --face-front: #27ae8f; --face-left: #1b8069; --face-right: #166d59;
    --face-top: linear-gradient(135deg, #4ef0c6, #219b7d);
    bottom: 49px; left: 7px; transform: translateZ(0);
  }
  .charger-unit3d {
    --box-d: 12px; --box-h: 26px; --box-w: 12px;
    --face-front: #edf3f2; --face-left: #78938d; --face-right: #5b7771; --face-top: #effaf7;
    bottom: 5px;
  }
  .charger-unit3d--one { left: 24px; transform: translateZ(-8px); }
  .charger-unit3d--two { left: 52px; transform: translateZ(-8px); }
  .charger-screen3d {
    --box-d: 2px; --box-h: 8px; --box-w: 8px;
    --face-front: #40f3b0; --face-left: #1a6d4e; --face-right: #1a6d4e; --face-top: #ffffff;
    bottom: 18px; box-shadow: 0 0 10px #37e58f;
  }
  .charger-screen3d--one { left: 26px; transform: translateZ(-6px); }
  .charger-screen3d--two { left: 54px; transform: translateZ(-6px); }

  /* Park */
  .park-platform3d {
    --box-d: 78px; --box-h: 8px; --box-w: 78px;
    --face-front: #2b7d4a; --face-left: #1b5c34; --face-right: #144627;
    --face-top: linear-gradient(135deg, #62cc71, #2da84a);
    bottom: 0px; left: 5px;
  }
  .park-path3d {
    --box-d: 14px; --box-h: 2px; --box-w: 78px;
    --face-front: #5c5549; --face-left: #474239; --face-right: #474239; --face-top: #e0d5c1;
    bottom: 8px;
  }
  .park-path3d--one { left: 5px; transform: translateZ(10px); }
  .park-path3d--two { left: 5px; --box-w: 14px; --box-d: 78px; left: 28px; transform: translateZ(0); }
  .park-fountain-base3d {
    --box-d: 26px; --box-h: 6px; --box-w: 26px;
    --face-front: #7b8f8a; --face-left: #5c6e69; --face-right: #4b5955; --face-top: #5fc5cf;
    bottom: 10px; left: 46px; transform: translateZ(-16px);
  }
  .park-fountain-pillar3d {
    --box-d: 6px; --box-h: 12px; --box-w: 6px;
    --face-front: #7b8f8a; --face-left: #5c6e69; --face-right: #4b5955; --face-top: #ffffff;
    bottom: 16px; left: 56px; transform: translateZ(-16px);
  }
  .park-fountain-water3d {
    --box-d: 14px; --box-h: 2px; --box-w: 14px;
    --face-front: #7ee0eb; --face-left: #4bbdc9; --face-right: #4bbdc9; --face-top: #aef3f9;
    bottom: 28px; left: 52px; transform: translateZ(-16px); box-shadow: 0 0 12px rgba(126,224,235,0.7);
  }
  .park-bench3d {
    --box-d: 8px; --box-h: 6px; --box-w: 18px;
    --face-front: #a8723c; --face-left: #754d26; --face-right: #5e3d1d; --face-top: #c2894f;
    bottom: 10px; left: 12px; transform: translateZ(16px) rotateY(45deg);
  }
  .park-bush3d {
    --box-d: 10px; --box-h: 9px; --box-w: 10px;
    --face-front: #297a47; --face-left: #1b5932; --face-right: #1b5932; --face-top: #42a164;
    bottom: 10px;
  }
  .park-bush3d--one { left: 12px; transform: translateZ(-18px) rotateY(25deg); }
  .park-bush3d--two { left: 62px; transform: translateZ(18px) rotateY(-35deg); }
  .park-tree3d--one { bottom: 10px; left: 38px; transform: translateZ(-12px); }
  .park-tree3d--two { bottom: 8px; left: 58px; transform: scale(.76) translateZ(18px); }
  .park-tree3d--three { bottom: 8px; left: 18px; transform: scale(.65) translateZ(-10px); }

  /* Recycling Centre */
  .recycling-pad3d {
    --box-d: 68px; --box-h: 6px; --box-w: 78px;
    --face-front: #4b5955; --face-left: #37423f; --face-right: #2d3634; --face-top: #697a75;
    bottom: 0px; left: 5px;
  }
  .recycling-main-building3d {
    --box-d: 34px; --box-h: 36px; --box-w: 40px;
    --face-front: #8ba994; --face-left: #5c7865; --face-right: #43594a; --face-top: #b5cbbb;
    bottom: 6px; left: 10px; transform: translateZ(-10px);
  }
  .recycling-side-building3d {
    --box-d: 26px; --box-h: 24px; --box-w: 20px;
    --face-front: #7b948b; --face-left: #4c6159; --face-right: #3b4c46; --face-top: #a5bdb4;
    bottom: 6px; left: 50px; transform: translateZ(-14px);
  }
  .recycling-dock3d {
    --box-d: 16px; --box-h: 12px; --box-w: 22px;
    --face-front: #707f7c; --face-left: #525e5b; --face-right: #424c4a; --face-top: #8d9e9a;
    bottom: 6px; left: 20px; transform: translateZ(15px);
  }
  .recycling-dock-door3d {
    --box-d: 2px; --box-h: 9px; --box-w: 14px;
    --face-front: #4a5452; --face-left: #313837; --face-right: #313837; --face-top: #707f7c;
    bottom: 6px; left: 24px; transform: translateZ(24px);
  }
  .recycling-vent3d {
    --box-d: 8px; --box-h: 6px; --box-w: 8px;
    --face-front: #cbd2d0; --face-left: #9ba1a0; --face-right: #818685; --face-top: #eff3f2;
    bottom: 30px; left: 56px; transform: translateZ(-10px);
  }
  .recycling-chimney3d {
    --box-d: 6px; --box-h: 26px; --box-w: 6px;
    --face-front: #bf8d75; --face-left: #8c634f; --face-right: #704f3e; --face-top: #4a362c;
    bottom: 42px; left: 16px; transform: translateZ(-10px);
  }
  .recycling-bin3d { --box-d: 10px; --box-h: 13px; --box-w: 10px; bottom: 6px; }
  .recycling-bin3d--blue { --face-front: #2563eb; --face-left: #1d4ed8; --face-right: #1e40af; --face-top: #60a5fa; left: 48px; transform: translateZ(12px); }
  .recycling-bin3d--green { --face-front: #16a34a; --face-left: #15803d; --face-right: #166534; --face-top: #4ade80; left: 60px; transform: translateZ(12px); }
  .recycling-bin3d--yellow { --face-front: #ca8a04; --face-left: #a16207; --face-right: #854d0e; --face-top: #fde047; left: 60px; transform: translateZ(-2px); }

  /* Eco School */
  .school-yard3d {
    --box-d: 74px; --box-h: 6px; --box-w: 78px;
    --face-front: #576b5d; --face-left: #3d4c42; --face-right: #323e35; --face-top: #7fa188;
    bottom: 0px; left: 5px;
  }
  .school-ground-floor3d {
    --box-d: 36px; --box-h: 22px; --box-w: 52px;
    --face-front: #cc7e64; --face-left: #9c5c47; --face-right: #824b38; --face-top: #e6b3a0;
    bottom: 6px; left: 10px; transform: translateZ(-12px);
  }
  .school-first-floor3d {
    --box-d: 28px; --box-h: 18px; --box-w: 44px;
    --face-front: #ebd8c8; --face-left: #bfaea0; --face-right: #9e8f82; --face-top: #ffffff;
    bottom: 28px; left: 14px; transform: translateZ(-12px);
  }
  .school-step3d { --face-front: #73807a; --face-left: #515c57; --face-right: #434d49; --face-top: #97a6a0; }
  .school-step3d--bottom { --box-d: 10px; --box-h: 3px; --box-w: 20px; left: 26px; bottom: 6px; transform: translateZ(10px); }
  .school-step3d--top { --box-d: 6px; --box-h: 3px; --box-w: 16px; left: 28px; bottom: 9px; transform: translateZ(8px); }
  .school-window-frame3d {
    --box-d: 2px; --box-h: 10px; --box-w: 10px;
    --face-front: #5cdafc; --face-left: #ffffff; --face-right: #ffffff; --face-top: #ffffff;
    box-shadow: 0 0 8px rgba(92,218,252,0.4);
  }
  .school-window-frame3d--one { left: 18px; bottom: 12px; transform: translateZ(7px); }
  .school-window-frame3d--two { left: 44px; bottom: 12px; transform: translateZ(7px); }
  .school-window-frame3d--three { left: 20px; bottom: 32px; transform: translateZ(3px); }
  .school-window-frame3d--four { left: 38px; bottom: 32px; transform: translateZ(3px); }
  .school-roof-solar3d {
    --box-d: 14px; --box-h: 3px; --box-w: 12px;
    --face-front: #101c24; --face-left: #2a3d4a; --face-right: #1b2a33;
    --face-top: linear-gradient(135deg, #176f9d, #092d52);
    bottom: 46px; transform: translateZ(-12px) rotateX(-15deg);
  }
  .school-roof-solar3d--one { left: 18px; }
  .school-roof-solar3d--two { left: 32px; }
  .school-tree3d { bottom: 6px; }
  .school-tree3d--one { left: 64px; transform: scale(0.68) translateZ(-14px); }
  .school-tree3d--two { left: 64px; transform: scale(0.58) translateZ(16px); }

  /* Night Mode and Palette card adjustments */
  .city3d-page--night .school-window-frame3d, .city3d-page--night .charger-screen3d {
    --face-front: #ffde83;
    box-shadow: 0 0 12px #ffc95b;
  }
  .city3d-page--night .lowpoly{filter:drop-shadow(0 9px 8px rgba(0,0,0,.45)) brightness(.9) saturate(.92)}.city3d-page--day .lowpoly{filter:drop-shadow(-8px 10px 6px rgba(0,0,0,.25)) brightness(1.1) saturate(1.08)}
  .city3d-edit-toolbar{align-items:center;background:rgba(4,13,13,.94);border:1px solid rgba(55,229,143,.35);border-radius:10px;display:flex;gap:6px;left:50%;padding:7px;position:absolute;top:12px;transform:translateX(-50%);z-index:180}.city3d-edit-toolbar strong{color:#f4fff9;font-size:9px;padding:0 5px}.city3d-edit-toolbar button{background:rgba(55,229,143,.1);border:1px solid rgba(55,229,143,.3);border-radius:6px;color:#37e58f;cursor:pointer;font-size:8px;font-weight:900;padding:6px 8px}.city3d-edit-toolbar .city3d-warehouse-action{border-color:rgba(245,184,75,.35);color:#f5b84b}.city3d-edit-toolbar .city3d-sell-action{background:rgba(255,92,78,.1);border-color:rgba(255,92,78,.48);color:#ff796c}.city3d-edit-toolbar .city3d-done-action{background:rgba(55,229,143,.22);border-color:rgba(55,229,143,.7);color:#37e58f}
  .city3d-sell-overlay{align-items:center;background:rgba(2,8,9,.48);backdrop-filter:blur(2px);display:flex;inset:0;justify-content:center;padding:12px;position:fixed;z-index:1200}.city3d-sell-dialog{background:#0a1615;border:1px solid rgba(255,111,94,.3);border-radius:10px;box-shadow:0 14px 38px rgba(0,0,0,.46);max-width:310px;padding:14px;width:min(86vw,310px)}.city3d-sell-dialog h2{color:#f5fff9;font-size:16px;letter-spacing:-.02em;margin:0}.city3d-sell-dialog p{color:#91a59f;font-size:9px;line-height:1.4;margin:6px 0 12px}.city3d-sell-dialog p strong{color:#f5b84b}.city3d-sell-dialog-actions{display:grid;gap:7px;grid-template-columns:1fr 1fr}.city3d-sell-dialog-actions button{background:#142220;border:1px solid rgba(113,142,135,.28);border-radius:7px;color:#b4c7c1;cursor:pointer;font-size:9px;font-weight:900;height:31px}.city3d-sell-dialog-actions .city3d-sell-confirm{background:#df5849;border-color:#ff796c;color:#fff}.city3d-sell-dialog-actions .city3d-sell-confirm:hover{background:#f36b5b}
  @keyframes city3d-sell-away{to{opacity:0;transform:translate(-50%,-96%) scale(.08) rotate(8deg)}}
  .city3d-instruction{background:rgba(4,13,13,.78);border:1px solid rgba(142,165,160,.2);border-radius:999px;bottom:12px;color:#81968f;font-size:8px;left:12px;padding:7px 10px;pointer-events:none;position:absolute;z-index:160}.city3d-legend{align-items:center;display:flex;gap:15px;min-height:38px;padding:6px 13px}.city3d-legend span{align-items:center;color:#81968f;display:flex;font-size:8px;gap:5px}.city3d-legend i{border:1px solid #719188;border-radius:2px;height:8px;width:8px}.city3d-legend span:first-child i{background:#f5b84b;border:0}.city3d-legend strong{color:#dff6ed;font-size:8px;margin-left:auto}
  .city3d-palette{display:flex;flex-direction:column;gap:9px;max-height:760px;overflow:auto;padding:12px;transform-style:preserve-3d}.city3d-palette-heading{align-items:center;display:flex;justify-content:space-between}.city3d-palette-heading h2{color:#f4fff9;font-size:17px;margin:3px 0 0}.city3d-palette-heading>span{color:#f5b84b;font-size:9px;font-weight:900}
  .city3d-warehouse{background:rgba(56,189,248,.06);border:1px solid rgba(56,189,248,.2);border-radius:9px;display:grid;gap:7px;padding:8px;transform-style:preserve-3d}.city3d-warehouse>div:first-child{display:flex;justify-content:space-between}.city3d-warehouse>div:first-child strong{color:#6dd5ff;font-size:9px}.city3d-warehouse>div:first-child span,.city3d-warehouse p{color:#7f958e;font-size:7px;margin:0}.city3d-warehouse-list{display:grid;gap:5px;grid-template-columns:repeat(2,minmax(0,1fr));transform-style:preserve-3d}.city3d-warehouse-card{align-items:center;background:#0a1817;border:1px solid rgba(112,142,134,.2);border-radius:7px;color:#eafff5;cursor:grab;display:grid;grid-template-columns:54px minmax(0,1fr);min-width:0;padding:4px;text-align:left;transform-style:preserve-3d}.city3d-warehouse-card--selected{border-color:#37e58f}.city3d-warehouse-card>span:last-child{display:grid;min-width:0}.city3d-warehouse-card strong{font-size:7px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.city3d-warehouse-card small{color:#789088;font-size:6px}
  .city3d-palette-label{border-top:1px solid rgba(93,119,113,.18);color:#8da39c;font-size:8px;font-weight:900;padding-top:9px;text-transform:uppercase}.city3d-palette-list{display:grid;gap:6px;transform-style:preserve-3d}.city3d-palette-card{align-items:center;background:linear-gradient(145deg,rgba(17,30,29,.96),rgba(9,19,18,.96));border:1px solid rgba(91,119,112,.2);border-radius:999px;color:#f4fff9;cursor:grab;display:grid;gap:7px;grid-template-columns:66px minmax(0,1fr) auto;min-height:70px;padding:5px 8px;text-align:left;transition:border-color .18s ease,transform .18s ease;transform-style:preserve-3d}.city3d-palette-card:hover,.city3d-palette-card--selected{border-color:var(--building-color);transform:translateX(-2px)}.city3d-palette-copy{display:grid;gap:3px;min-width:0}.city3d-palette-copy strong{font-size:9px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.city3d-palette-copy small{color:#799088;font-size:7px}.city3d-cost{align-items:center;color:#f5b84b;display:flex;font-size:9px;font-weight:900;gap:3px}.city3d-cost--locked{color:#657b74}.city3d-cost--locked svg{opacity:.45}.city3d-palette-coins{align-items:center;display:flex;gap:4px}.city3d-stat strong{align-items:center;display:flex;gap:4px}.city3d-selected-detail{background:rgba(55,229,143,.05);border:1px solid rgba(55,229,143,.15);border-radius:8px;padding:9px}.city3d-selected-detail strong{color:#37e58f;font-size:9px}.city3d-selected-detail p{color:#81968f;font-size:7px;line-height:1.5;margin:4px 0 0}
  .city3d-page { box-sizing: border-box; height: 100dvh; min-height: 0; overflow: hidden; padding: 68px 18px 76px; }
  .city3d-frame { box-sizing: border-box; display: flex; flex-direction: column; height: 100%; padding: 12px; }
  .city3d-header { flex: 0 0 auto; padding: 1px 3px 9px; }
  .city3d-header h1 { font-size: clamp(24px, 2.5vw, 34px); }
  .city3d-header > div:first-child > span { font-size: 10px; margin-top: 3px; }
  .city3d-sun-status { padding: 6px 9px; }
  .city3d-store-toggle { min-height: 36px; }
  .city3d-summary { flex: 0 0 auto; margin-bottom: 8px; padding: 6px; }
  .city3d-stat { gap: 2px; padding: 6px 9px; }
  .city3d-stat strong { font-size: 16px; }
  .city3d-stage { gap: 3px; padding: 6px 9px; }
  .city3d-workspace { flex: 1; min-height: 0; }
  .city3d-map-panel { display: flex; flex-direction: column; min-height: 0; }
  .city3d-map-heading { flex: 0 0 auto; min-height: 46px; padding: 6px 11px; }
  .city3d-field { flex: 1; height: auto; min-height: 0; }
  .city3d-world { width: min(68%, 570px); }
  .city3d-legend { flex: 0 0 auto; min-height: 30px; padding: 3px 11px; }
  .city3d-palette { height: 100%; max-height: none; min-height: 0; overflow: auto; padding: 9px; }
  .city3d-palette-card { min-height: 62px; border-radius: 9px; }
  .city3d-palette-list { gap: 5px; }
  @media(max-width:1100px){.city3d-workspace--store{grid-template-columns:minmax(0,1fr) minmax(235px,285px)}.city3d-world{width:min(74%,540px)}.city3d-palette-card{grid-template-columns:54px minmax(0,1fr) auto;min-height:58px}.city3d-palette-card .lowpoly--compact{transform:scale(.62) rotateY(14deg);transform-origin:center}.city3d-warehouse-list{grid-template-columns:1fr}.city3d-selected-detail{padding:7px}}
  @media(max-width:760px){.city3d-page{padding:60px 7px 70px}.city3d-frame{border-radius:12px;padding:7px}.city3d-header{gap:7px}.city3d-header>div:first-child>span{display:none}.city3d-header h1{font-size:21px}.city3d-header-actions{gap:5px}.city3d-sun-status{padding:5px 7px}.city3d-store-toggle{min-height:32px;padding:0 9px}.city3d-summary{gap:4px;grid-template-columns:repeat(3,1fr)}.city3d-stage{display:none}.city3d-stat{padding:5px}.city3d-stat span{font-size:7px}.city3d-stat strong{font-size:13px}.city3d-workspace--store{grid-template-columns:minmax(0,1fr);grid-template-rows:minmax(0,1fr) 128px}.city3d-map-heading{min-height:38px}.city3d-map-heading>div:first-child{display:none}.city3d-message{max-width:none;width:100%}.city3d-world{width:88%}.city3d-palette{display:grid;gap:5px;grid-template-columns:auto minmax(0,1fr);grid-template-rows:auto minmax(0,1fr);overflow:hidden}.city3d-palette-heading{grid-column:1/-1}.city3d-warehouse,.city3d-palette-label,.city3d-selected-detail{display:none}.city3d-palette-list{display:flex;grid-column:1/-1;overflow-x:auto;padding-bottom:3px;scrollbar-width:none}.city3d-palette-list::-webkit-scrollbar{display:none}.city3d-palette-card{flex:0 0 205px;min-height:56px}.city3d-legend{min-height:25px}.city3d-sky-orb{height:46px;width:46px}.city3d-instruction{bottom:7px;left:7px;max-width:78%}}
`;
