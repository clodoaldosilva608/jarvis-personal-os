import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Routine, RoutineStep } from "@/types/smarthome";

const INITIAL_ROUTINES: Routine[] = [
  {
    id: "r1",
    name: "Chegada em casa",
    phrases: ["cheguei", "tô em casa", "voltei"],
    events: { rostoReconhecido: true },
    steps: [
      { type: "speak", text: "Bem-vindo de volta, Senhor." },
      { type: "device", deviceId: "ew1", action: "on" },
    ],
    enabled: true,
  },
  {
    id: "r2",
    name: "Saída de casa",
    phrases: ["tô saindo", "até mais", "até já"],
    events: {},
    steps: [
      { type: "speak", text: "Até mais, Senhor. Vou apagar as luzes." },
      { type: "device", deviceId: "ew1", action: "off" },
      { type: "device", deviceId: "ew2", action: "off" },
      { type: "device", deviceId: "ew3", action: "off" },
      { type: "device", deviceId: "ew4", action: "off" },
    ],
    enabled: true,
  },
  {
    id: "r3",
    name: "Boa noite",
    phrases: ["boa noite", "vou dormir", "tchau JARVIS"],
    events: {},
    schedule: { days: [0, 1, 2, 3, 4, 5, 6], startTime: "22:00", endTime: "06:00" },
    steps: [
      { type: "speak", text: "Boa noite, Senhor. A casa está sendo preparada." },
      { type: "device", deviceId: "ew1", action: "off" },
      { type: "device", deviceId: "ew2", action: "off" },
      { type: "device", deviceId: "ew3", action: "off" },
      { type: "wait", seconds: 3 },
      { type: "device", deviceId: "ew4", action: "off" },
    ],
    enabled: true,
  },
  {
    id: "r4",
    name: "Bom dia",
    phrases: ["bom dia", "acordei"],
    events: { bomDia: true },
    schedule: { days: [1, 2, 3, 4, 5], startTime: "06:00", endTime: "11:00" },
    steps: [
      { type: "speak", text: "Bom dia, Senhor. Aqui está o seu briefing matinal." },
      { type: "device", deviceId: "ew1", action: "on" },
    ],
    enabled: false,
  },
];

interface RoutineStore {
  routines: Routine[];
  add: (r: Routine) => void;
  update: (id: string, patch: Partial<Routine>) => void;
  remove: (id: string) => void;
  toggle: (id: string) => void;
  /** Find a routine that matches a given spoken phrase (case-insensitive). */
  matchPhrase: (phrase: string) => Routine | null;
  /** Get a human-readable summary of a routine's steps for testing. */
  describeSteps: (steps: RoutineStep[]) => string[];
}

function describeDeviceStep(step: { type: "device"; deviceId: string; action: "on" | "off" }): string {
  // Avoid circular import — read from store at runtime instead.
  const devices = useDevices.getStateSafe?.() ?? null;
  let deviceName = step.deviceId;
  try {
    // dynamic import would be cleaner, but synchronous access is fine here
    const w = window as unknown as { __jarvisDevices?: Device[] };
    if (w.__jarvisDevices) {
      const d = w.__jarvisDevices.find((x) => x.id === step.deviceId);
      if (d) deviceName = d.name;
    }
  } catch { /* noop */ }
  return `${step.action === "on" ? "Ligar" : "Desligar"} ${deviceName}`;
}

import type { Device } from "@/types/smarthome";
import { useDevices } from "./devices";

export const useRoutines = create<RoutineStore>()(
  persist(
    (set, get) => ({
      routines: INITIAL_ROUTINES,
      add: (r) => set((s) => ({ routines: [...s.routines, r] })),
      update: (id, patch) =>
        set((s) => ({
          routines: s.routines.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        })),
      remove: (id) => set((s) => ({ routines: s.routines.filter((r) => r.id !== id) })),
      toggle: (id) =>
        set((s) => ({
          routines: s.routines.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)),
        })),
      matchPhrase: (phrase) => {
        const p = phrase.trim().toLowerCase();
        if (!p) return null;
        const routines = get().routines.filter((r) => r.enabled);
        for (const r of routines) {
          for (const rp of r.phrases) {
            if (p.includes(rp.toLowerCase()) || rp.toLowerCase().includes(p)) return r;
          }
        }
        return null;
      },
      describeSteps: (steps) =>
        steps.map((step) => {
          if (step.type === "device") {
            const d = useDevices.getState().devices.find((x) => x.id === step.deviceId);
            const name = d?.name ?? step.deviceId;
            return `${step.action === "on" ? "Ligar" : "Desligar"} ${name}`;
          }
          if (step.type === "wait") return `Esperar ${step.seconds}s`;
          return `Falar: "${step.text}"`;
        }),
    }),
    { name: "jarvis-routines" },
  ),
);
