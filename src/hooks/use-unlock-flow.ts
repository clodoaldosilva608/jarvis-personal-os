"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMonitors } from "@/stores/monitors";
import { useJarvis } from "@/stores/jarvis";
import { useSpeech } from "@/hooks/use-speech";
import { DEFAULT_USER_IMAGE } from "@/lib/briefing-data";

/**
 * useUnlockFlow — orchestrates the multi-monitor unlock sequence.
 *
 * Flow:
 *   1. User says "Jarvis, ativar monitor" / "Jarvis, desbloquear"
 *   2. JARVIS: "Só um instante enquanto confirmo sua identidade."
 *   3. Orb state → "scanning" (face recognition visual)
 *   4. Scan progresses 0 → 100 over ~2s
 *   5. On success: all monitors unlock simultaneously via BroadcastChannel
 *      Orb state → "success" briefly, then "idle"
 *   6. On failure: orb → "error", monitors stay locked
 */
export function useUnlockFlow() {
  const monitors = useMonitors();
  const setOrbState = useJarvis((s) => s.setOrbState);
  const { speak, supported: ttsSupported } = useSpeech();
  const [running, setRunning] = useState(false);
  const cancelledRef = useRef(false);

  // Always init BroadcastChannel sync on mount.
  useEffect(() => {
    return monitors.initSync();
  }, [monitors]);

  const speakSync = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!ttsSupported || !text.trim()) {
        const wc = text.split(/\s+/).length;
        const ms = Math.max(1500, Math.min(10000, (wc / 2.5) * 1000));
        setTimeout(resolve, ms);
        return;
      }
      speak(text, { onEnd: resolve, onError: resolve });
    });
  }, [speak, ttsSupported]);

  const start = useCallback(async (): Promise<void> => {
    if (running) return;
    if (!monitors.globalLocked) {
      // Already unlocked — narrate status.
      setOrbState("speaking");
      await speakSync("Sistema já está ativo, senhor. Todos os monitores operando normalmente.");
      setOrbState("idle");
      return;
    }
    cancelledRef.current = false;
    setRunning(true);

    // Step 1: narrate "Só um instante enquanto confirmo sua identidade."
    setOrbState("scanning");
    monitors.startScan();
    await speakSync("Só um instante enquanto confirmo sua identidade.");
    if (cancelledRef.current) { setRunning(false); return; }

    // Step 2: scan progress (mock ~2s with progress increments)
    for (let p = 0; p <= 100; p += 10) {
      if (cancelledRef.current) break;
      monitors.setScanProgress(p);
      await new Promise((r) => setTimeout(r, 180));
    }
    if (cancelledRef.current) { setRunning(false); return; }

    // Step 3: success — unlock all monitors
    monitors.finishScan(true);
    setOrbState("success");
    await speakSync("Identidade confirmada. Inicializando todos os monitores.");
    setTimeout(() => setOrbState("idle"), 1500);
    setRunning(false);
  }, [running, monitors, setOrbState, speakSync]);

  const lock = useCallback(async (): Promise<void> => {
    if (running) return;
    cancelledRef.current = false;
    setRunning(true);
    setOrbState("speaking");
    monitors.setGlobalLocked(true);
    await speakSync("Bloqueando todos os monitores. Interface protegida.");
    setOrbState("idle");
    setRunning(false);
  }, [running, monitors, setOrbState, speakSync]);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    monitors.finishScan(false);
    setOrbState("idle");
    setRunning(false);
  }, [monitors, setOrbState]);

  /** Detect "ativar monitor" / "desbloquear" / "ativar sistema" in arbitrary text. */
  const matchesActivate = useCallback((text: string): boolean => {
    const t = text.toLowerCase().trim();
    if (!t) return false;
    return /(ativar\s+(monitor|sistema|interface|jarvis)|desbloquear|desbloqueia|liberar?\s+(sistema|interface|monitores))/i.test(t);
  }, []);

  /** Detect "bloquear monitor" / "travar sistema". */
  const matchesLock = useCallback((text: string): boolean => {
    const t = text.toLowerCase().trim();
    if (!t) return false;
    return /(bloquear|travar|bloqueia|ativa\s+proteção|proteger?\s+(sistema|interface))/i.test(t);
  }, []);

  return {
    start,         // unlock flow
    lock,          // lock flow
    cancel,        // abort mid-scan
    running,
    matchesActivate,
    matchesLock,
  };
}
