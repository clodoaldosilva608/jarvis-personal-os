"use client";

import { useCallback } from "react";
import { GoogleGenAI } from "@google/genai";
import { useAIConfig, AVAILABLE_MODELS, type GeminiModel } from "@/stores/ai-config";

/**
 * useGemini — React hook for calling Google's Gemini API directly from the
 * browser using the user's API key (stored in localStorage via useAIConfig).
 *
 * Get your free API key: https://aistudio.google.com/app/apikey
 *
 * Robustness features:
 *   - Automatic retry on transient errors (503 high-demand, 429 rate-limit,
 *     network failures) with exponential backoff.
 *   - Automatic model fallback: if the primary model keeps failing, we try
 *     the next model in AVAILABLE_MODELS (best-effort, never throws the
 *     user into a dead-end).
 *   - testKey() validates the API key without making a generateContent call.
 */

interface GenerateOptions {
  /** Override the configured model for this call. */
  model?: GeminiModel;
  /** Override the system prompt for this call. */
  systemPrompt?: string;
  /** Conversation history (most-recent-last). Each entry: { role, text }. */
  history?: { role: "user" | "model"; text: string }[];
  /** Temperature (0 = deterministic, 1 = creative). Default 0.7. */
  temperature?: number;
  /** Max output tokens. Default 1024. */
  maxTokens?: number;
}

interface UseGeminiReturn {
  generate: (prompt: string, opts?: GenerateOptions) => Promise<string>;
  generateStream: (prompt: string, opts?: GenerateOptions) => AsyncGenerator<string, void, unknown>;
  testKey: (key: string) => Promise<{ ok: boolean; error?: string }>;
  isConfigured: boolean;
}

const MAX_RETRIES = 3;
const RETRYABLE_ERRORS = [
  /503/, /high demand/i, /unavailable/i, /service unavailable/i,
  /429/, /rate.?limit/i, /quota/i,
  /network|fetch|timeout/i, /ECONNRESET|ETIMEDOUT/,
];

function isRetryableError(msg: string): boolean {
  return RETRYABLE_ERRORS.some((re) => re.test(msg));
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Returns the ordered list of models to try, primary first. */
function getFallbackChain(primary: GeminiModel): GeminiModel[] {
  const chain: GeminiModel[] = [primary];
  for (const m of AVAILABLE_MODELS) {
    if (!chain.includes(m.id)) chain.push(m.id);
  }
  return chain;
}

export function useGemini(): UseGeminiReturn {
  const apiKey = useAIConfig((s) => s.apiKey);
  const model = useAIConfig((s) => s.model);
  const systemPrompt = useAIConfig((s) => s.systemPrompt);
  const configured = useAIConfig((s) => s.configured);
  const isConfigured = Boolean(apiKey && configured);

  const getClient = useCallback(() => {
    if (!apiKey) throw new Error("API key não configurada. Acesse /ai-config.");
    return new GoogleGenAI({ apiKey });
  }, [apiKey]);

  const generate = useCallback(
    async (prompt: string, opts: GenerateOptions = {}): Promise<string> => {
      const client = getClient();
      const primaryModel = opts.model ?? model;
      const useSystem = opts.systemPrompt ?? systemPrompt;
      const contents: { role: string; parts: { text: string }[] }[] = [];
      if (opts.history && opts.history.length > 0) {
        for (const h of opts.history) {
          contents.push({ role: h.role, parts: [{ text: h.text }] });
        }
      }
      contents.push({ role: "user", parts: [{ text: prompt }] });

      // Try primary model, then fall back to others on retryable errors.
      const chain = getFallbackChain(primaryModel);
      let lastErr: Error | null = null;
      for (const tryModel of chain) {
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
          try {
            const res = await client.models.generateContent({
              model: tryModel,
              contents,
              config: {
                systemInstruction: useSystem,
                temperature: opts.temperature ?? 0.7,
                maxOutputTokens: opts.maxTokens ?? 1024,
              },
            });
            return res.text ?? "";
          } catch (e) {
            const err = e as { message?: string };
            const msg = err.message ?? "Erro desconhecido";
            lastErr = new Error(msg);
            // Non-retryable error (404 model not found, 401 invalid key, etc.)
            // — skip to next model in the chain, don't retry same model.
            if (!isRetryableError(msg)) break;
            // 404 "no longer available" specifically should switch models
            if (/404|no longer available|not found/i.test(msg)) break;
            // Retryable: backoff before next attempt
            await sleep(500 * Math.pow(2, attempt)); // 500ms, 1s, 2s
          }
        }
      }
      throw lastErr ?? new Error("Todas as tentativas falharam.");
    },
    [getClient, model, systemPrompt],
  );

  const generateStream = useCallback(
    async function* (prompt: string, opts: GenerateOptions = {}): AsyncGenerator<string, void, unknown> {
      const client = getClient();
      const primaryModel = opts.model ?? model;
      const useSystem = opts.systemPrompt ?? systemPrompt;
      const contents: { role: string; parts: { text: string }[] }[] = [];
      if (opts.history && opts.history.length > 0) {
        for (const h of opts.history) {
          contents.push({ role: h.role, parts: [{ text: h.text }] });
        }
      }
      contents.push({ role: "user", parts: [{ text: prompt }] });

      // For streaming, we only try one model (the configured one) — falling
      // back mid-stream would be jarring. If it fails repeatedly, the caller
      // can re-send and we'll switch models on the retry.
      const chain = getFallbackChain(primaryModel);
      let lastErr: Error | null = null;
      for (const tryModel of chain) {
        let yielded = false;
        try {
          const stream = await client.models.generateContentStream({
            model: tryModel,
            contents,
            config: {
              systemInstruction: useSystem,
              temperature: opts.temperature ?? 0.7,
              maxOutputTokens: opts.maxTokens ?? 1024,
            },
          });
          for await (const chunk of stream) {
            const t = chunk.text;
            if (t) {
              yielded = true;
              yield t;
            }
          }
          return; // success
        } catch (e) {
          const err = e as { message?: string };
          const msg = err.message ?? "Erro desconhecido";
          lastErr = new Error(msg);
          // If we already yielded content, we can't switch models — return.
          if (yielded) return;
          // Non-retryable: try next model
          if (!isRetryableError(msg)) continue;
          if (/404|no longer available|not found/i.test(msg)) continue;
          // Retryable on the SAME model with backoff, then move on if still failing
          await sleep(800);
        }
      }
      throw lastErr ?? new Error("Streaming falhou em todos os modelos.");
    },
    [getClient, model, systemPrompt],
  );

  const testKey = useCallback(async (key: string): Promise<{ ok: boolean; error?: string }> => {
    if (!key.trim()) return { ok: false, error: "Chave vazia" };
    try {
      const client = new GoogleGenAI({ apiKey: key });
      await client.models.list();
      return { ok: true };
    } catch (e) {
      const err = e as { message?: string; status?: number };
      const msg = err.message ?? "Erro desconhecido";
      if (/429|rate|quota/i.test(msg)) return { ok: true, error: "Rate-limited, mas chave válida" };
      if (/location|região|not supported/i.test(msg)) {
        return { ok: true, error: "Chave válida — restrição geográfica neste ambiente. Deve funcionar do seu navegador." };
      }
      return { ok: false, error: msg };
    }
  }, []);

  return { generate, generateStream, testKey, isConfigured };
}
