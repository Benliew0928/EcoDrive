"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  cityAssets,
  createDriveEvent,
  initialChallenges,
  initialCityCells,
  initialFleetVehicles,
  initialRewards,
  initialTelemetry,
  routeOptions
} from "./dashboard-data";
import type {
  CityCell,
  DashboardState,
  DriveEventType,
  FleetVehicle,
  ProcessedTelemetry,
  Redemption,
  RouteId
} from "../types/dashboard";

type DashboardActions = {
  setConnectionStatus: (status: DashboardState["connectionStatus"]) => void;
  selectRoute: (routeId: RouteId) => void;
  selectRouteAndStart: (routeId: RouteId) => void;
  startDemo: () => void;
  pauseDemo: () => void;
  tickDemo: () => void;
  receiveTelemetry: (telemetry: ProcessedTelemetry) => void;
  injectEvent: (event: DriveEventType) => void;
  selectCityAsset: (assetId: string) => void;
  placeCityAsset: (cellIndex: number) => void;
  redeemReward: (rewardId: string) => void;
  joinChallenge: (challengeId: string) => void;
  clearQrToken: () => void;
};

export const useDashboardStore = create<DashboardState & DashboardActions>()(
  persist(
    (set, get) => ({
      activeRouteId: null,
      connectionStatus: "demo",
      demoRunning: false,
      demoTickIndex: 0,
      telemetry: initialTelemetry,
      eventFeed: [createDriveEvent("launch_ready", initialTelemetry.timestamp)],
      wallet: {
        rawCoins: initialTelemetry.totalCoins,
        yieldCoins: 168
      },
      cityCells: initialCityCells,
      selectedCityAssetId: cityAssets[0].id,
      rewards: initialRewards,
      redemptionHistory: [],
      activeQrToken: null,
      challenges: initialChallenges,
      fleetVehicles: initialFleetVehicles,
      lastActionMessage: "Dashboard ready.",
      setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
      selectRoute: (routeId) =>
        set((state) => ({
          activeRouteId: routeId,
          lastActionMessage: `${routeOptions.find((route) => route.id === routeId)?.label ?? "Route"} selected.`,
          eventFeed: addEvent(state.eventFeed, "route_selected")
        })),
      selectRouteAndStart: (routeId) =>
        set((state) => ({
          activeRouteId: routeId,
          demoRunning: true,
          lastActionMessage: "Eco route selected. Live drive dashboard started.",
          eventFeed: addEvent(state.eventFeed, "route_selected")
        })),
      startDemo: () =>
        set((state) => ({
          activeRouteId: state.activeRouteId ?? "eco",
          demoRunning: true,
          lastActionMessage: "Demo telemetry running.",
          eventFeed: addEvent(state.eventFeed, "route_selected")
        })),
      pauseDemo: () =>
        set({
          demoRunning: false,
          lastActionMessage: "Demo telemetry paused."
        }),
      tickDemo: () =>
        set((state) => {
          const tickIndex = state.demoTickIndex + 1;
          const telemetry = createDemoTelemetry(state, tickIndex);
          return reduceTelemetry(state, telemetry, {
            demoTickIndex: tickIndex,
            demoRunning: true
          });
        }),
      receiveTelemetry: (telemetry) => set((state) => reduceTelemetry(state, telemetry)),
      injectEvent: (event) =>
        set((state) => {
          const telemetry = createInjectedTelemetry(state.telemetry, event, state.activeRouteId);
          return reduceTelemetry(state, telemetry, {
            demoRunning: true,
            lastActionMessage: event === "harsh_brake" ? "Harsh brake injected." : "Smooth event injected."
          });
        }),
      selectCityAsset: (selectedCityAssetId) => set({ selectedCityAssetId }),
      placeCityAsset: (cellIndex) =>
        set((state) => {
          const asset = cityAssets.find((candidate) => candidate.id === state.selectedCityAssetId);
          const cell = state.cityCells[cellIndex];

          if (!asset || !cell) {
            return { lastActionMessage: "City placement failed." };
          }

          if (cell.assetId) {
            return { lastActionMessage: "This plot already has an asset." };
          }

          if (state.wallet.rawCoins < asset.cost) {
            return { lastActionMessage: `Need ${asset.cost} raw EcoCoins for ${asset.label}.` };
          }

          const nextCells = state.cityCells.map((candidate, index) =>
            index === cellIndex ? { assetId: asset.id, placedAt: Date.now() } : candidate
          );
          const nextYield = calculateDailyYield(nextCells);

          return {
            cityCells: nextCells,
            wallet: {
              rawCoins: state.wallet.rawCoins - asset.cost,
              yieldCoins: Math.max(state.wallet.yieldCoins, nextYield)
            },
            lastActionMessage: `${asset.label} placed. City yield is now ${nextYield}/day.`
          };
        }),
      redeemReward: (rewardId) =>
        set((state) => {
          const reward = state.rewards.find((candidate) => candidate.id === rewardId);

          if (!reward) {
            return { lastActionMessage: "Reward not found." };
          }

          if (state.wallet.yieldCoins < reward.cost) {
            return { lastActionMessage: `Need ${reward.cost} Yield Coins for ${reward.title}.` };
          }

          const redeemedAt = Date.now();
          const redemption: Redemption = {
            id: `${reward.id}-${redeemedAt}`,
            rewardId: reward.id,
            title: reward.title,
            cost: reward.cost,
            qrToken: `ECODRIVE-${reward.id.toUpperCase()}-${redeemedAt}`,
            redeemedAt
          };

          return {
            wallet: {
              ...state.wallet,
              yieldCoins: state.wallet.yieldCoins - reward.cost
            },
            rewards: state.rewards.map((candidate) => (candidate.id === reward.id ? { ...candidate, redeemed: true } : candidate)),
            redemptionHistory: [redemption, ...state.redemptionHistory].slice(0, 6),
            activeQrToken: redemption.qrToken,
            lastActionMessage: `${reward.title} redeemed. QR generated.`
          };
        }),
      joinChallenge: (challengeId) =>
        set((state) => ({
          challenges: state.challenges.map((challenge) =>
            challenge.id === challengeId ? { ...challenge, joined: true, progressKg: Math.max(challenge.progressKg, state.telemetry.co2SavedKg) } : challenge
          ),
          lastActionMessage: "Challenge joined."
        })),
      clearQrToken: () => set({ activeQrToken: null })
    }),
    {
      name: "ecodrive-dashboard-state",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        activeRouteId: state.activeRouteId,
        telemetry: state.telemetry,
        eventFeed: state.eventFeed,
        wallet: state.wallet,
        cityCells: state.cityCells,
        selectedCityAssetId: state.selectedCityAssetId,
        rewards: state.rewards,
        redemptionHistory: state.redemptionHistory,
        activeQrToken: state.activeQrToken,
        challenges: state.challenges,
        fleetVehicles: state.fleetVehicles,
        lastActionMessage: state.lastActionMessage
      })
    }
  )
);

