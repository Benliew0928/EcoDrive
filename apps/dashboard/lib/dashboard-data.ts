import type { DashboardEvent, DriveEventType, ProcessedTelemetry } from "../types/dashboard";

const eventCopy: Record<DriveEventType, { label: string; severity: DashboardEvent["severity"] }> = {
  smooth_segment: { label: "Smooth driving segment received.", severity: "good" },
  smooth_streak: { label: "Smooth driving streak received.", severity: "good" },
  harsh_brake: { label: "Harsh braking event received.", severity: "danger" },
  aggressive_acceleration: { label: "Aggressive acceleration event received.", severity: "warning" },
  overspeed: { label: "Overspeed event received.", severity: "warning" },
  regen_success: { label: "Regenerative braking event received.", severity: "good" },
  route_selected: { label: "Route choice packet received.", severity: "neutral" },
  finish_loop: { label: "Drive loop completion packet received.", severity: "good" },
  launch_ready: { label: "Simulator launch-ready packet received.", severity: "neutral" },
  fast_route_warning: { label: "Fast route warning packet received.", severity: "warning" },
  idle: { label: "Idle telemetry packet received.", severity: "neutral" }
};

const hardwareCopy: Record<NonNullable<ProcessedTelemetry["ledState"]>, { led: string; oled: string; buzzer: string; color: string }> = {
  green: { led: "Green", oled: "Eco OK", buzzer: "Silent", color: "green" },
  amber: { led: "Amber", oled: "Caution", buzzer: "Soft alert", color: "amber" },
  red: { led: "Red", oled: "Correct driving", buzzer: "Warning beep", color: "red" },
  blue: { led: "Blue", oled: "System ready", buzzer: "Silent", color: "blue" }
};

export function createDashboardEvent(event: DriveEventType, timestamp = Date.now()): DashboardEvent {
  const copy = eventCopy[event] ?? eventCopy.idle;

  return {
    id: `${event}-${timestamp}`,
    event,
    label: copy.label,
    severity: copy.severity,
    timestamp
  };
}

export function hardwareFeedbackForTelemetry(telemetry: ProcessedTelemetry | null) {
  if (!telemetry?.ledState) {
    return {
      led: "--",
      oled: "Waiting for packet",
      buzzer: "Idle",
      color: "blue"
    };
  }

  return hardwareCopy[telemetry.ledState];
}

export function eventLabel(event: DriveEventType | undefined) {
  return event ? eventCopy[event]?.label ?? event.replaceAll("_", " ") : "Waiting for event packet";
}
