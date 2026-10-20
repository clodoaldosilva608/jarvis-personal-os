import { createFileRoute, Link, useHydrated } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, Mic, MicOff, X, MapPin, AlertCircle } from "lucide-react";
import { StatusBadge } from "@/components/jarvis";
import { Particles } from "@/components/jarvis/Particles";
import { BriefingOverlay } from "@/components/briefing/BriefingOverlay";
import { useJarvis, STATUS_LABEL } from "@/stores/jarvis";
import { useSpeech } from "@/hooks/use-speech";
import { useGemini } from "@/hooks/use-gemini";
import { useMorningBriefing } from "@/hooks/use-morning-briefing";
import { useUnlockFlow } from "@/hooks/use-unlock-flow";
import { useStt } from "@/hooks/use-stt";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useMonitors } from "@/stores/monitors";
import { useAIConfig } from "@/stores/ai-config";
import { useBriefingConfig } from "@/stores/briefing-config";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "J.A.R.V.I.S. — Sistema Operacional Pessoal" },
      { name: "description", content: "HUD conversacional do J.A.R.V.I.S. com orb de energia e voz." },
      { property: "og:title", content: "J.A.R.V.I.S. OS" },
      { property: "og:description", content: "Seu sistema operacional pessoal de IA." },
    ],
  }),
  component: Hud,
});

