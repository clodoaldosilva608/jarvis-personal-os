"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useStt — Speech-to-Text via Web Speech API (SpeechRecognition).
 *
 * Works in Chrome, Edge, Safari, and Firefox (with prefix).
 * Captures user's voice from the microphone and converts to text.
 *
 * The browser asks for microphone permission on first use.
 *
 * Flow:
 *   const { start, stop, listening, transcript, supported } = useStt();
 *   start();           // begins listening, browser prompts for mic permission
 *   // ...user speaks...
 *   stop();            // ends capture
 *   console.log(transcript); // final text
 */

type RecognitionResult = { transcript: string; isFinal: boolean };

// Minimal type defs for the Web Speech API (not in standard TS DOM lib).
interface SpeechRecognitionEventLike {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
  resultIndex: number;
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((e: unknown) => void) | null;
  onend: ((e: unknown) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
}

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

interface UseSttReturn {
  start: () => Promise<void>;
  stop: () => void;
  listening: boolean;
  /** Final transcript accumulated since the last start. */
  transcript: string;
  /** Interim (partial) transcript — what's being heard right now. */
  interim: string;
  supported: boolean;
  error: string | null;
  reset: () => void;
}

export function useStt(lang = "pt-BR"): UseSttReturn {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const finalRef = useRef<string>("");
  const Ctor = typeof window !== "undefined" ? getRecognitionCtor() : null;
  const supported = Boolean(Ctor);

  const stop = useCallback(() => {
    try { recRef.current?.stop(); } catch { /* noop */ }
    setListening(false);
  }, []);

  const start = useCallback(async () => {
    if (!Ctor) {
      setError("Speech recognition não suportado neste navegador.");
      return;
    }
    setError(null);
    finalRef.current = "";
    setTranscript("");
    setInterim("");
    const rec = new Ctor();
    recRef.current = rec;
    rec.lang = lang;
    rec.continuous = false;      // single utterance per call
    rec.interimResults = true;   // show partial text as user speaks
    rec.maxAlternatives = 1;

    rec.onstart = () => setListening(true);
    rec.onend = () => {
      setListening(false);
      setInterim("");
      // commit finalRef to transcript so callers can read it
      setTranscript(finalRef.current);
    };
    rec.onerror = (e) => {
      const err = e.error ?? "unknown";
      if (err === "no-speech") setError("Nenhuma fala detectada.");
      else if (err === "aborted") { /* user aborted — silent */ }
      else if (err === "not-allowed" || err === "service-not-allowed") {
        setError("Permissão de microfone negada. Autorize o acesso nas configurações do navegador.");
      } else {
        setError(`Erro de reconhecimento: ${err}`);
      }
      setListening(false);
    };
    rec.onresult = (e) => {
      let interimText = "";
      let finalText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (!r) continue;
        const t = r[0]?.transcript ?? "";
        // we approximate "final" by checking index !== length-1 OR the API marks it
        // (SpeechRecognitionEvent.results[i].isFinal is standard but not in our minimal type)
        if ((r as unknown as { isFinal?: boolean }).isFinal) {
          finalText += t;
        } else {
          interimText += t;
        }
      }
      if (finalText) {
        finalRef.current += finalText;
        setTranscript(finalRef.current);
      }
      setInterim(interimText);
    };

    try {
      rec.start();
    } catch (e) {
      setError(`Não foi possível iniciar microfone: ${(e as Error).message}`);
    }
  }, [Ctor, lang]);

  const reset = useCallback(() => {
    finalRef.current = "";
    setTranscript("");
    setInterim("");
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      try { recRef.current?.abort?.(); } catch { /* noop */ }
    };
  }, []);

  return { start, stop, listening, transcript, interim, supported, error, reset };
}
