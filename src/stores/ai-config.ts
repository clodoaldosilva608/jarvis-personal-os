import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * AI configuration store.
 *
 * Stores the user's Google AI Studio (Gemini) API key in localStorage so
 * the app can call Gemini directly from the browser. This is a personal-OS
 * pattern: the key lives in the user's browser, never on the server.
 *
 * Get a free API key at: https://aistudio.google.com/app/apikey
 */

export type GeminiModel = "gemini-2.0-flash" | "gemini-2.5-flash" | "gemini-2.5-pro" | "gemini-1.5-flash" | "gemini-1.5-pro";

export const AVAILABLE_MODELS: { id: GeminiModel; label: string; description: string }[] = [
  { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash", description: "Mais rápido, baixo custo — ideal para respostas em tempo real" },
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", description: "Equilíbrio entre velocidade e qualidade" },
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro", description: "Máxima qualidade, mais lento e caro" },
  { id: "gemini-1.5-flash", label: "Gemini 1.5 Flash (legacy)", description: "Modelo antigo, ainda funcional" },
  { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro (legacy)", description: "Modelo antigo pro, ainda funcional" },
];

export const GOOGLE_AI_STUDIO_URL = "https://aistudio.google.com/app/apikey";
export const GOOGLE_AI_STUDIO_HELP_URL = "https://ai.google.dev/gemini-api/docs/api-key";

interface AIConfigStore {
  apiKey: string;
  model: GeminiModel;
  systemPrompt: string;
  /** True after the user has saved at least one valid key (used to gate AI features). */
  configured: boolean;
  setApiKey: (k: string) => void;
  setModel: (m: GeminiModel) => void;
  setSystemPrompt: (p: string) => void;
  setConfigured: (v: boolean) => void;
  clear: () => void;
}

const DEFAULT_SYSTEM_PROMPT = `Você é o J.A.R.V.I.S., o sistema operacional pessoal do usuário.
Responda em português brasileiro, com tom conciso, profissional e levemente irônico (estilo Tony Stark).
Quando o usuário pedir tarefas práticas (clima, agenda, notícias), seja objetivo.
Quando perguntar algo conceitual, dê respostas completas mas sem enrolação.
Use Markdown leve (negrito, listas) quando ajudar a legibilidade.`;

export const useAIConfig = create<AIConfigStore>()(
  persist(
    (set) => ({
      apiKey: "",
      model: "gemini-2.0-flash",
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      configured: false,
      setApiKey: (apiKey) => set({ apiKey }),
      setModel: (model) => set({ model }),
      setSystemPrompt: (systemPrompt) => set({ systemPrompt }),
      setConfigured: (configured) => set({ configured }),
      clear: () => set({ apiKey: "", configured: false }),
    }),
    { name: "jarvis-ai-config" },
  ),
);
