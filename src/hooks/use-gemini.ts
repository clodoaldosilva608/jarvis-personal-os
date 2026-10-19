"use client";

import { useCallback } from "react";
import { GoogleGenAI } from "@google/genai";
import { useAIConfig, type GeminiModel } from "@/stores/ai-config";

/**
 * useGemini — React hook for calling Google's Gemini API directly from the
 * browser using the user's API key (stored in localStorage via useAIConfig).
 *
 * Get your free API key: https://aistudio.google.com/app/apikey
 *
 * Usage:
 *   const { generate, generateStream, testKey, isConfigured } = useGemini();
 *   const response = await generate("Olá, JARVIS");
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

export function useGemini(): UseGeminiReturn {
  const apiKey = useAIConfig((s) => s.apiKey);
  const model = useAIConfig((s) => s.model);
  const systemPrompt = useAIConfig((s) => s.systemPrompt);
  const configured = useAIConfig((s) => s.configured);
  const isConfigured = Boolean(apiKey && configured);

  /** Lazily build a GoogleGenAI client. The SDK caches per-api-key internally. */
  const getClient = useCallback(() => {
    if (!apiKey) throw new Error("API key não configurada. Acesse /ai-config.");
    return new GoogleGenAI({ apiKey });
  }, [apiKey]);

  const generate = useCallback(
    async (prompt: string, opts: GenerateOptions = {}): Promise<string> => {
      const client = getClient();
      const useModel = opts.model ?? model;
      const useSystem = opts.systemPrompt ?? systemPrompt;
      const contents: { role: string; parts: { text: string }[] }[] = [];
      if (opts.history && opts.history.length > 0) {
        for (const h of opts.history) {
          contents.push({ role: h.role, parts: [{ text: h.text }] });
        }
      }
      contents.push({ role: "user", parts: [{ text: prompt }] });

      const res = await client.models.generateContent({
        model: useModel,
        contents,
        config: {
          systemInstruction: useSystem,
          temperature: opts.temperature ?? 0.7,
          maxOutputTokens: opts.maxTokens ?? 1024,
        },
      });
      // res.text is a convenience getter that returns the first text part
      return res.text ?? "";
    },
    [getClient, model, systemPrompt],
  );

  const generateStream = useCallback(
    async function* (prompt: string, opts: GenerateOptions = {}): AsyncGenerator<string, void, unknown> {
      const client = getClient();
      const useModel = opts.model ?? model;
      const useSystem = opts.systemPrompt ?? systemPrompt;
      const contents: { role: string; parts: { text: string }[] }[] = [];
      if (opts.history && opts.history.length > 0) {
        for (const h of opts.history) {
          contents.push({ role: h.role, parts: [{ text: h.text }] });
        }
      }
      contents.push({ role: "user", parts: [{ text: prompt }] });

      const stream = await client.models.generateContentStream({
        model: useModel,
        contents,
        config: {
          systemInstruction: useSystem,
          temperature: opts.temperature ?? 0.7,
          maxOutputTokens: opts.maxTokens ?? 1024,
        },
      });
      for await (const chunk of stream) {
        const t = chunk.text;
        if (t) yield t;
      }
    },
    [getClient, model, systemPrompt],
  );

  const testKey = useCallback(async (key: string): Promise<{ ok: boolean; error?: string }> => {
    if (!key.trim()) return { ok: false, error: "Chave vazia" };
    try {
      const client = new GoogleGenAI({ apiKey: key });
      // Lightest possible call — list models. Cheaper than a generateContent.
      await client.models.list();
      return { ok: true };
    } catch (e) {
      const err = e as { message?: string; status?: number };
      const msg = err.message ?? "Erro desconhecido";
      // Common failure patterns:
      //  - 400: invalid key format
      //  - 403: key doesn't have Gemini API enabled
      //  - 429: rate-limited (key still valid)
      if (/429|rate/i.test(msg)) return { ok: true, error: "Rate-limited, mas chave válida" };
      return { ok: false, error: msg };
    }
  }, []);

  return { generate, generateStream, testKey, isConfigured };
}
