import { createFileRoute, Link, useHydrated } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, Mic, MicOff } from "lucide-react";
import { MicButton, StatusBadge } from "@/components/jarvis";
import { Particles } from "@/components/jarvis/Particles";
import { useJarvis, STATUS_LABEL } from "@/stores/jarvis";
import { useSpeech } from "@/hooks/use-speech";
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
  const { speak, cancel, speaking: ttsSpeaking, supported: ttsSupported } = useSpeech();
  const [menuOpen, setMenuOpen] = useState(false);
  const hydrated = useHydrated();

  // Auto-unlock for demo (remove this for production auth)
  useEffect(() => {
    if (!isUnlocked) {
      localStorage.setItem("jarvis-unlocked", "true");
    }
  }, [isUnlocked]);

  // Speak briefing when user toggles mic off after listening (mock conversation)
  const speakBriefing = () => {
    if (!ttsSupported) return;
    setOrbState("speaking");
    speak("Bom dia. Em que posso ajudar?", {
      onEnd: () => setOrbState("idle"),
    });
  };

  const toggleMic = () => {
    if (orbState === "listening") {
      // User stops listening → JARVIS thinks → responds
      setOrbState("thinking");
      setTimeout(() => speakBriefing(), 900);
    } else if (orbState === "speaking") {
      // Interrupt JARVIS while speaking
      cancel();
      setOrbState("idle");
    } else {
      // Start listening
      setOrbState("listening");
    }
  };

  const tone = orbState === "error" ? "danger" : orbState === "success" ? "success" : "primary";
  const isListening = orbState === "listening";

  // Menu items (link to other dashboard routes)
  const menuItems = [
    { to: "/briefing", label: "Briefing Matinal" },
    { to: "/chat", label: "Chat" },
    { to: "/routines", label: "Rotinas" },
    { to: "/aparelhos", label: "Aparelhos" },
    { to: "/news", label: "Notícias" },
    { to: "/monitors", label: "Monitores" },
    { to: "/finance", label: "Finanças" },
    { to: "/settings", label: "Configurações" },
  ] as const;

  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden">
      <div className="hud-grid absolute inset-0" />
      <div className="hud-vignette absolute inset-0" />
      <Particles />

      {/* NOTE: The animated Canvas Orb is rendered globally by <GlobalOrb /> in
          __root.tsx. It is the dominant visual element on this page. Nothing
          should cover it. */}

      {/* === Top-left: hamburger menu button === */}
      <button
        onClick={() => setMenuOpen(true)}
        aria-label="Abrir menu"
        className="fixed left-5 top-5 z-40 flex size-12 items-center justify-center rounded-full border border-border-strong bg-card/40 text-primary backdrop-blur-xl transition hover:neon-glow hover:scale-105"
        style={{ boxShadow: "0 0 16px oklch(0.85 0.15 205 / 0.20)" }}
      >
        <Menu className="size-5" />
      </button>

      {/* === Top-right: status badge (minimal — just current state) === */}
      <div className="fixed right-5 top-5 z-40">
        <StatusBadge tone={tone} live>{STATUS_LABEL[orbState]}</StatusBadge>
      </div>

      {/* === Bottom-center: mic toggle button (talk / stop listening) === */}
      <div className="fixed bottom-8 left-1/2 z-40 flex -translate-x-1/2 flex-col items-center gap-3">
        <button
          onClick={toggleMic}
          aria-label={isListening ? "Parar de escutar" : "Falar com JARVIS"}
          className={cn(
            "flex size-20 items-center justify-center rounded-full border-2 backdrop-blur-xl transition-all duration-300",
            isListening
              ? "border-primary bg-primary/25 text-primary neon-glow-strong scale-110"
              : "border-border-strong bg-card/40 text-primary hover:neon-glow hover:scale-105"
          )}
        >
          {isListening ? <MicOff className="size-7" /> : <Mic className="size-7" />}
        </button>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/80 text-glow">
          {isListening
            ? "Toque para parar"
            : orbState === "speaking"
            ? "Toque para interromper"
            : "Toque para falar"}
        </p>
      </div>

      {/* === Slide-in hamburger menu === */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-50 flex"
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navegação"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
            aria-hidden
          />
          {/* Menu panel */}
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
            <ul className="flex flex-1 flex-col gap-1.5">
              {menuItems.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-lg border border-transparent px-3 py-2.5 text-sm text-muted-foreground transition hover:border-border-strong hover:bg-glass hover:text-primary"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t border-glass-border pt-4 text-[10px] uppercase tracking-wider text-subtle">
              {hydrated ? "Sistema online" : "Inicializando…"}
            </div>
          </nav>
        </div>
      )}
    </main>
  );
}
