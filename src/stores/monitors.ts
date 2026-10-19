import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Multi-monitor lock/unlock system.
 *
 * State is synced across windows/tabs via BroadcastChannel (so when the user
 * unlocks from the home HUD, all open windows/monitors unlock simultaneously).
 *
 * The store persists the `locked` flag and the list of monitor definitions.
 */

export type MonitorModule = "command-center" | "news-radar" | "hud" | "custom";

export interface MonitorState {
  id: string;
  name: string;
  locked: boolean;
  module: MonitorModule;
}

interface MonitorsStore {
  /** Global lock state — applies to all monitors when true. */
  globalLocked: boolean;
  /** Individual monitor states (mostly for display — when globalLocked
   * changes, all monitors visually lock/unlock together). */
  monitors: MonitorState[];
  /** True while a face-scan is in progress. */
  scanning: boolean;
  /** Scan progress 0..100. */
  scanProgress: number;
  setGlobalLocked: (v: boolean) => void;
  toggleGlobalLock: () => void;
  startScan: () => void;
  setScanProgress: (n: number) => void;
  finishScan: (success: boolean) => void;
  addMonitor: (m: MonitorState) => void;
  removeMonitor: (id: string) => void;
  /** Initialize BroadcastChannel sync. Safe to call multiple times. */
  initSync: () => () => void;
}

const INITIAL_MONITORS: MonitorState[] = [
  { id: "primary", name: "HUD Principal", locked: true, module: "hud" },
  { id: "left", name: "Centro de Comando", locked: true, module: "command-center" },
  { id: "right", name: "Radar de Notícias", locked: true, module: "news-radar" },
];

// BroadcastChannel is only available in the browser.
const BC_NAME = "jarvis-monitors-sync";
let bc: BroadcastChannel | null = null;
let bcListeners = new Set<(state: { globalLocked: boolean; scanning: boolean; scanProgress: number }) => void>();

function broadcast(state: { globalLocked: boolean; scanning: boolean; scanProgress: number }) {
  if (!bc) return;
  try {
    bc.postMessage({ type: "state", ...state });
  } catch { /* noop */ }
}

export const useMonitors = create<MonitorsStore>()(
  persist(
    (set, get) => ({
      globalLocked: true,
      monitors: INITIAL_MONITORS,
      scanning: false,
      scanProgress: 0,
      setGlobalLocked: (v) => {
        set({ globalLocked: v });
        broadcast({ globalLocked: v, scanning: false, scanProgress: 0 });
      },
      toggleGlobalLock: () => {
        const next = !get().globalLocked;
        set({ globalLocked: next });
        broadcast({ globalLocked: next, scanning: false, scanProgress: 0 });
      },
      startScan: () => {
        set({ scanning: true, scanProgress: 0 });
        broadcast({ globalLocked: true, scanning: true, scanProgress: 0 });
      },
      setScanProgress: (n) => {
        set({ scanProgress: n });
        broadcast({ globalLocked: true, scanning: true, scanProgress: n });
      },
      finishScan: (success) => {
        const next = !success; // success = unlock, failure = stay locked
        set({ scanning: false, scanProgress: success ? 100 : 0, globalLocked: next });
        broadcast({ globalLocked: next, scanning: false, scanProgress: success ? 100 : 0 });
      },
      addMonitor: (m) => set((s) => ({ monitors: [...s.monitors, m] })),
      removeMonitor: (id) => set((s) => ({ monitors: s.monitors.filter((x) => x.id !== id) })),
      initSync: () => {
        if (typeof window === "undefined") return () => {};
        if (!bc) {
          try {
            bc = new BroadcastChannel(BC_NAME);
            bc.onmessage = (e) => {
              const data = e.data as { type: string; globalLocked?: boolean; scanning?: boolean; scanProgress?: number };
              if (data.type === "state") {
                set({
                  globalLocked: data.globalLocked ?? get().globalLocked,
                  scanning: data.scanning ?? false,
                  scanProgress: data.scanProgress ?? 0,
                });
              }
            };
          } catch { /* BroadcastChannel not available */ }
        }
        return () => { /* keep channel alive across hook re-mounts */ };
      },
    }),
    { name: "jarvis-monitors" },
  ),
);
