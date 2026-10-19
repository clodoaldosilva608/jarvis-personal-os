import { create } from "zustand";
import type { Briefing, OrbState } from "@/types/jarvis";

interface JarvisStore {
  orbState: OrbState;
  isUnlocked: boolean;
  currentBriefing: Briefing | null;
  setOrbState: (s: OrbState) => void;
  setUnlocked: (v: boolean) => void;
  setBriefing: (b: Briefing | null) => void;
}

export const useJarvis = create<JarvisStore>((set) => ({
  orbState: "idle",
  isUnlocked: false,
  currentBriefing: null,
  setOrbState: (orbState) => set({ orbState }),
  setUnlocked: (isUnlocked) => set({ isUnlocked }),
  setBriefing: (currentBriefing) => set({ currentBriefing }),
}));

export const STATUS_LABEL: Record<OrbState, string> = {
  idle: "EM ESPERA",
  listening: "OUVINDO",
  speaking: "FALANDO",
  thinking: "PROCESSANDO",
  identifying: "IDENTIFICANDO",
  success: "ACESSO LIBERADO",
  error: "FALHA",
};
