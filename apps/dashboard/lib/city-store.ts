"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { CityBuildingId, PlacedInfrastructure } from "../data/city-buildings";

type CityState = {
  infrastructure: PlacedInfrastructure[];
  hasHydrated: boolean;
  placeInfrastructure: (buildingId: CityBuildingId, x: number, y: number) => void;
  moveInfrastructure: (id: string, x: number, y: number) => void;
  rotateInfrastructure: (id: string) => void;
  removeInfrastructure: (id: string) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
};

export const useCityStore = create<CityState>()(
  persist(
    (set) => ({
      infrastructure: [],
      hasHydrated: false,
      placeInfrastructure: (buildingId, x, y) =>
        set((state) => ({
          infrastructure: [
            ...state.infrastructure,
            {
              id: createInfrastructureId(),
              buildingId,
              x: clampPosition(x),
              y: clampPosition(y),
              rotation: Math.round(Math.random() * 3) * 15 - 15
            }
          ]
        })),
      moveInfrastructure: (id, x, y) =>
        set((state) => ({
          infrastructure: state.infrastructure.map((item) =>
            item.id === id
              ? { ...item, x: clampPosition(x), y: clampPosition(y) }
              : item
          )
        })),
      rotateInfrastructure: (id) =>
        set((state) => ({
          infrastructure: state.infrastructure.map((item) =>
            item.id === id ? { ...item, rotation: (item.rotation + 45) % 360 } : item
          )
        })),
      removeInfrastructure: (id) =>
        set((state) => ({
          infrastructure: state.infrastructure.filter((item) => item.id !== id)
        })),
      setHasHydrated: (hasHydrated) => set({ hasHydrated })
    }),
    {
      name: "ecodrive-city-field-v2",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ infrastructure: state.infrastructure }),
      skipHydration: true,
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true)
    }
  )
);

function clampPosition(value: number) {
  return Math.min(92, Math.max(8, value));
}

function createInfrastructureId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `infrastructure-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
