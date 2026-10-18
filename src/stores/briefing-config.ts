import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SpokenModule = "weather" | "agenda" | "news" | "emails" | "insights";

export interface AgendaSource { id: string; name: string; url: string }

export interface BriefingSettings {
  location: string;
  timezone: string;
  agendaSources: AgendaSource[];
  newsTopics: string[];
  spokenModules: SpokenModule[];
  maxNews: 1 | 2 | 3 | 5;
}

interface Store extends BriefingSettings {
  update: (p: Partial<BriefingSettings>) => void;
}

export const DEFAULT_SETTINGS: BriefingSettings = {
  location: "Maragogi",
  timezone: "America/Maceio",
  agendaSources: [],
  newsTopics: ["tecnologia", "inteligência artificial"],
  spokenModules: ["weather", "agenda", "news"],
  maxNews: 3,
};

export const useBriefingConfig = create<Store>()(
  persist((set) => ({ ...DEFAULT_SETTINGS, update: (p) => set(p) }), { name: "jarvis-briefing-config" }),
);
