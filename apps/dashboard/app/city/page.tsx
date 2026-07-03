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
  const [selectedBuildingId, setSelectedBuildingId] = useState<CityBuildingId>("solar");
  const [selectedInfrastructureId, setSelectedInfrastructureId] = useState<string | null>(null);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(null);
  const [storeOpen, setStoreOpen] = useState(false);
  const [terrainYaw, setTerrainYaw] = useState(-4);
  const [terrainPitch, setTerrainPitch] = useState(56);
  const [dropActive, setDropActive] = useState(false);
  const [placementPreview, setPlacementPreview] = useState<TerrainPoint | null>(null);
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
    return () => window.clearInterval(timer);
  }, []);

  const selectedBuilding = cityBuildingMap[selectedBuildingId];
  const selectedInfrastructure = infrastructure.find((item) => item.id === selectedInfrastructureId) ?? null;
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
    setMessage({ kind: "success", text: `${building.name} added exactly where you placed it.` });
  };

  const restoreFromWarehouse = (id: string, x: number, y: number) => {
    const storedItem = warehouse.find((item) => item.id === id);
    if (!storedItem) return;
    placeFromWarehouse(id, x, y);
    setSelectedWarehouseId(null);
    setMessage({ kind: "success", text: `${cityBuildingMap[storedItem.buildingId].name} restored from your warehouse.` });
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
      setSelectedInfrastructureId(infrastructureId);
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
      setMessage({ kind: "success", text: "Selected infrastructure moved to the highlighted position." });
      return;
    }
    if (selectedWarehouseId) {
      restoreFromWarehouse(selectedWarehouseId, position.x, position.y);
      return;
    }
    purchaseAndPlace(selectedBuildingId, position.x, position.y);
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
                <div className="city3d-atmosphere" aria-hidden="true"><i /><i /><i /></div>
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
                <div className="city3d-selected-detail"><strong>{selectedBuilding.name}</strong><p>{selectedBuilding.description}</p></div>
              </aside>
            ) : null}
          </div>
        </section>
      </main>
      <style>{styleSheet}</style>
    </CockpitShell>
  );
}

function SummaryStat({ label, value, tone }: { label: string; value: string; tone: "amber" | "green" | "cyan" }) {
  return <div className={`city3d-stat city3d-stat--${tone}`}><span>{label}</span><strong>{value}</strong></div>;
}

