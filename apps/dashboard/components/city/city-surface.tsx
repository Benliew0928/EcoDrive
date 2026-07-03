"use client";

import {
  Check,
  Coins,
  Eye,
  Leaf,
  LockKeyhole,
  MousePointer2,
  Move3d,
  RotateCw,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Warehouse,
  X
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  cityBuildingMap,
  cityBuildings,
  cityStages,
  type CityBuildingId,
  type PlacedInfrastructure
} from "../../data/city-buildings";
import { useCityStore } from "../../lib/city-store";
import { useDashboardStore } from "../../lib/dashboard-store";

type PlacementMessage = {
  kind: "success" | "error";
  text: string;
};

const BUILDING_DRAG_TYPE = "application/x-ecodrive-building";
const INFRASTRUCTURE_DRAG_TYPE = "application/x-ecodrive-infrastructure";
const WAREHOUSE_DRAG_TYPE = "application/x-ecodrive-warehouse";

export function CitySurface() {
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
  const fieldRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const terrainDragRef = useRef({ active: false, startX: 0, startY: 0, startYaw: 0, startPitch: 55 });
  const [selectedBuildingId, setSelectedBuildingId] = useState<CityBuildingId>("solar");
  const [selectedInfrastructureId, setSelectedInfrastructureId] = useState<string | null>(null);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [terrainYaw, setTerrainYaw] = useState(0);
  const [terrainPitch, setTerrainPitch] = useState(55);
  const [fieldIsActive, setFieldIsActive] = useState(false);
  const [message, setMessage] = useState<PlacementMessage>({
    kind: "success",
    text: "Drag infrastructure from the Store onto the field."
  });

  useEffect(() => {
    void useCityStore.persist.rehydrate();
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
    setMessage({ kind: "success", text: `${building.name} purchased and added to your district.` });
  };

  const restoreFromWarehouse = (id: string, x: number, y: number) => {
    const storedItem = warehouse.find((item) => item.id === id);
    if (!storedItem) return;
    placeFromWarehouse(id, x, y);
    setSelectedWarehouseId(null);
    setMessage({ kind: "success", text: `${cityBuildingMap[storedItem.buildingId].name} restored from your warehouse.` });
  };

  const readFieldPosition = (clientX: number, clientY: number) => {
    const bounds = worldRef.current?.getBoundingClientRect();
    if (!bounds) return { x: 50, y: 50 };
    return {
      x: ((clientX - bounds.left) / bounds.width) * 100,
      y: ((clientY - bounds.top) / bounds.height) * 100
    };
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setFieldIsActive(false);
    if (!isEditing) return;
    const position = readFieldPosition(event.clientX, event.clientY);
    const infrastructureId = event.dataTransfer.getData(INFRASTRUCTURE_DRAG_TYPE);
    const warehouseId = event.dataTransfer.getData(WAREHOUSE_DRAG_TYPE);
    const buildingId = event.dataTransfer.getData(BUILDING_DRAG_TYPE) as CityBuildingId;

    if (infrastructureId) {
      moveInfrastructure(infrastructureId, position.x, position.y);
      setMessage({ kind: "success", text: "Infrastructure repositioned. Your layout has been saved." });
      return;
    }

    if (warehouseId) {
      restoreFromWarehouse(warehouseId, position.x, position.y);
      return;
    }

    if (buildingId && cityBuildingMap[buildingId]) purchaseAndPlace(buildingId, position.x, position.y);
  };

  const handleFieldClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isEditing) return;
    if ((event.target as HTMLElement).closest("[data-infrastructure-id]")) return;
    const position = readFieldPosition(event.clientX, event.clientY);
    if (selectedWarehouseId) {
      restoreFromWarehouse(selectedWarehouseId, position.x, position.y);
      return;
    }
    purchaseAndPlace(selectedBuildingId, position.x, position.y);
  };

  const beginTerrainRotation = (event: React.PointerEvent<HTMLDivElement>) => {
    if (isEditing) return;
    terrainDragRef.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      startYaw: terrainYaw,
      startPitch: terrainPitch
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const updateTerrainRotation = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!terrainDragRef.current.active || isEditing) return;
    setTerrainYaw(clampView(terrainDragRef.current.startYaw + (event.clientX - terrainDragRef.current.startX) * 0.12, -32, 32));
    setTerrainPitch(clampView(terrainDragRef.current.startPitch - (event.clientY - terrainDragRef.current.startY) * 0.12, 38, 68));
  };

  const stopTerrainRotation = (event: React.PointerEvent<HTMLDivElement>) => {
    terrainDragRef.current.active = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <div className="live-surface city-surface city-surface--freeform">
      <header className="city-summary">
        <SummaryStat icon={Coins} label="EcoCoins" value={walletCoins.toLocaleString()} tone="amber" />
        <SummaryStat icon={Sparkles} label="Yield Coins" value={cityStats.yieldCoins.toLocaleString()} tone="green" />
        <SummaryStat icon={TrendingUp} label="Daily yield" value={`+${cityStats.dailyYield}`} tone="cyan" />
        <div className="city-stage-summary">
          <div><span>City stage</span><strong>{stage.name}</strong></div>
          <span>{nextStage ? `${cityStats.impact}/${nextStage.threshold} impact` : "Maximum stage"}</span>
          <div className="city-stage-track" aria-label={`${Math.round(stageProgress)}% to next city stage`}>
            <span style={{ width: `${Math.max(4, Math.min(100, stageProgress))}%` }} />
          </div>
        </div>
      </header>

      <div className={`city-workspace city-workspace--freeform ${isEditing ? "city-workspace--editing" : "city-workspace--viewing"}`}>
        <section className="city-map-panel city-map-panel--freeform" aria-label="Free-placement Eco-City field">
          <div className="city-map-heading">
            <div><span className="city-kicker">District 01</span><h2>Lakeview open field</h2></div>
            <div className="city-heading-actions">
              <div className={`city-message city-message--${message.kind}`} role="status">
                {message.kind === "success" ? <Check size={14} /> : <X size={14} />}
                <span>{isEditing ? message.text : "Drag left/right to turn and up/down to tilt the terrain."}</span>
              </div>
              <button
                className={`city-edit-toggle ${isEditing ? "city-edit-toggle--active" : ""}`}
                onClick={() => {
                  setIsEditing((current) => !current);
                  setSelectedInfrastructureId(null);
                  setSelectedWarehouseId(null);
                  setMessage({ kind: "success", text: isEditing ? "Store closed. Terrain controls unlocked." : "Store open. Add, move, rotate or remove infrastructure." });
                }}
                type="button"
              >
                {isEditing ? <Eye size={15} /> : <ShoppingBag size={15} />}
                {isEditing ? "Close store" : "Store"}
              </button>
            </div>
          </div>

          <div
            className={`city-field ${fieldIsActive ? "city-field--active" : ""} ${isEditing ? "city-field--editing" : "city-field--viewing"}`}
            onClick={handleFieldClick}
            onDragEnter={() => setFieldIsActive(true)}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = event.dataTransfer.types.includes(INFRASTRUCTURE_DRAG_TYPE) || event.dataTransfer.types.includes(WAREHOUSE_DRAG_TYPE) ? "move" : "copy";
              setFieldIsActive(true);
            }}
            onDrop={handleDrop}
            onPointerDown={beginTerrainRotation}
            onPointerMove={updateTerrainRotation}
            onPointerUp={stopTerrainRotation}
            onPointerCancel={stopTerrainRotation}
            ref={fieldRef}
            style={{
              "--terrain-yaw": `${terrainYaw}deg`,
              "--terrain-pitch": `${terrainPitch}deg`,
              "--terrain-yaw-inverse": `${-terrainYaw}deg`,
              "--terrain-pitch-inverse": `${-terrainPitch}deg`
            } as React.CSSProperties}
          >
            <div className="city-world" ref={worldRef}>
              <div className="city-field-terrain" aria-hidden="true">
                <span className="terrain-road terrain-road--one" />
                <span className="terrain-road terrain-road--two" />
                <span className="terrain-water" />
              </div>

            {!infrastructure.length ? (
              <div className="city-field-empty">
                <Move3d size={34} />
                <strong>Your field is ready</strong>
                <span>{isEditing ? "Drag a building here, or select one and tap anywhere on the field." : "Open the Store to begin building your city."}</span>
              </div>
            ) : null}

              {infrastructure.map((item) => (
                <InfrastructureModel
                  isEditing={isEditing}
                  isBonus={bonusInfrastructure.has(item.id)}
                  isSelected={item.id === selectedInfrastructureId}
                  item={item}
                  key={item.id}
                  onSelect={() => setSelectedInfrastructureId(item.id)}
                  onRotate={() => {
                    rotateInfrastructure(item.id);
                    setMessage({ kind: "success", text: "Infrastructure rotated. Layout saved automatically." });
                  }}
                />
              ))}
            </div>

            {isEditing && selectedInfrastructure ? (
              <div className="city-edit-toolbar">
                <strong>{cityBuildingMap[selectedInfrastructure.buildingId].name}</strong>
                <button onClick={() => rotateInfrastructure(selectedInfrastructure.id)} type="button"><RotateCw size={13} /> Rotate</button>
                <button
                  className="city-edit-toolbar-store"
                  onClick={() => {
                    moveToWarehouse(selectedInfrastructure.id);
                    setSelectedInfrastructureId(null);
                    setMessage({ kind: "success", text: "Infrastructure moved to your warehouse." });
                  }}
                  type="button"
                ><Warehouse size={13} /> Warehouse</button>
              </div>
            ) : null}

            <div className="city-field-instruction">
              {isEditing ? <MousePointer2 size={13} /> : <Move3d size={13} />}
              {isEditing ? "Select and drag assets to reposition" : "Drag in four directions to inspect terrain"}
            </div>

          </div>

          <footer className="city-map-legend city-map-legend--freeform">
            <span><i className="legend-swatch legend-swatch--bonus" /> Synergy bonus</span>
            <span><i className="legend-swatch legend-swatch--open" /> Saved automatically</span>
            <strong>{infrastructure.length} assets placed</strong>
          </footer>
        </section>

        {isEditing ? <aside className="city-catalog">
          <div className="building-panel-heading">
            <div><span className="city-kicker">Infrastructure shop</span><h2>Drag to purchase</h2></div>
            <Leaf size={21} />
          </div>

          <section className="city-warehouse" aria-label="Infrastructure warehouse">
            <div className="city-warehouse-heading">
              <div><Warehouse size={16} /><strong>Warehouse</strong></div>
              <span>{warehouse.length} stored</span>
            </div>
            {warehouse.length ? (
              <div className="city-warehouse-list">
                {warehouse.map((item) => {
                  const building = cityBuildingMap[item.buildingId];
                  const Icon = building.Icon;
                  const selected = item.id === selectedWarehouseId;
                  return (
                    <button
                      aria-pressed={selected}
                      className={`city-warehouse-card ${selected ? "city-warehouse-card--selected" : ""}`}
                      draggable
                      key={item.id}
                      onClick={() => {
                        setSelectedWarehouseId(item.id);
                        setSelectedInfrastructureId(null);
                        setMessage({ kind: "success", text: `${building.name} selected. Tap the terrain or drag it out to place it.` });
                      }}
                      onDragEnd={() => setFieldIsActive(false)}
                      onDragStart={(event) => {
                        event.dataTransfer.effectAllowed = "move";
                        event.dataTransfer.setData(WAREHOUSE_DRAG_TYPE, item.id);
                        setSelectedWarehouseId(item.id);
                      }}
                      style={{ "--building-color": building.color } as React.CSSProperties}
                      type="button"
                    >
                      <span className="city-warehouse-model"><Icon size={19} /></span>
                      <span><strong>{building.name}</strong><small>Owned · place free</small></span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="city-warehouse-empty">Removed infrastructure will be stored here for reuse.</p>
            )}
          </section>

          <div className="city-shop-label"><ShoppingBag size={14} /><strong>Buy infrastructure</strong></div>

          <div className="city-catalog-list">
            {cityBuildings.map((building) => {
              const Icon = building.Icon;
              const selected = building.id === selectedBuildingId;
              const affordable = walletCoins >= building.cost;
              return (
                <button
                  aria-pressed={selected}
                  className={`city-catalog-card ${selected ? "city-catalog-card--selected" : ""}`}
                  draggable={affordable && storesReady}
                  key={building.id}
                  onClick={() => {
                    setSelectedBuildingId(building.id);
                    setSelectedWarehouseId(null);
                  }}
                  onDragEnd={() => setFieldIsActive(false)}
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = "copy";
                    event.dataTransfer.setData(BUILDING_DRAG_TYPE, building.id);
                    setSelectedBuildingId(building.id);
                    setSelectedWarehouseId(null);
                  }}
                  style={{ "--building-color": building.color } as React.CSSProperties}
                  type="button"
                >
                  <span className="city-catalog-model"><Icon size={25} /></span>
                  <span className="building-option-copy"><strong>{building.name}</strong><small>+{building.yieldPerDay} yield/day</small></span>
                  <span className={`building-option-cost ${affordable ? "" : "building-option-cost--locked"}`}>
                    {!affordable ? <LockKeyhole size={11} /> : <Coins size={11} />}{building.cost}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="building-detail city-catalog-detail">
            <div><selectedBuilding.Icon size={25} /><strong>{selectedBuilding.name}</strong></div>
            <p>{selectedBuilding.description}</p>
            <div className="building-detail-stats">
              <span><small>Impact</small><strong>+{selectedBuilding.impact}</strong></span>
              <span><small>Yield</small><strong>+{selectedBuilding.yieldPerDay}/d</strong></span>
            </div>
          </div>

          <div className="city-adjacency-tip">
            <Sparkles size={16} />
            <p><strong>Place with purpose.</strong> Keep Solar near an EV Hub, and Recycling near an Eco-School, to unlock extra yield.</p>
          </div>
        </aside> : null}
      </div>
    </div>
  );
}

function InfrastructureModel({
  item,
  isBonus,
  isEditing,
  isSelected,
  onRotate,
  onSelect
}: {
  item: PlacedInfrastructure;
  isBonus: boolean;
  isEditing: boolean;
  isSelected: boolean;
  onRotate: () => void;
  onSelect: () => void;
}) {
  const building = cityBuildingMap[item.buildingId];
  const Icon = building.Icon;
  const depthScale = 0.78 + item.y / 260;

  return (
    <button
      aria-label={`${building.name}. Drag to move, double-click to rotate.`}
      className={`city-infrastructure city-infrastructure--${item.buildingId} ${isBonus ? "city-infrastructure--bonus" : ""} ${isEditing ? "city-infrastructure--editable" : "city-infrastructure--locked"} ${isSelected ? "city-infrastructure--selected" : ""}`}
      data-infrastructure-id={item.id}
      draggable={isEditing}
      onClick={(event) => {
        if (!isEditing) return;
        event.stopPropagation();
        onSelect();
      }}
      onDoubleClick={(event) => {
        if (!isEditing) return;
        event.stopPropagation();
        onRotate();
      }}
      onDragStart={(event) => {
        if (!isEditing) {
          event.preventDefault();
          return;
        }
        event.stopPropagation();
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData(INFRASTRUCTURE_DRAG_TYPE, item.id);
      }}
      style={{
        "--building-color": building.color,
        "--model-rotation": `${item.rotation}deg`,
        left: `${item.x}%`,
        top: `${item.y}%`,
        transform: `translate(-50%, -72%) scale(${depthScale})`,
        zIndex: Math.round(item.y) + 20
      } as React.CSSProperties}
      type="button"
    >
      <span className="city-infrastructure-shadow" />
      <span className="city-infrastructure-upright">
        <span className={`infrastructure-geometry infrastructure-geometry--${item.buildingId}`}>
          <span className="infrastructure-geometry-core"><Icon size={25} strokeWidth={1.7} /></span>
          <span className="infrastructure-geometry-top" />
          <span className="infrastructure-geometry-side" />
          <span className="infrastructure-geometry-detail" />
        </span>
        <span className="city-infrastructure-label">{building.shortName}</span>
        {isBonus ? <Sparkles className="city-infrastructure-bonus" size={13} /> : null}
      </span>
    </button>
  );
}

function clampView(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function SummaryStat({ icon: Icon, label, value, tone }: {
  icon: typeof Coins;
  label: string;
  value: string;
  tone: "amber" | "green" | "cyan";
}) {
  return <div className={`city-summary-stat city-summary-stat--${tone}`}><Icon size={18} /><span>{label}</span><strong>{value}</strong></div>;
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
  items.forEach((item, index) => {
    items.slice(index + 1).forEach((other) => {
      if (isSynergyPair(item.buildingId, other.buildingId) && distance(item, other) <= 19) {
        bonusIds.add(item.id);
        bonusIds.add(other.id);
      }
    });
  });
  return bonusIds;
}

function isSynergyPair(first: CityBuildingId, second: CityBuildingId) {
  return (
    (first === "solar" && second === "charger") ||
    (first === "charger" && second === "solar") ||
    (first === "recycling" && second === "school") ||
    (first === "school" && second === "recycling")
  );
}

function distance(first: PlacedInfrastructure, second: PlacedInfrastructure) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

function findStageIndex(impact: number) {
  for (let index = cityStages.length - 1; index >= 0; index -= 1) {
    if (impact >= cityStages[index].threshold) return index;
  }
  return 0;
}
