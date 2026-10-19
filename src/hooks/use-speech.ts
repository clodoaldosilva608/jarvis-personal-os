"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useSpeech — Text-to-Speech (TTS) via Web Speech API.
 *
 * Funcionalidades:
 * - speak(text, opts): sintetiza voz em pt-BR
 * - cancel(): para a fala atual
 * - Estado: speaking, supported
 * - Callbacks: onStart, onEnd, onBoundary (para karaoke)
 *
 * Usa a Web Speech API nativa do navegador (window.speechSynthesis).
 * Funciona em Chrome, Edge, Safari e Firefox.
 */

interface SpeakOptions {
  voice?: SpeechSynthesisVoice;
  rate?: number;    // 0.1 - 10 (default 1)
  pitch?: number;   // 0 - 2 (default 1)
  volume?: number;  // 0 - 1 (default 1)
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (e: SpeechSynthesisErrorEvent) => void;
}

interface UseSpeechReturn {
  speak: (text: string, opts?: SpeakOptions) => void;
  cancel: () => void;
  speaking: boolean;
  supported: boolean;
  voices: SpeechSynthesisVoice[];
}

const PREFERRED_VOICES = [
  "pt-BR", "pt_BR", "pt",
  "Google português do Brasil",
  "Microsoft Antonio - Portuguese (Brazil)",
];

export function useSpeech(): UseSpeechReturn {
  const [speaking, setSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Carrega vozes (assíncrono em alguns navegadores)
  useEffect(() => {
    if (!supported) return;
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      setVoices(v);
    };
    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
  }, [supported]);

  const pickVoice = useCallback((preferred?: SpeechSynthesisVoice) => {
    if (preferred) return preferred;
    for (const lang of PREFERRED_VOICES) {
      const found = voices.find((v) => v.lang === lang || v.name.includes(lang));
      if (found) return found;
    }
    return voices[0];
  }, [voices]);

  const speak = useCallback((text: string, opts: SpeakOptions = {}) => {
    if (!supported || !text.trim()) {
      // TTS not supported — still fire onStart/onEnd so callers can transition
      // their UI state (otherwise the orb would stay "speaking" forever).
      opts.onStart?.();
      setTimeout(() => opts.onEnd?.(), 1500);
      return;
    }

    // Cancela fala anterior
    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "pt-BR";
    utter.voice = pickVoice(opts.voice);
    utter.rate = opts.rate ?? 1;
    utter.pitch = opts.pitch ?? 1;
    utter.volume = opts.volume ?? 1;

    // Safety net: if onend never fires (no voices, headless browser, OS kill),
    // auto-fire onEnd after a generous timeout derived from text length.
    const wordCount = text.trim().split(/\s+/).length;
    // Average speaking rate: ~150 words/minute = 2.5 words/sec.
    // Cap at 30s, min 2s.
    const fallbackMs = Math.max(2000, Math.min(30000, (wordCount / 2.5) * 1000));
    let ended = false;
    const safeEnd = () => {
      if (ended) return;
      ended = true;
      setSpeaking(false);
      opts.onEnd?.();
    };
    const fallback = setTimeout(safeEnd, fallbackMs);

    utter.onstart = () => {
      setSpeaking(true);
      opts.onStart?.();
    };
    utter.onend = () => {
      clearTimeout(fallback);
      safeEnd();
    };
    utter.onerror = (e) => {
      clearTimeout(fallback);
      setSpeaking(false);
      opts.onError?.(e);
    };

    utterRef.current = utter;
    window.speechSynthesis.speak(utter);

    // Edge case: if no voices are available, browsers may silently fail to
    // start. Fire onStart immediately + fallback onEnd to keep UI responsive.
    if (voices.length === 0) {
      setSpeaking(true);
      opts.onStart?.();
    }
  }, [supported, pickVoice, voices]);

  const cancel = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (supported) window.speechSynthesis.cancel();
    };
  }, [supported]);

  return { speak, cancel, speaking, supported, voices };
}