export function activeRouteLabel(routeId: RouteId | null) {
  return routeOptions.find((route) => route.id === routeId)?.label ?? "No route selected";
}

export function calculateDailyYield(cells: CityCell[]) {
  return cells.reduce((total, cell, index) => {
    if (!cell.assetId) return total;
    const asset = cityAssets.find((candidate) => candidate.id === cell.assetId);
    if (!asset) return total;

    const bonus = getAdjacentAssetIds(cells, index).some((adjacentAssetId) => asset.bonusWith.includes(adjacentAssetId)) ? 1.25 : 1;
    return total + Math.round(asset.yieldPerDay * bonus);
  }, 0);
}

function reduceTelemetry(
  state: DashboardState,
  telemetry: ProcessedTelemetry,
  extra: Partial<DashboardState> = {}
): Partial<DashboardState> {
  const route = routeOptions.find((option) => option.id === (state.activeRouteId ?? telemetry.routeChoice));
  const shouldAddEvent =
    telemetry.event !== state.telemetry.event || telemetry.event !== "smooth_segment" || state.eventFeed.length === 0;
  const nextEvents = shouldAddEvent ? addEvent(state.eventFeed, telemetry.event, telemetry.timestamp) : state.eventFeed;
  const nextWallet = {
    rawCoins: Math.max(0, state.wallet.rawCoins + telemetry.coinsEarned),
    yieldCoins: state.wallet.yieldCoins + (telemetry.event === "smooth_streak" ? 2 : 0)
  };
  const nextChallenges = state.challenges.map((challenge) =>
    challenge.joined
      ? {
          ...challenge,
          progressKg: Math.min(challenge.targetKg, Math.max(challenge.progressKg, challenge.progressKg + telemetry.co2SavedKg * 0.01))
        }
      : challenge
  );

  return {
    telemetry: {
      ...telemetry,
      routeChoice: state.activeRouteId ?? telemetry.routeChoice
    },
    eventFeed: nextEvents,
    wallet: nextWallet,
    challenges: nextChallenges,
    fleetVehicles: updateFleetVehicles(state.fleetVehicles, telemetry),
    lastActionMessage: route ? `${route.label} telemetry updated.` : "Telemetry updated.",
    ...extra
  };
}

