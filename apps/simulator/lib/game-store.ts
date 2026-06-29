"use client";

import { create } from "zustand";

export type RouteChoice = "unknown" | "eco" | "fast";

export type GameEvent =
  | "launch_ready"
  | "route_fork"
  | "smooth_segment"
  | "smooth_streak"
  | "harsh_brake"
  | "aggressive_acceleration"
  | "overspeed"
  | "regen_success"
  | "fast_route_warning"
  | "reverse_mode"
  | "finish_loop";

export type ControlMode = "auto-cruise" | "keyboard" | "touch" | "controller" | "controller-ready";

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
  gamepadThrottle: number;
  gamepadBrake: number;
  gamepadSteering: number;
  gamepadConnected: boolean;
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
  setGamepadInput: (input: SimulatorControls & { connected: boolean; active: boolean }) => void;
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
    gamepadThrottle: 0,
    gamepadBrake: 0,
    gamepadSteering: 0,
    gamepadConnected: false,
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
  setGamepadInput: (input) =>
    set((state) => ({
      controlMode: input.connected
        ? input.active
          ? "controller"
          : state.controlMode === "controller" || state.controlMode === "auto-cruise"
            ? "controller-ready"
            : state.controlMode
        : state.controlMode === "controller" || state.controlMode === "controller-ready"
          ? "auto-cruise"
          : state.controlMode,
      rawInput: {
        ...state.rawInput,
        gamepadThrottle: input.throttle,
        gamepadBrake: input.brake,
        gamepadSteering: input.steering,
        gamepadConnected: input.connected
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
