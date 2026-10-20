import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Integration, IntegrationStatus } from "@/types/smarthome";

/**
 * Integrações reais do vídeo de referência @lucasvictor.ai.
 * Mantém eWeLink + Home Assistant + adiciona os serviços que aparecem no vídeo.
 */

const INITIAL_INTEGRATIONS: Integration[] = [
  {
    id: "ewelink",
    name: "eWeLink (Sonoff)",
    description: "Interruptores, tomadas e lâmpadas Sonoff via eWeLink",
    status: "connected",
    toolsCount: 2,
    iconGlyph: "⚡",
    mcpUrl: "https://api-pix.coolkit.co/v2/webhook/pass-through",
    docsUrl: "https://ewelink.cc",
  },
  {
    id: "home-assistant",
    name: "Home Assistant",
    description: "Sensores, iluminação e ventiladores do seu lar",
    status: "needs_attention",
    toolsCount: 5,
    iconGlyph: "🏠",
    mcpUrl: "http://homeassistant.local:8123/api",
    docsUrl: "https://www.home-assistant.io",
  },
  {
    id: "fitness-syncer",
    name: "FitnessSyncer",
    description: "Saúde, bem-estar e sincronização de dados",
    status: "connected",
    toolsCount: 4,
    iconGlyph: "❤️",
    docsUrl: "https://fitnesssyncer.com",
  },
  {
    id: "gravilo",
    name: "Gravilo",
    description: "Notas e transcrições de áudios",
    status: "disconnected",
    toolsCount: 0,
    iconGlyph: "📝",
    docsUrl: "https://gravilo.com",
  },
  {
    id: "ehail-link",
    name: "eHail.link",
    description: "Servidor remoto MCP para integração de dispositivos",
    status: "connected",
    toolsCount: 2,
    iconGlyph: "🔗",
    mcpUrl: "https://ehail.link/mcp",
    docsUrl: "https://ehail.link",
  },
  {
    id: "pix",
    name: "Pagamento instantâneo no PIX",
    description: "Receber e enviar pagamentos via PIX",
    status: "connected",
    toolsCount: 2,
    iconGlyph: "💸",
    mcpUrl: "https://api-pix.coolkit.co/v2/webhook/pass-through?key=...",
    docsUrl: "https://www.bcb.gov.br/estabilidadefinanceira/pix",
  },
  {
    id: "tabela-vantagem",
    name: "Tabela Vantagem",
    description: "Tabela de preços e atalhos para produtos",
    status: "connected",
    toolsCount: 3,
    iconGlyph: "📊",
    docsUrl: "https://tabelavantagem.com.br",
  },
  {
    id: "banco",
    name: "Banco (Nubank)",
    description: "Transações, saldo e faturas do banco",
    status: "connected",
    toolsCount: 4,
    iconGlyph: "🏦",
    docsUrl: "https://nubank.com.br",
  },
  {
    id: "agenda",
    name: "Google Agenda",
    description: "Compromissos e eventos da operação",
    status: "needs_attention",
    toolsCount: 3,
    iconGlyph: "📅",
    mcpUrl: "https://calendar.google.com/mcp",
    docsUrl: "https://calendar.google.com",
  },
  {
    id: "world-tides",
    name: "WorldTides",
    description: "Previsão de marés no seu local",
    status: "connected",
    toolsCount: 1,
    iconGlyph: "🌊",
    docsUrl: "https://www.worldtides.com",
  },
  {
    id: "google-contacts",
    name: "Google Contatos",
    description: "Pessoas e contatos sincronizados",
    status: "needs_attention",
    toolsCount: 2,
    iconGlyph: "👥",
    docsUrl: "https://contacts.google.com",
  },
  {
    id: "gmail",
    name: "Gmail",
    description: "E-mails prioritários via IMAP",
    status: "connected",
    toolsCount: 2,
    iconGlyph: "✉️",
    docsUrl: "https://gmail.com",
  },
  {
    id: "obsidian",
    name: "Obsidian",
    description: "Notas e vault pessoal",
    status: "disconnected",
    toolsCount: 0,
    iconGlyph: "🗂️",
    docsUrl: "https://obsidian.md",
  },
  {
    id: "notion",
    name: "Notion",
    description: "Workspace, docs e tarefas",
    status: "disconnected",
    toolsCount: 0,
    iconGlyph: "📓",
    docsUrl: "https://notion.so",
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
