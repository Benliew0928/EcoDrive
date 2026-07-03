"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { CityBuildingId, PlacedInfrastructure } from "../data/city-buildings";

type CityState = {
  infrastructure: PlacedInfrastructure[];
  warehouse: PlacedInfrastructure[];
  hasHydrated: boolean;
  placeInfrastructure: (buildingId: CityBuildingId, x: number, y: number) => void;
  placeFromWarehouse: (id: string, x: number, y: number) => void;
  moveInfrastructure: (id: string, x: number, y: number) => void;
  rotateInfrastructure: (id: string) => void;
  moveToWarehouse: (id: string) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
};

export const useCityStore = create<CityState>()(
  persist(
    (set) => ({
      infrastructure: [],
      warehouse: [],
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
      placeFromWarehouse: (id, x, y) =>
        set((state) => {
          const storedItem = state.warehouse.find((item) => item.id === id);
          if (!storedItem) return state;
          return {
            warehouse: state.warehouse.filter((item) => item.id !== id),
            infrastructure: [
              ...state.infrastructure,
              { ...storedItem, x: clampPosition(x), y: clampPosition(y) }
            ]
          };
        }),
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
      moveToWarehouse: (id) =>
        set((state) => {
          const storedItem = state.infrastructure.find((item) => item.id === id);
          if (!storedItem) return state;
          return {
            infrastructure: state.infrastructure.filter((item) => item.id !== id),
            warehouse: [...state.warehouse, storedItem]
          };
        }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated })
    }),
    {
      name: "ecodrive-city-field-v2",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ infrastructure: state.infrastructure, warehouse: state.warehouse }),
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
