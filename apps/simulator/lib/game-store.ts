"use client";

import { create } from "zustand";

export type RouteChoice = "unknown" | "eco" | "fast";

export type GameEvent =
  | "launch_ready"
  | "route_fork"
  | "smooth_segment"
  | "harsh_brake"
  | "regen_success"
  | "fast_route_warning"
  | "finish_loop";

export type ControlMode = "auto-cruise" | "keyboard" | "touch" | "controller-ready";

export type SimulatorControls = {
  throttle: number;
  brake: number;
  steering: number;
};

export type Telemetry = SimulatorControls & {
  speedKmh: number;
  ecoScore: number;
  routeChoice: RouteChoice;
  event: GameEvent;
  distanceMeters: number;
};

type RawInput = {
  touchThrottle: number;
  touchBrake: number;
  touchSteering: number;
  keys: Record<string, boolean>;
};

type GameStore = {
  controlMode: ControlMode;
  rawInput: RawInput;
  telemetry: Telemetry;
  setKey: (key: string, isPressed: boolean) => void;
  setTouchThrottle: (value: number) => void;
  setTouchBrake: (value: number) => void;
  setTouchSteering: (value: number) => void;
  setTelemetry: (telemetry: Telemetry) => void;
};

const initialTelemetry: Telemetry = {
  throttle: 0,
  brake: 0,
  steering: 0,
  speedKmh: 0,
  ecoScore: 84,
  routeChoice: "unknown",
  event: "launch_ready",
  distanceMeters: 0
};

export const useGameStore = create<GameStore>((set) => ({
  controlMode: "auto-cruise",
  rawInput: {
    touchThrottle: 0,
    touchBrake: 0,
    touchSteering: 0,
    keys: {}
  },
  telemetry: initialTelemetry,
  setKey: (key, isPressed) =>
    set((state) => ({
      controlMode: isPressed ? "keyboard" : state.controlMode,
      rawInput: {
        ...state.rawInput,
        keys: {
          ...state.rawInput.keys,
          [key.toLowerCase()]: isPressed
        }
      }
    })),
  setTouchThrottle: (value) =>
    set((state) => ({
      controlMode: value > 0 ? "touch" : state.controlMode,
      rawInput: {
        ...state.rawInput,
        touchThrottle: value
      }
    })),
  setTouchBrake: (value) =>
    set((state) => ({
      controlMode: value > 0 ? "touch" : state.controlMode,
      rawInput: {
        ...state.rawInput,
        touchBrake: value
      }
    })),
  setTouchSteering: (value) =>
    set((state) => ({
      controlMode: value !== 0 ? "touch" : state.controlMode,
      rawInput: {
        ...state.rawInput,
        touchSteering: value
      }
    })),
  setTelemetry: (telemetry) => set({ telemetry })
}));

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function damp(current: number, target: number, rate: number, dt: number) {
  return current + (target - current) * (1 - Math.exp(-rate * dt));
}