function createDemoTelemetry(state: DashboardState, tickIndex: number): ProcessedTelemetry {
  const routeId = state.activeRouteId ?? "eco";
  const isEcoRoute = routeId === "eco";
  const event = pickDemoEvent(tickIndex, routeId);
  const previous = state.telemetry;
  const harshPenalty = event === "harsh_brake" ? 18 : event === "aggressive_acceleration" ? 10 : event === "overspeed" ? 8 : 0;
  const smoothBonus = event === "smooth_streak" || event === "regen_success" ? 6 : 0;
  const wave = Math.sin(tickIndex / 2.2) * 4;
  const ecoScore = clamp((isEcoRoute ? 88 : 76) + wave + smoothBonus - harshPenalty, 38, 99);
  const speedKmh = clamp((isEcoRoute ? 38 : 48) + Math.sin(tickIndex / 1.6) * 11 + (event === "overspeed" ? 24 : 0), 0, 92);
  const coinsEarned = event === "smooth_streak" ? 5 : event === "regen_success" ? 8 : event === "harsh_brake" ? 0 : tickIndex % 4 === 0 ? 1 : 0;
  const energyDelta = isEcoRoute ? 0.018 : 0.027;
  const co2Delta = isEcoRoute ? 0.035 : 0.019;

  return {
    deviceId: "ecodrive-demo-01",
    ecoScore,
    speedKmh,
    event,
    hardBrakes: previous.hardBrakes + (event === "harsh_brake" ? 1 : 0),
    coinsEarned,
    totalCoins: state.wallet.rawCoins + coinsEarned,
    energyKwh: round(previous.energyKwh + energyDelta, 3),
    co2SavedKg: round(previous.co2SavedKg + co2Delta, 3),
    ledState: event === "harsh_brake" ? "red" : event === "aggressive_acceleration" || event === "overspeed" ? "amber" : "green",
    timestamp: Date.now(),
    distanceKm: round(previous.distanceKm + speedKmh / 3600, 3),
    batteryPercent: round(Math.max(12, previous.batteryPercent - (isEcoRoute ? 0.012 : 0.02)), 1),
    rangeKm: round(Math.max(40, previous.rangeKm - (isEcoRoute ? 0.18 : 0.26)), 1),
    regenKw: event === "regen_success" ? 28 : isEcoRoute ? 18 : 9,
    motorKw: round(isEcoRoute ? 34 + Math.abs(wave) : 48 + Math.abs(wave) * 1.5, 1),
    routeChoice: routeId
  };
}

function createInjectedTelemetry(
  previous: ProcessedTelemetry,
  event: DriveEventType,
  routeId: RouteId | null
): ProcessedTelemetry {
  const isHarsh = event === "harsh_brake";
  const score = clamp(previous.ecoScore + (isHarsh ? -18 : 8), 36, 99);

  return {
    ...previous,
    ecoScore: score,
    speedKmh: isHarsh ? Math.max(12, previous.speedKmh - 16) : Math.max(24, previous.speedKmh),
    event,
    hardBrakes: previous.hardBrakes + (isHarsh ? 1 : 0),
    coinsEarned: isHarsh ? 0 : 6,
    totalCoins: previous.totalCoins + (isHarsh ? 0 : 6),
    co2SavedKg: round(previous.co2SavedKg + (isHarsh ? 0.004 : 0.045), 3),
    ledState: isHarsh ? "red" : "green",
    timestamp: Date.now(),
    routeChoice: routeId ?? previous.routeChoice
  };
}

function pickDemoEvent(tickIndex: number, routeId: RouteId): DriveEventType {
  if (tickIndex % 17 === 0) return "finish_loop";
  if (tickIndex % 13 === 0) return routeId === "fast" ? "fast_route_warning" : "regen_success";
  if (tickIndex % 11 === 0) return "harsh_brake";
  if (tickIndex % 7 === 0) return "smooth_streak";
  if (tickIndex % 5 === 0 && routeId === "fast") return "aggressive_acceleration";
  return "smooth_segment";
}

function updateFleetVehicles(fleetVehicles: DashboardState["fleetVehicles"], telemetry: ProcessedTelemetry): FleetVehicle[] {
  return fleetVehicles.map((vehicle) => {
    if (vehicle.id !== "demo-unit") return vehicle;
    const status: FleetVehicle["status"] =
      telemetry.event === "harsh_brake" || telemetry.event === "aggressive_acceleration" ? "warning" : "live";

    return {
      ...vehicle,
      status,
      ecoScore: Math.round(telemetry.ecoScore),
      speedKmh: Math.round(telemetry.speedKmh),
      alert:
        telemetry.event === "harsh_brake"
          ? "Hard braking"
          : telemetry.event === "aggressive_acceleration"
            ? "Aggressive acceleration"
            : "ESP32/demo telemetry live",
      updatedAt: telemetry.timestamp
    };
  });
}

function addEvent(eventFeed: DashboardState["eventFeed"], event: DriveEventType, timestamp = Date.now()) {
  return [createDriveEvent(event, timestamp), ...eventFeed].slice(0, 8);
}

function getAdjacentAssetIds(cells: CityCell[], index: number) {
  const row = Math.floor(index / 8);
  const col = index % 8;
  const adjacent = [
    [row - 1, col],
    [row + 1, col],
    [row, col - 1],
    [row, col + 1]
  ];

  return adjacent
    .filter(([nextRow, nextCol]) => nextRow >= 0 && nextRow < 8 && nextCol >= 0 && nextCol < 8)
    .map(([nextRow, nextCol]) => cells[nextRow * 8 + nextCol]?.assetId)
    .filter((assetId): assetId is string => Boolean(assetId));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, precision: number) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}
