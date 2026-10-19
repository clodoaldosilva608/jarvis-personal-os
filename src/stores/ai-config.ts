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

export type GeminiModel = "gemini-3.8-flash" | "gemini-3.1-pro-preview" | "gemini-2.5-flash" | "gemini-2.5-pro" | "gemini-1.5-flash";

export const AVAILABLE_MODELS: { id: GeminiModel; label: string; description: string }[] = [
  { id: "gemini-3.8-flash", label: "Gemini 3.8 Flash", description: "Modelo mais recente e rápido — ideal para respostas em tempo real" },
  { id: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro (preview)", description: "Máxima qualidade — mais lento, com custos no plano pago" },
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash (legacy)", description: "Versão anterior do Flash — pode estar indisponível para novos usuários" },
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro (legacy)", description: "Versão anterior do Pro — pode estar indisponível para novos usuários" },
  { id: "gemini-1.5-flash", label: "Gemini 1.5 Flash (legacy)", description: "Modelo antigo, pode não estar mais disponível" },
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

// Pre-configured API key for the owner — ensures the app works out of the box.
// The actual key is NOT in source code (GitHub's secret scanner would block the push).
// Instead, it's injected at build time via Vercel env var: VITE_PRE_CONFIGURED_API_KEY
// Set this env var in your Vercel dashboard → Settings → Environment Variables.
const PRE_CONFIGURED_API_KEY =
  (typeof import.meta !== "undefined" &&
    (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_PRE_CONFIGURED_API_KEY) || "";

export const useAIConfig = create<AIConfigStore>()(
  persist(
    (set) => ({
      apiKey: PRE_CONFIGURED_API_KEY,
      model: "gemini-3.8-flash",
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      configured: Boolean(PRE_CONFIGURED_API_KEY),
      setApiKey: (apiKey) => set({ apiKey, configured: Boolean(apiKey.trim()) }),
      setModel: (model) => set({ model }),
      setSystemPrompt: (systemPrompt) => set({ systemPrompt }),
      setConfigured: (configured) => set({ configured }),
      clear: () => set({ apiKey: "", configured: false }),
    }),
    {
      name: "jarvis-ai-config",
      // On rehydrate, if the persisted state has no key but we have a pre-configured
      // one from env, use the pre-configured one. This handles first-visit-after-deploy.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AIConfigStore>;
        const apiKey = p.apiKey || PRE_CONFIGURED_API_KEY;
        const configured = p.configured ?? Boolean(apiKey);
        return {
          ...current,
          ...p,
          apiKey,
          configured,
        } as AIConfigStore;
      },
    },
  ),
);
