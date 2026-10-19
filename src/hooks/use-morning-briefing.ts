"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useJarvis } from "@/stores/jarvis";
import { useSpeech } from "@/hooks/use-speech";
import { MORNING_BRIEFING, DEFAULT_USER_IMAGE } from "@/lib/briefing-data";
import type { BriefingData, BriefingNarrationSegment } from "@/types/briefing";
import type { RevealedCards } from "@/components/briefing/BriefingOverlay";

/**
 * useMorningBriefing — orchestrates the full "Bom dia" cinematic flow.
 *
 * Flow:
 *   1. JARVIS says: "Bom dia, senhor. Só um instante enquanto confirmo sua identidade."
 *      Orb state → `identifying` (photo appears in center).
 *   2. After ~1.5s, orb → `speaking`.
 *   3. For each narration segment:
 *      - Speak the segment text via TTS.
 *      - Reveal the associated card (with optional revealDelayMs).
 *   4. After last segment, orb → `idle`. All cards remain visible.
 *
 * Trigger: call start() — typically when user says "bom dia" via mic or chat.
 *
 * Cancels: call cancel() to abort mid-flow (e.g. user clicked mic again).
 */
export function useMorningBriefing() {
  const setOrbState = useJarvis((s) => s.setOrbState);
  const { speak, cancel: cancelTTS, supported: ttsSupported } = useSpeech();

  const [briefing, setBriefing] = useState<BriefingData | null>(null);
  const [revealedCards, setRevealedCards] = useState<RevealedCards>({});
  const [activeCard, setActiveCard] = useState<keyof RevealedCards | undefined>(undefined);
  const [running, setRunning] = useState(false);
  const cancelledRef = useRef(false);

  /** Speak a single narration segment and resolve on end. */
  const speakSegment = useCallback(
    (text: string): Promise<void> => {
      return new Promise((resolve) => {
        if (!ttsSupported || !text.trim()) {
          // No TTS — fallback: estimate duration from word count.
          const wc = text.split(/\s+/).length;
          const ms = Math.max(1500, Math.min(15000, (wc / 2.5) * 1000));
          setTimeout(resolve, ms);
          return;
        }
        speak(text, { onEnd: () => resolve(), onError: () => resolve() });
      });
    },
    [speak, ttsSupported],
  );

  const revealCard = useCallback(
    (segment: BriefingNarrationSegment) => {
      const card = segment.revealCard;
      if (!card) return;
      const delay = segment.revealDelayMs ?? 200;
      setTimeout(() => {
        if (cancelledRef.current) return;
        setRevealedCards((prev) => ({ ...prev, [card]: true }));
        setActiveCard(card);
      }, delay);
    },
    [],
  );

  const start = useCallback(
    async (opts?: { userImage?: string }) => {
      if (running) return;
      cancelledRef.current = false;
      setRunning(true);
      setBriefing(MORNING_BRIEFING);
      setRevealedCards({});

      // === Step 1: identifying ===
      // Brief intro line + orb enters identifying state with the user photo.
      // We set the userImage on the global orb by setting state to "identifying"
      // — GlobalOrb already passes a default user image when state === "identifying".
      setOrbState("identifying");
      // Brief intro line — short, immediate response.
      await speakSegment("Bom dia, senhor. Só um instante enquanto confirmo sua identidade.");

      // Hold the identifying state for a moment to let the photo + scan ring show.
      if (cancelledRef.current) { setRunning(false); return; }
      await new Promise((r) => setTimeout(r, 1500));

      // === Step 2: speaking ===
      if (cancelledRef.current) { setRunning(false); return; }
      setOrbState("speaking");

      // === Step 3: narrate each segment ===
      for (const segment of MORNING_BRIEFING.narration) {
        if (cancelledRef.current) break;
        // Reveal the card associated with this segment BEFORE speaking it,
        // so the card appears in sync with the spoken text.
        revealCard(segment);
        await speakSegment(segment.text);
      }

      // === Step 4: closing — orb returns to idle ===
      if (cancelledRef.current) { setRunning(false); return; }
      setActiveCard("closing");
      setRevealedCards((prev) => ({ ...prev, closing: true }));
      setOrbState("idle");
      setRunning(false);
    },
    [running, setOrbState, speakSegment, revealCard],
  );

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    cancelTTS();
    setOrbState("idle");
    setActiveCard(undefined);
    setRunning(false);
    // Keep revealed cards visible — user can dismiss via X button if they want.
  }, [cancelTTS, setOrbState]);

  const dismiss = useCallback(() => {
    setBriefing(null);
    setRevealedCards({});
    setActiveCard(undefined);
  }, []);

  /** Detect "bom dia" (or "jarvis bom dia") in arbitrary text. Returns true if matched. */
  const matchesGoodMorning = useCallback((text: string): boolean => {
    const t = text.toLowerCase().trim();
    if (!t) return false;
    if (/(bom\s*dia|jarvis\s*boa\s*manhã|bomdia|boum?\s*dia)/i.test(t)) return true;
    return false;
  }, []);

  return {
    start,
    cancel,
    dismiss,
    running,
    briefing,
    revealedCards,
    activeCard,
    matchesGoodMorning,
  };
}