function Hud() {
  const { orbState, setOrbState, isUnlocked } = useJarvis();
  const { speak, cancel, supported: ttsSupported } = useSpeech();
  const { generate, isConfigured } = useGemini();
  const briefing = useMorningBriefing();
  const unlockFlow = useUnlockFlow();
  const stt = useStt("pt-BR");
  const geo = useGeolocation();
  const globalLocked = useMonitors((s) => s.globalLocked);
  const scanning = useMonitors((s) => s.scanning);
  const scanProgress = useMonitors((s) => s.scanProgress);
  const updateBriefingConfig = useBriefingConfig((s) => s.update);
  const [menuOpen, setMenuOpen] = useState(false);
  const [transcriptDisplay, setTranscriptDisplay] = useState<string>("");
  const hydrated = useHydrated();

  useEffect(() => {
    if (!isUnlocked) localStorage.setItem("jarvis-unlocked", "true");
  }, [isUnlocked]);

  // If GPS gives us a place name, update briefing config to use it
  useEffect(() => {
    if (geo.placeName && geo.placeName.length > 0) {
      const current = useBriefingConfig.getState().location;
      if (!current || current === "Maceió" || current === "Maragogi") {
        updateBriefingConfig({ location: geo.placeName.split(",")[0]! });
      }
    }
  }, [geo.placeName, updateBriefingConfig]);

  // When STT produces a final transcript, send to AI
  useEffect(() => {
    if (!stt.listening && stt.transcript && stt.transcript.trim().length > 0) {
      const query = stt.transcript.trim();
      setTranscriptDisplay(query);
      stt.reset();
      setTimeout(() => respond(query), 400);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stt.listening, stt.transcript]);

  // Display interim transcript while listening
  useEffect(() => {
    if (stt.interim) setTranscriptDisplay(stt.interim);
    else if (!stt.listening && transcriptDisplay) {
      setTimeout(() => setTranscriptDisplay(""), 2000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stt.interim, stt.listening]);

  const respond = async (query: string) => {
    if (!query.trim()) return;
    if (briefing.matchesGoodMorning(query)) {
      briefing.start();
      return;
    }
    if (unlockFlow.matchesActivate(query)) {
      unlockFlow.start();
      return;
    }
    if (unlockFlow.matchesLock(query)) {
      unlockFlow.lock();
      return;
    }
    if (!isConfigured) {
      setOrbState("speaking");
      speak("Por favor, configure sua chave de IA no menu lateral para que eu possa conversar com você.", {
        onEnd: () => setOrbState("idle"),
      });
      return;
    }
    setOrbState("thinking");
    try {
      const response = await generate(query);
      setOrbState("speaking");
      speak(response, { onEnd: () => setOrbState("idle") });
    } catch (e) {
      const err = e as { message?: string };
      setOrbState("speaking");
      speak(`Erro: ${err.message ?? "não consegui processar"}. Verifique sua chave de IA.`, {
        onEnd: () => setOrbState("idle"),
      });
    }
  };

  const toggleMic = async () => {
    if (briefing.running) { briefing.cancel(); return; }
    if (unlockFlow.running) { unlockFlow.cancel(); return; }
    if (orbState === "listening") { stt.stop(); return; }
    if (orbState === "speaking" || orbState === "scanning") {
      cancel();
      setOrbState("idle");
      return;
    }
    if (!stt.supported) {
      setOrbState("listening");
      setTimeout(() => respond("Bom dia. Pode me dar o briefing de hoje?"), 600);
      return;
    }
    setTranscriptDisplay("");
    await stt.start();
    setOrbState("listening");
  };

  // GPS runs silently on first mount if user has granted permission before
  useEffect(() => {
    if (hydrated && !geo.placeName && navigator.permissions) {
      navigator.permissions.query({ name: "geolocation" as PermissionName }).then((p) => {
        if (p.state === "granted") void geo.request();
      }).catch(() => { /* noop */ });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  const tone = orbState === "error" ? "danger" : orbState === "success" ? "success" : "primary";
  const isListening = orbState === "listening";

  const menuItems = [
    { to: "/briefing", label: "Briefing Matinal" },
    { to: "/chat", label: "Chat" },
    { to: "/ai-config", label: "Chave de IA", highlight: !isConfigured },
    { to: "/routines", label: "Rotinas" },
    { to: "/aparelhos", label: "Aparelhos" },
    { to: "/sources", label: "Fontes" },
    { to: "/news", label: "Notícias" },
    { to: "/monitors", label: "Monitores" },
    { to: "/finance", label: "Finanças" },
    { to: "/settings", label: "Configurações" },
  ] as const;

  const micLabel = briefing.running || unlockFlow.running
    ? "Toque para cancelar"
    : isListening
    ? stt.interim ? `Ouvindo: "${stt.interim.slice(0, 40)}…"` : "Ouvindo… toque para parar"
    : orbState === "speaking" || orbState === "scanning"
    ? "Toque para interromper"
    : "Toque para falar";

  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden">
      <div className="hud-grid absolute inset-0" />
      <div className="hud-vignette absolute inset-0" />
      <Particles />

      {/* === Briefing overlay (cards + caption) === */}
      {briefing.briefing && (
        <>
          <BriefingOverlay
            data={briefing.briefing}
            revealedCards={briefing.revealedCards}
            activeCard={briefing.activeCard}
          />
          {!briefing.running && briefing.revealedCards.closing && (
            <button
              onClick={briefing.dismiss}
              aria-label="Fechar briefing"
              className="fixed right-4 top-1/2 z-50 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-border-strong bg-card/60 text-muted-foreground backdrop-blur-xl transition hover:text-primary hover:neon-glow sm:right-5"
            >
              <X className="size-4" />
            </button>
          )}
        </>
      )}

      {/* === Top-left: minimal menu (very subtle — just dots icon, no visible button chrome) === */}
      <button
        onClick={() => setMenuOpen(true)}
        aria-label="Abrir menu"
        className="fixed left-4 top-4 z-40 flex size-10 items-center justify-center rounded-full text-muted-foreground/70 transition hover:text-primary sm:left-5 sm:top-5"
      >
        <Menu className="size-5" />
      </button>

      {/* === Top-right: minimal status badge + Configure IA hint === */}
      <div className="fixed right-4 top-4 z-40 flex items-center gap-2 sm:right-5 sm:top-5">
        {!isConfigured && hydrated && (
          <Link
            to="/ai-config"
            className="rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-warning sm:px-3 sm:py-1 sm:text-[10px]"
          >
            Configure IA
          </Link>
        )}
        <StatusBadge tone={tone} live dotted={orbState === "speaking" || orbState === "thinking"}>{STATUS_LABEL[orbState]}</StatusBadge>
      </div>

      {/* === Scan progress bar (only during scanning — minimal) === */}
      {scanning && (
        <div className="fixed left-1/2 top-16 z-40 w-64 max-w-[80vw] -translate-x-1/2 sm:w-80">
          <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wider text-primary">
            <span>SCAN</span>
            <span className="font-mono">{Math.round(scanProgress)}%</span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-glass">
            <div
              className="h-full bg-primary transition-all duration-200"
              style={{ width: `${scanProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* === STT transcript display (while listening or right after) === */}
      {(stt.listening || transcriptDisplay) && !briefing.briefing && (
        <div className="fixed left-1/2 top-24 z-30 w-80 max-w-[90vw] -translate-x-1/2 rounded-xl border border-primary/30 bg-card/60 p-3 backdrop-blur-xl sm:top-28">
          <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-primary">
            <Mic className="size-3" /> {stt.listening ? "Ouvindo…" : "Você disse:"}
          </div>
          <p className="text-sm text-foreground">
            {transcriptDisplay || "Fale agora…"}
            {stt.listening && <span className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-primary" />}
          </p>
        </div>
      )}

      {/* === STT/GPS error display === */}
      {(stt.error || geo.error) && (
        <div className="fixed left-1/2 top-44 z-30 w-80 max-w-[90vw] -translate-x-1/2 rounded-lg border border-destructive/40 bg-destructive/10 p-2.5 text-xs text-destructive sm:top-44">
          <AlertCircle className="mr-1.5 inline size-3.5" />
          {stt.error ?? geo.error}
        </div>
      )}

      {/* === Bottom-center: mic toggle (orb is clickable too) === */}
      <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 flex-col items-center gap-2 sm:bottom-8 sm:gap-3">
        <button
          onClick={toggleMic}
          aria-label={isListening ? "Parar de escutar" : "Falar com JARVIS"}
          className={cn(
            "flex size-16 items-center justify-center rounded-full border-2 backdrop-blur-xl transition-all duration-300 sm:size-20",
            isListening
              ? "border-primary bg-primary/25 text-primary neon-glow-strong scale-110"
              : briefing.running || unlockFlow.running
              ? "border-destructive bg-destructive/20 text-destructive hover:bg-destructive/30"
              : "border-border-strong bg-card/40 text-primary hover:neon-glow hover:scale-105"
          )}
        >
          {isListening ? <MicOff className="size-6 sm:size-7" /> : <Mic className="size-6 sm:size-7" />}
        </button>
        <p className="max-w-[90vw] text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-primary/80 text-glow sm:text-[11px] sm:tracking-[0.22em]">
          {micLabel}
        </p>
      </div>

      {/* === Subtle location indicator at bottom-left === */}
      {geo.placeName && !briefing.briefing && (
        <div className="fixed bottom-6 left-4 z-40 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-subtle sm:left-6">
          <MapPin className="size-3" />
          <span className="truncate max-w-[100px] sm:max-w-[160px]">{geo.placeName.split(",")[0]}</span>
        </div>
      )}

      {/* === Slide-in hamburger menu (only opens on demand) === */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="Menu de navegação">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
            aria-hidden
          />
          <nav className="glass relative flex h-full w-72 max-w-[80vw] flex-col border-r border-border-strong/40 p-5">
            <div className="mb-6 flex items-center justify-between">
              <span className="hud-label text-primary text-glow">J.A.R.V.I.S.</span>
              <button
                onClick={() => setMenuOpen(false)}
                aria-label="Fechar menu"
                className="rounded-md p-1.5 text-muted-foreground transition hover:text-primary"
              >
                ✕
              </button>
            </div>
            {geo.placeName && (
              <div className="mb-3 flex items-center gap-2 rounded-lg border border-success/30 bg-success/5 px-3 py-2 text-xs text-success/80">
                <MapPin className="size-3" />
                <span className="truncate">{geo.placeName}</span>
              </div>
            )}
            {!isConfigured && (
              <button
                onClick={() => {
                  if (!geo.placeName) void geo.request();
                }}
                className="mb-3 flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-xs text-accent-foreground transition hover:bg-accent/20"
              >
                <MapPin className="size-3" />
                {geo.status === "loading" ? "Detectando localização…" : "Ativar GPS"}
              </button>
            )}
            <Link
              to="/ai-config"
              onClick={() => setMenuOpen(false)}
              className={cn(
                "mb-3 flex items-center gap-2 rounded-lg border px-3 py-2.5 text-xs transition",
                isConfigured
                  ? "border-success/30 bg-success/5 text-success/80 hover:bg-success/10"
                  : "border-warning/40 bg-warning/10 text-warning hover:bg-warning/20"
              )}
            >
              <span className={cn("size-2 rounded-full", isConfigured ? "bg-success" : "bg-warning animate-pulse")} />
              <span className="flex-1 font-semibold uppercase tracking-wide">
                {isConfigured ? "IA CONFIGURADA" : "CONFIGURAR IA"}
              </span>
            </Link>
            <ul className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
              {menuItems.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "flex items-center justify-between rounded-lg border border-transparent px-3 py-2.5 text-sm text-muted-foreground transition hover:border-border-strong hover:bg-glass hover:text-primary",
                      "highlight" in item && item.highlight && "border-warning/30 text-warning hover:bg-warning/10 hover:text-warning"
                    )}
                  >
                    <span>{item.label}</span>
                    {"highlight" in item && item.highlight && (
                      <span className="size-1.5 rounded-full bg-warning animate-pulse" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t border-glass-border pt-4 text-[10px] uppercase tracking-wider text-subtle">
              {hydrated ? "Sistema online · dados locais" : "Inicializando…"}
            </div>
          </nav>
        </div>
      )}
    </main>
  );
}
