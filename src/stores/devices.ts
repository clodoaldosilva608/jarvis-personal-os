import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Device } from "@/types/smarthome";

/**
 * Mocked smart home devices (eWeLink + Home Assistant).
 * In production these would come from the MCP server.
 */

const INITIAL_DEVICES: Device[] = [
  { id: "ew1", name: "Escritório", type: "switch", room: "Escritório", status: "online", state: "on", source: "ewelink" },
  { id: "ew2", name: "Sala de Jantar", type: "light", room: "Sala de Jantar", status: "online", state: "off", source: "ewelink" },
  { id: "ew3", name: "Quarto de Visitas", type: "light", room: "Quarto de Visitas", status: "online", state: "off", source: "ewelink" },
  { id: "ew4", name: "Quarto de Lucas", type: "light", room: "Quarto de Lucas", status: "online", state: "off", source: "ewelink" },
  { id: "ew5", name: "Interruptor (Grupo)", type: "group", room: "Casa inteira", status: "online", state: "off", source: "ewelink" },
  { id: "ha1", name: "Ventilador Sala", type: "switch", room: "Sala de Jantar", status: "online", state: "off", source: "homeassistant" },
  { id: "ha2", name: "Ar Condicionado", type: "outlet", room: "Quarto de Lucas", status: "online", state: "off", source: "homeassistant" },
  { id: "ha3", name: "Cafeteira", type: "outlet", room: "Cozinha", status: "online", state: "off", source: "homeassistant" },
];

interface DeviceStore {
  devices: Device[];
  toggle: (id: string) => void;
  set: (id: string, state: "on" | "off") => void;
  rename: (id: string, name: string) => void;
  remove: (id: string) => void;
}

export const useDevices = create<DeviceStore>()(
  persist(
    (set, get) => ({
      devices: INITIAL_DEVICES,
      toggle: (id) => {
        const d = get().devices.find((x) => x.id === id);
        if (!d || d.status === "offline") return;
        set((s) => ({
          devices: s.devices.map((x) => (x.id === id ? { ...x, state: x.state === "on" ? "off" : "on" } : x)),
        }));
      },
      set: (id, state) => set((s) => ({
        devices: s.devices.map((x) => (x.id === id ? { ...x, state } : x)),
      })),
      rename: (id, name) => set((s) => ({
        devices: s.devices.map((x) => (x.id === id ? { ...x, name } : x)),
      })),
      remove: (id) => set((s) => ({
        devices: s.devices.filter((x) => x.id !== id),
      })),
    }),
    { name: "jarvis-devices" },
  ),
);
