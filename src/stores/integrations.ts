import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Integration, IntegrationStatus } from "@/types/smarthome";

const INITIAL_INTEGRATIONS: Integration[] = [
  {
    id: "ewelink",
    name: "eWeLink",
    description: "Controle de interruptores e tomadas Sonoff",
    status: "connected",
    toolsCount: 2,
    iconGlyph: "⚡",
    mcpUrl: "https://mcp.ewelink.cc/sse",
    docsUrl: "https://ewelink.cc",
  },
  {
    id: "homeassistant",
    name: "Home Assistant",
    description: "Automação residencial local",
    status: "connected",
    toolsCount: 5,
    iconGlyph: "🏠",
    mcpUrl: "http://homeassistant.local:8123/api",
    docsUrl: "https://www.home-assistant.io",
  },
  {
    id: "google-calendar",
    name: "Google Agenda",
    description: "Eventos e compromissos",
    status: "connected",
    toolsCount: 3,
    iconGlyph: "📅",
    docsUrl: "https://calendar.google.com",
  },
  {
    id: "gmail",
    name: "Gmail",
    description: "E-mails prioritários",
    status: "needs_attention",
    toolsCount: 2,
    iconGlyph: "✉️",
    docsUrl: "https://gmail.com",
  },
  {
    id: "whoop",
    name: "WHOOP",
    description: "Dados de recuperação e sono",
    status: "connected",
    toolsCount: 4,
    iconGlyph: "❤️",
    docsUrl: "https://whoop.com",
  },
  {
    id: "obsidian",
    name: "Obsidian",
    description: "Notas e vault pessoal",
    status: "disconnected",
    toolsCount: 0,
    iconGlyph: "📝",
    docsUrl: "https://obsidian.md",
  },
  {
    id: "google-drive",
    name: "Google Drive",
    description: "Documentos e arquivos",
    status: "disconnected",
    toolsCount: 0,
    iconGlyph: "📁",
    docsUrl: "https://drive.google.com",
  },
  {
    id: "notion",
    name: "Notion",
    description: "Workspace e docs",
    status: "disconnected",
    toolsCount: 0,
    iconGlyph: "🗂️",
    docsUrl: "https://notion.so",
  },
  {
    id: "plaud",
    name: "Plaud",
    description: "Transcrições de áudio",
    status: "disconnected",
    toolsCount: 0,
    iconGlyph: "🎙️",
    docsUrl: "https://plaud.ai",
  },
];

interface IntegrationStore {
  integrations: Integration[];
  setStatus: (id: string, status: IntegrationStatus) => void;
  connect: (id: string) => void;
  disconnect: (id: string) => void;
}

export const useIntegrations = create<IntegrationStore>()(
  persist(
    (set) => ({
      integrations: INITIAL_INTEGRATIONS,
      setStatus: (id, status) =>
        set((s) => ({
          integrations: s.integrations.map((i) => (i.id === id ? { ...i, status } : i)),
        })),
      connect: (id) =>
        set((s) => ({
          integrations: s.integrations.map((i) =>
            i.id === id ? { ...i, status: "connected" } : i
          ),
        })),
      disconnect: (id) =>
        set((s) => ({
          integrations: s.integrations.map((i) =>
            i.id === id ? { ...i, status: "disconnected" } : i
          ),
        })),
    }),
    { name: "jarvis-integrations" },
  ),
);
