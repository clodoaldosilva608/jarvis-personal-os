/**
 * Smart home types — Routines, Devices, Integrations.
 * Matches the spec from the user's brief (lucasvictor.ai reference).
 */

export type OrbState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "identifying"
  | "success"
  | "error";

export type DeviceType = "switch" | "light" | "group" | "outlet";
export type DeviceSource = "ewelink" | "homeassistant";
export type DeviceStatus = "online" | "offline";
export type DeviceState = "on" | "off";

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  room?: string;
  status: DeviceStatus;
  state: DeviceState;
  source: DeviceSource;
}

export type RoutineStepType = "device" | "wait" | "speak";

export interface RoutineStepDevice {
  type: "device";
  deviceId: string;
  action: "on" | "off";
}
export interface RoutineStepWait {
  type: "wait";
  seconds: number;
}
export interface RoutineStepSpeak {
  type: "speak";
  text: string;
}
export type RoutineStep = RoutineStepDevice | RoutineStepWait | RoutineStepSpeak;

export interface RoutineEvents {
  bomDia?: boolean;
  rostoReconhecido?: boolean;
  monitorAtivado?: boolean;
}

export interface RoutineSchedule {
  days: number[]; // 0 = Sunday, 6 = Saturday
  startTime?: string; // "07:00"
  endTime?: string; // "10:00"
}

export interface Routine {
  id: string;
  name: string;
  phrases: string[];
  events: RoutineEvents;
  schedule?: RoutineSchedule;
  steps: RoutineStep[];
  enabled: boolean;
}

export type IntegrationStatus = "connected" | "needs_attention" | "disconnected";

export interface Integration {
  id: string;
  name: string;
  description?: string;
  status: IntegrationStatus;
  toolsCount: number;
  iconGlyph: string; // emoji or short symbol used as fallback
  /** Optional MCP server URL (eWeLink, Home Assistant) */
  mcpUrl?: string;
  /** Documentation/setup link */
  docsUrl?: string;
}
