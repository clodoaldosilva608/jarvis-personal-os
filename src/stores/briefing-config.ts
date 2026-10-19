import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Briefing configuration store — extended to match the master spec.
 *
 * New fields beyond the original:
 *   - emailAccounts[] (IMAP-based, password-of-app)
 *   - newsSources[] (site domains, comma-separated)
 *   - autoUpdateMinutes (numeric, default 15)
 *   - climateEnabled (boolean toggle)
 *   - spokenBriefing{} (nested object: autoDigest, mediumDigest, voiceReading,
 *     cardsWithPrints, modules[], newsCount, printRetentionDays)
 */

export type SpokenModule = "agenda" | "emails" | "news" | "climate" | "insights";
export type NewsCount = 1 | 2 | 3 | 5;
export type PrintRetentionDays = 1 | 3 | 7 | 30;

export interface AgendaSource {
  id: string;
  name: string;
  url: string;
}

export interface EmailAccount {
  id: string;
  alias: string; // apelido
  email: string;
  appPassword: string;
  /** IMAP host (auto-detected from domain, but user can override) */
  imapHost?: string;
  imapPort?: number;
}

export interface SpokenBriefingConfig {
  autoDigest: boolean;       // Gera uma vez por dia ao abrir o modo voz
  mediumDigest: boolean;     // ~1 minuto de leitura
  voiceReading: boolean;     // Mantém disponível para narração
  cardsWithPrints: boolean;  // Captura matérias para o HUD visual
  modules: SpokenModule[];   // Agenda, E-mails, Notícias, Clima, Insights
  newsCount: NewsCount;
  printRetentionDays: PrintRetentionDays;
}

export interface BriefingSettings {
  // Section 1: Agendas
  agendaSources: AgendaSource[];
  // Section 2: E-mail accounts (IMAP)
  emailAccounts: EmailAccount[];
  // Section 3: Radar e contexto
  newsTopics: string[];
  newsSources: string[]; // site domains like "g1.globo.com"
  location: string;
  timezone: string;
  autoUpdateMinutes: number;
  climateEnabled: boolean;
  // Section 4: Spoken briefing
  spokenBriefing: SpokenBriefingConfig;
  // Legacy fields kept for backward compat
  maxNews: NewsCount;
  spokenModules: SpokenModule[];
}

interface Store extends BriefingSettings {
  update: (p: Partial<BriefingSettings>) => void;
  addAgenda: (a: AgendaSource) => void;
  removeAgenda: (id: string) => void;
  addEmailAccount: (e: EmailAccount) => void;
  removeEmailAccount: (id: string) => void;
}

const DEFAULT_SPOKEN: SpokenBriefingConfig = {
  autoDigest: true,
  mediumDigest: false,
  voiceReading: true,
  cardsWithPrints: true,
  modules: ["agenda", "emails", "news", "climate"],
  newsCount: 3,
  printRetentionDays: 7,
};

export const DEFAULT_SETTINGS: BriefingSettings = {
  location: "Maceió",
  timezone: "America/Maceio",
  agendaSources: [],
  emailAccounts: [
    {
      id: "default-gmail",
      alias: "Pessoal",
      email: "lucasvictormkt@gmail.com",
      appPassword: "",
      imapHost: "imap.gmail.com",
      imapPort: 993,
    },
  ],
  newsTopics: ["tecnologia", "novos modelos de IA", "política"],
  newsSources: ["g1.globo.com", "tecmundo.com.br"],
  autoUpdateMinutes: 15,
  climateEnabled: true,
  spokenBriefing: DEFAULT_SPOKEN,
  maxNews: 3,
  spokenModules: ["agenda", "emails", "news", "climate"],
};

export const useBriefingConfig = create<Store>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      update: (p) => set(p),
      addAgenda: (a) => set((s) => ({ agendaSources: [...s.agendaSources, a] })),
      removeAgenda: (id) => set((s) => ({ agendaSources: s.agendaSources.filter((x) => x.id !== id) })),
      addEmailAccount: (e) => set((s) => ({ emailAccounts: [...s.emailAccounts, e] })),
      removeEmailAccount: (id) => set((s) => ({ emailAccounts: s.emailAccounts.filter((x) => x.id !== id) })),
    }),
    { name: "jarvis-briefing-config" },
  ),
);