function PlacedModel({ item, isBonus, isEditing, isSelected, onSelect, onRotate }: {
  item: PlacedInfrastructure;
  isBonus: boolean;
  isEditing: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onRotate: () => void;
}) {
  const building = cityBuildingMap[item.buildingId];
  const depthScale = 0.82 + item.y / 320;
  return (
    <button
      aria-label={`${building.name}. ${isEditing ? "Tap to select or drag to move." : "Placed infrastructure."}`}
      className={`city3d-asset ${isEditing ? "city3d-asset--editable" : "city3d-asset--locked"} ${isSelected ? "city3d-asset--selected" : ""}`}
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
      {buildingId === "wind" ? <><span className="wind-island" /><span className="wind-house"><i /><b /></span><span className="wind-tree"><i /><b /><em /></span><span className="wind-base" /><span className="wind-tower" /><span className="wind-head"><i /><b className="wind-blade wind-blade--one" /><b className="wind-blade wind-blade--two" /><b className="wind-blade wind-blade--three" /></span></> : null}
      {buildingId === "solar" ? <><span className="solar-stand solar-stand--one" /><span className="solar-stand solar-stand--two" /><span className="solar-panel solar-panel--one"><i /><i /><i /></span><span className="solar-panel solar-panel--two"><i /><i /><i /></span></> : null}
      {buildingId === "park" ? <><span className="park-island" /><span className="park-pond" /><span className="park-tree park-tree--one"><i /><b /></span><span className="park-tree park-tree--two"><i /><b /></span><span className="park-tree park-tree--three"><i /><b /></span><span className="park-bench" /></> : null}
      {buildingId === "charger" ? <><span className="charger-pad" /><span className="charger-canopy"><i /><b /></span><span className="charger-post charger-post--one"><i /></span><span className="charger-post charger-post--two"><i /></span></> : null}
      {buildingId === "recycling" ? <><span className="eco-building recycling-building"><i className="cube-front" /><i className="cube-side" /><i className="cube-top" /><b className="model-window" /></span><span className="recycling-stack" /><span className="recycling-bin recycling-bin--one" /><span className="recycling-bin recycling-bin--two" /></> : null}
      {buildingId === "school" ? <><span className="school-yard" /><span className="eco-building school-building"><i className="cube-front" /><i className="cube-side" /><i className="cube-top" /><b className="model-window" /><em className="model-window model-window--two" /></span><span className="school-wing" /><span className="school-tree"><i /><b /></span></> : null}
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
  .city3d-field { background: linear-gradient(180deg,rgba(94,190,225,.14),transparent 38%), radial-gradient(circle at 50% 38%,rgba(55,229,143,.1),transparent 58%), #071816; cursor: grab; height: clamp(480px,58vw,680px); overflow: hidden; perspective: 980px; position: relative; touch-action: none; transition: background .8s ease,box-shadow .2s ease; }
  .city3d-field:active { cursor: grabbing; }.city3d-field--editing { cursor: crosshair; }.city3d-field--drop { box-shadow: inset 0 0 0 2px rgba(55,229,143,.72),inset 0 0 70px rgba(55,229,143,.1); }
  .city3d-page--night .city3d-field { background: linear-gradient(180deg,rgba(42,74,135,.28),transparent 48%),radial-gradient(circle at 50% 40%,rgba(36,119,131,.15),transparent 58%),#050d17; }
  .city3d-atmosphere { inset: 0; pointer-events: none; position: absolute; }.city3d-atmosphere i { background: rgba(255,255,255,.6); border-radius: 50%; height: 2px; opacity: 0; position: absolute; width: 2px; }.city3d-page--night .city3d-atmosphere i { opacity: .75; box-shadow: 0 0 5px #cce7ff; }.city3d-atmosphere i:nth-child(1){left:18%;top:18%}.city3d-atmosphere i:nth-child(2){right:22%;top:25%}.city3d-atmosphere i:nth-child(3){left:52%;top:12%}
  .city3d-world { aspect-ratio:1; left:50%; position:absolute; top:49%; transform:translate(-50%,-50%) rotateX(var(--terrain-pitch)) rotateZ(var(--terrain-yaw)); transform-origin:center; transform-style:preserve-3d; transition:transform .09s linear; width:min(76%,690px); }
  .city3d-terrain { background:linear-gradient(rgba(117,195,139,.13) 1px,transparent 1px),linear-gradient(90deg,rgba(117,195,139,.13) 1px,transparent 1px),linear-gradient(145deg,#28704d,#174c38 55%,#216142); background-size:42px 42px,42px 42px,auto; border:1px solid rgba(127,220,158,.38); border-radius:25px; box-shadow:0 45px 75px rgba(0,0,0,.48),inset 0 0 70px rgba(102,238,158,.08); inset:0; overflow:hidden; position:absolute; transition:background .8s ease,box-shadow .8s ease; }
  .city3d-page--night .city3d-terrain { background:linear-gradient(rgba(73,143,115,.13) 1px,transparent 1px),linear-gradient(90deg,rgba(73,143,115,.13) 1px,transparent 1px),linear-gradient(145deg,#12372f,#0a2522 58%,#102f2a); background-size:42px 42px,42px 42px,auto; box-shadow:0 45px 85px rgba(0,0,0,.68),inset 0 0 90px rgba(55,109,171,.14); }
  .city3d-road { background:linear-gradient(90deg,#263534,#3b4a48,#253331); box-shadow:0 0 0 6px rgba(24,55,44,.5); position:absolute; }.city3d-road::after { background:repeating-linear-gradient(90deg,rgba(242,220,130,.46) 0 13px,transparent 13px 29px); content:""; height:2px; left:0; position:absolute; right:0; top:50%; }
  .city3d-road--horizontal { height:8%; left:-2%; top:50%; transform:rotate(-4deg); width:106%; }.city3d-road--vertical { height:112%; left:68%; top:-6%; transform:rotate(7deg); width:7%; }.city3d-road--vertical::after { background:repeating-linear-gradient(180deg,rgba(242,220,130,.42) 0 13px,transparent 13px 29px); height:100%; left:50%; top:0; width:2px; }
  .city3d-water { background:radial-gradient(ellipse at 40% 35%,#55c9d2,#177789 68%,#0b5062); border:3px solid rgba(157,235,224,.28); border-radius:50%; bottom:7%; box-shadow:inset 0 0 18px rgba(255,255,255,.18); height:24%; left:8%; position:absolute; width:29%; }
  .city3d-terrain-edge { background:linear-gradient(#143e2d,#082018); position:absolute; }.city3d-terrain-edge--front { bottom:-15px; height:18px; left:3%; transform:rotateX(90deg); transform-origin:top; width:94%; }.city3d-terrain-edge--side { height:94%; right:-15px; top:3%; transform:rotateY(90deg); transform-origin:left; width:18px; }
  .city3d-corner { height:2px; pointer-events:none; position:absolute; width:2px; }.city3d-corner--tl{left:0;top:0}.city3d-corner--tr{right:0;top:0}.city3d-corner--br{bottom:0;right:0}.city3d-corner--bl{bottom:0;left:0}
  .city3d-placement-preview { background:rgba(55,229,143,.16); border:2px solid rgba(55,229,143,.86); border-radius:12px; box-shadow:0 0 18px rgba(55,229,143,.35),inset 0 0 16px rgba(55,229,143,.18); height:62px; pointer-events:none; position:absolute; transform:translate(-50%,-50%); width:62px; z-index:12; }
  .city3d-empty { color:#b7d6ca; display:grid; gap:6px; left:50%; place-items:center; pointer-events:none; position:absolute; text-align:center; top:43%; transform:translate(-50%,-50%); width:260px; }.city3d-empty strong{color:#f4fff9;font-size:18px}.city3d-empty span{font-size:10px}
  .city3d-asset { background:transparent;border:0;height:108px;padding:0;position:absolute;transform-origin:center bottom;width:108px}.city3d-asset--locked{pointer-events:none}.city3d-asset--editable{cursor:grab}.city3d-asset--selected{filter:drop-shadow(0 0 13px #37e58f)}
  .city3d-asset-shadow { background:rgba(0,0,0,.36);border-radius:50%;bottom:5px;filter:blur(5px);height:18px;left:18px;position:absolute;width:72px}.city3d-asset-upright{bottom:4px;height:108px;left:0;pointer-events:none;position:absolute;transform:rotateZ(var(--terrain-yaw-inverse)) rotateX(var(--terrain-pitch-inverse));transform-origin:center bottom;transform-style:preserve-3d;width:108px}.city3d-asset-label{background:rgba(4,13,12,.88);border:1px solid rgba(178,218,205,.2);border-radius:999px;bottom:-1px;color:#eafff5;font-size:8px;font-weight:900;left:50%;padding:4px 8px;position:absolute;transform:translateX(-50%);white-space:nowrap}.city3d-bonus{background:#f5b84b;border-radius:999px;color:#171006;font-size:6px;font-weight:950;padding:3px 5px;position:absolute;right:0;top:6px}
  .lowpoly { bottom:14px;display:block;height:88px;left:10px;position:absolute;transform:rotateY(var(--model-rotation,12deg));transform-style:preserve-3d;width:88px}.lowpoly *{box-sizing:border-box;position:absolute}.lowpoly-ground{background:radial-gradient(ellipse,rgba(0,0,0,.34),transparent 68%);bottom:0;height:17px;left:6px;width:76px}.lowpoly--compact{bottom:auto;height:62px;left:auto;position:relative;transform:scale(.74) rotateY(14deg);transform-origin:center;width:76px}.lowpoly--compact .lowpoly-ground{bottom:0}
  .wind-island{background:radial-gradient(circle at 72% 24%,#b8f45a,#43c849 52%,#15933d 82%);border-radius:48% 52% 46% 54%;bottom:2px;box-shadow:0 7px 0 #087532,0 12px 15px rgba(0,0,0,.28);height:37px;left:0;transform:rotateX(61deg);width:88px}.wind-base{background:#d7e8e5;border-radius:50%;bottom:13px;height:8px;left:35px;width:24px}.wind-tower{background:linear-gradient(90deg,#8ba9ad,#f7fbf7 46%,#abc0c1 72%,#76969a);bottom:16px;clip-path:polygon(41% 0,59% 0,78% 100%,22% 100%);height:62px;left:38px;width:18px}.wind-head{background:linear-gradient(145deg,#f8fcf9,#9ebcc0);border:1px solid rgba(108,147,153,.35);border-radius:50%;box-shadow:0 3px 5px rgba(0,0,0,.2);height:14px;left:40px;top:3px;width:14px;z-index:4}.wind-head i{background:linear-gradient(145deg,#f8fcfa,#9ab9bd);border-radius:50%;height:8px;left:2px;top:2px;width:8px;z-index:5}.wind-blade{background:linear-gradient(90deg,#a8bdc1,#f7fbfa 55%,#c6d4d5);clip-path:polygon(36% 0,66% 1%,59% 100%,42% 100%);height:48px;left:1px;top:-42px;transform-origin:6px 48px;width:12px}.wind-blade--one{transform:rotate(0deg)}.wind-blade--two{transform:rotate(120deg)}.wind-blade--three{transform:rotate(240deg)}.wind-house{background:linear-gradient(90deg,#dfe9df,#f6f1d8);border-radius:2px;bottom:17px;height:19px;left:8px;width:22px}.wind-house i{background:#f2ead3;clip-path:polygon(50% 0,100% 100%,0 100%);height:12px;left:-3px;top:-10px;width:28px}.wind-house b{background:#317395;border-radius:1px;bottom:5px;height:7px;left:4px;width:5px}.wind-tree{bottom:14px;height:35px;right:4px;width:21px}.wind-tree i{background:#9a5934;bottom:0;height:12px;left:8px;width:5px}.wind-tree b,.wind-tree em{background:linear-gradient(145deg,#69d93e,#168c38);clip-path:polygon(50% 0,100% 100%,0 100%);height:22px;left:0;top:8px;width:21px}.wind-tree em{background:linear-gradient(145deg,#8be246,#239940);height:19px;left:2px;top:0;width:18px}
  .solar-panel{background:linear-gradient(rgba(95,198,255,.32) 1px,transparent 1px),linear-gradient(90deg,rgba(95,198,255,.32) 1px,transparent 1px),linear-gradient(145deg,#17618b,#092d52);background-size:12px 12px;border:2px solid #6b91a4;box-shadow:0 5px 0 #071b29,0 8px 12px rgba(0,0,0,.3);height:31px;top:22px;transform:rotateX(48deg) rotateZ(-6deg);width:48px}.solar-panel--one{left:1px}.solar-panel--two{right:-3px;top:30px}.solar-stand{background:linear-gradient(90deg,#7d9997,#d9ebe5);bottom:12px;height:33px;width:5px}.solar-stand--one{left:25px}.solar-stand--two{right:20px}
  .park-island{background:linear-gradient(145deg,#4ebd72,#1e784b);border:3px solid #61ce83;border-radius:50% 42% 48% 38%;bottom:7px;height:43px;left:7px;transform:rotateX(64deg);width:76px}.park-pond{background:#39a9c3;border:2px solid #79d7d9;border-radius:50%;bottom:17px;height:15px;left:14px;transform:rotateX(60deg);width:25px}.park-tree i,.school-tree i{background:#76523a;bottom:8px;height:27px;left:10px;width:6px}.park-tree b,.school-tree b{background:radial-gradient(circle at 35% 25%,#85e59c,#2f9c57 65%,#12643c);border-radius:48% 53% 44% 58%;height:30px;left:0;top:0;width:28px}.park-tree{height:50px;width:30px}.park-tree--one{bottom:20px;left:38px}.park-tree--two{bottom:14px;left:59px;transform:scale(.76)}.park-tree--three{bottom:12px;left:20px;transform:scale(.66)}.park-bench{background:#d1a36b;bottom:17px;height:5px;left:49px;transform:rotate(-12deg);width:22px}
  .charger-pad{background:#315d52;border:2px solid #4ea685;bottom:7px;height:34px;left:9px;transform:rotateX(62deg);width:72px}.charger-canopy{background:linear-gradient(145deg,#66d4c9,#167c78);border-radius:5px;height:16px;left:9px;top:17px;transform:skewX(-18deg);width:66px}.charger-canopy i,.charger-canopy b{background:#b5d8d1;bottom:-39px;height:40px;width:5px}.charger-canopy i{left:8px}.charger-canopy b{right:8px}.charger-post{background:linear-gradient(90deg,#dff8f0,#6f9690);border-radius:4px;bottom:16px;height:32px;width:14px}.charger-post--one{left:24px}.charger-post--two{right:18px}.charger-post i{background:#45e0b0;border-radius:2px;height:8px;left:3px;top:5px;width:8px;box-shadow:0 0 7px #37e58f}
  .eco-building{bottom:10px;height:47px;left:15px;transform-style:preserve-3d;width:58px}.cube-front{background:linear-gradient(145deg,#d4e8df,#78a69a);border-radius:5px;inset:0;transform:translateZ(12px)}.cube-side{background:#547d73;height:100%;right:-12px;top:6px;transform:skewY(-28deg);width:14px}.cube-top{background:#a8c9bc;height:19px;left:6px;top:-12px;transform:skewX(-32deg);width:57px}.model-window{background:#bdf8d5;border-radius:2px;box-shadow:0 0 8px rgba(90,255,173,.4);height:11px;left:10px;top:13px;width:16px}.model-window--two{left:32px}.recycling-building .cube-front{background:linear-gradient(145deg,#a9d7b0,#4d9464)}.recycling-stack{background:linear-gradient(90deg,#567d72,#c4d9d1);bottom:53px;height:25px;left:60px;width:9px}.recycling-bin{background:#36a969;border-radius:3px;bottom:9px;height:17px;width:14px}.recycling-bin--one{left:8px}.recycling-bin--two{background:#3b98bd;right:5px}
  .school-yard{background:#3f9a62;border-radius:50%;bottom:5px;height:38px;left:2px;transform:rotateX(63deg);width:82px}.school-building{left:8px;width:62px}.school-building .cube-front{background:linear-gradient(145deg,#d9e7df,#83a79a)}.school-building .cube-top{background:#5f9d73}.school-wing{background:linear-gradient(#c9ddd5,#71978b);border-radius:3px;bottom:12px;height:26px;right:1px;transform:skewY(-12deg);width:28px}.school-tree{bottom:13px;height:47px;right:4px;transform:scale(.64);width:28px}
  .city3d-page--night .model-window{background:#ffe28a;box-shadow:0 0 12px #ffc95b}.city3d-page--night .lowpoly{filter:drop-shadow(0 9px 8px rgba(0,0,0,.45)) brightness(.9)}.city3d-page--day .lowpoly{filter:drop-shadow(-8px 10px 6px rgba(0,0,0,.28))}
  .city3d-edit-toolbar{align-items:center;background:rgba(4,13,13,.94);border:1px solid rgba(55,229,143,.35);border-radius:10px;display:flex;gap:6px;left:50%;padding:7px;position:absolute;top:12px;transform:translateX(-50%);z-index:180}.city3d-edit-toolbar strong{color:#f4fff9;font-size:9px;padding:0 5px}.city3d-edit-toolbar button{background:rgba(55,229,143,.1);border:1px solid rgba(55,229,143,.3);border-radius:6px;color:#37e58f;cursor:pointer;font-size:8px;font-weight:900;padding:6px 8px}.city3d-edit-toolbar .city3d-warehouse-action{border-color:rgba(245,184,75,.35);color:#f5b84b}
  .city3d-instruction{background:rgba(4,13,13,.78);border:1px solid rgba(142,165,160,.2);border-radius:999px;bottom:12px;color:#81968f;font-size:8px;left:12px;padding:7px 10px;pointer-events:none;position:absolute;z-index:160}.city3d-legend{align-items:center;display:flex;gap:15px;min-height:38px;padding:6px 13px}.city3d-legend span{align-items:center;color:#81968f;display:flex;font-size:8px;gap:5px}.city3d-legend i{border:1px solid #719188;border-radius:2px;height:8px;width:8px}.city3d-legend span:first-child i{background:#f5b84b;border:0}.city3d-legend strong{color:#dff6ed;font-size:8px;margin-left:auto}
  .city3d-palette{display:flex;flex-direction:column;gap:9px;max-height:760px;overflow:auto;padding:12px}.city3d-palette-heading{align-items:center;display:flex;justify-content:space-between}.city3d-palette-heading h2{color:#f4fff9;font-size:17px;margin:3px 0 0}.city3d-palette-heading>span{color:#f5b84b;font-size:9px;font-weight:900}
  .city3d-warehouse{background:rgba(56,189,248,.06);border:1px solid rgba(56,189,248,.2);border-radius:9px;display:grid;gap:7px;padding:8px}.city3d-warehouse>div:first-child{display:flex;justify-content:space-between}.city3d-warehouse>div:first-child strong{color:#6dd5ff;font-size:9px}.city3d-warehouse>div:first-child span,.city3d-warehouse p{color:#7f958e;font-size:7px;margin:0}.city3d-warehouse-list{display:grid;gap:5px;grid-template-columns:repeat(2,minmax(0,1fr))}.city3d-warehouse-card{align-items:center;background:#0a1817;border:1px solid rgba(112,142,134,.2);border-radius:7px;color:#eafff5;cursor:grab;display:grid;grid-template-columns:54px minmax(0,1fr);min-width:0;padding:4px;text-align:left}.city3d-warehouse-card--selected{border-color:#37e58f}.city3d-warehouse-card>span:last-child{display:grid;min-width:0}.city3d-warehouse-card strong{font-size:7px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.city3d-warehouse-card small{color:#789088;font-size:6px}
  .city3d-palette-label{border-top:1px solid rgba(93,119,113,.18);color:#8da39c;font-size:8px;font-weight:900;padding-top:9px;text-transform:uppercase}.city3d-palette-list{display:grid;gap:6px}.city3d-palette-card{align-items:center;background:linear-gradient(145deg,rgba(17,30,29,.96),rgba(9,19,18,.96));border:1px solid rgba(91,119,112,.2);border-radius:9px;color:#f4fff9;cursor:grab;display:grid;gap:7px;grid-template-columns:66px minmax(0,1fr) auto;min-height:70px;padding:5px 8px;text-align:left;transition:border-color .18s ease,transform .18s ease}.city3d-palette-card:hover,.city3d-palette-card--selected{border-color:var(--building-color);transform:translateX(-2px)}.city3d-palette-copy{display:grid;gap:3px;min-width:0}.city3d-palette-copy strong{font-size:9px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.city3d-palette-copy small{color:#799088;font-size:7px}.city3d-cost{align-items:center;color:#f5b84b;display:flex;font-size:9px;font-weight:900;gap:3px}.city3d-cost i{border:2px solid #f5b84b;border-radius:50%;height:9px;width:9px}.city3d-cost--locked{color:#657b74}.city3d-cost--locked i{border-color:#657b74}.city3d-selected-detail{background:rgba(55,229,143,.05);border:1px solid rgba(55,229,143,.15);border-radius:8px;padding:9px}.city3d-selected-detail strong{color:#37e58f;font-size:9px}.city3d-selected-detail p{color:#81968f;font-size:7px;line-height:1.5;margin:4px 0 0}
  @media(max-width:1100px){.city3d-workspace--store{grid-template-columns:1fr}.city3d-palette{max-height:none}.city3d-palette-list{display:flex;overflow-x:auto;padding-bottom:7px;scrollbar-width:none}.city3d-palette-list::-webkit-scrollbar{display:none}.city3d-palette-card{flex:0 0 250px}.city3d-field{height:600px}}
  @media(max-width:760px){.city3d-page{padding:72px 10px 105px}.city3d-frame{border-radius:13px;padding:11px}.city3d-header{align-items:flex-start;flex-direction:column}.city3d-header-actions{justify-content:space-between;width:100%}.city3d-summary{grid-template-columns:repeat(3,1fr)}.city3d-stage{grid-column:1/-1}.city3d-field{height:460px}.city3d-world{width:88%}.city3d-map-heading{align-items:flex-start;flex-direction:column;gap:7px}.city3d-message{max-width:none}.city3d-palette{margin-left:-1px;margin-right:-1px}.city3d-palette-list{margin-left:-12px;margin-right:-12px;padding-left:12px;padding-right:12px}.city3d-palette-card{flex-basis:235px}.city3d-instruction{max-width:75%}}
`;
