import { createFileRoute, Link, ClientOnly } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CloudSun, CalendarDays, LayoutGrid } from "lucide-react";
import { Orb } from "@/components/orb/Orb";
import { GlassCard, MicButton, StatusBadge, Waveform } from "@/components/jarvis";
import { Particles } from "@/components/jarvis/Particles";
import { useJarvis, STATUS_LABEL } from "@/stores/jarvis";
import type { OrbState } from "@/types/jarvis";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "J.A.R.V.I.S. — Sistema Operacional Pessoal" },
      { name: "description", content: "HUD conversacional do J.A.R.V.I.S. com orb de energia, voz e briefing matinal." },
      { property: "og:title", content: "J.A.R.V.I.S. OS" },
      { property: "og:description", content: "Seu sistema operacional pessoal de IA." },
    ],
  }),
  component: Hud,
});

const STATES: OrbState[] = ["idle", "listening", "thinking", "speaking", "identifying", "success", "error"];

function Hud() {
  const { orbState, setOrbState } = useJarvis();
  const [size, setSize] = useState(420);

  useEffect(() => {
    const f = () => setSize(Math.min(window.innerWidth * 0.92, window.innerHeight * 0.5, 560));
    f();
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);

  const toggleMic = () => {
    if (orbState === "listening") {
      setOrbState("thinking");
      setTimeout(() => setOrbState("speaking"), 1400);
      setTimeout(() => setOrbState("idle"), 5000);
    } else setOrbState("listening");
  };

  const tone = orbState === "error" ? "danger" : orbState === "success" ? "success" : "primary";
  const showCards = orbState === "speaking";

  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden bg-background">
      <div className="hud-grid absolute inset-0" />
      <div className="hud-vignette absolute inset-0" />
      <Particles />

      <header className="relative z-10 flex w-full items-center justify-between px-5 pt-5">
        <span className="hud-label text-primary text-glow">J.A.R.V.I.S.</span>
        <StatusBadge tone={tone} live>{STATUS_LABEL[orbState]}</StatusBadge>
        <Link to="/briefing" aria-label="Abrir dashboard" className="rounded-lg p-2 text-muted-foreground transition hover:text-primary">
          <LayoutGrid className="size-5" />
        </Link>
      </header>

      <section className="relative z-10 flex flex-1 w-full items-center justify-center">
        <ClientOnly fallback={<div style={{ width: size, height: size }} />}>
          <Orb state={orbState} size={size} userImage={orbState === "identifying" ? "https://i.pravatar.cc/300?img=12" : undefined} />
        </ClientOnly>

        <div className={`pointer-events-none absolute inset-x-4 top-4 flex justify-between gap-3 transition-all duration-500 md:inset-x-16 ${showCards ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"}`}>
          <GlassCard className="w-40 p-3 md:w-56 md:p-4">
            <div className="flex items-center gap-2 text-primary"><CloudSun className="size-4" /><span className="hud-label">Maragogi</span></div>
            <div className="mt-1 text-2xl font-semibold">29°</div>
            <div className="text-xs text-muted-foreground">Parcialmente nublado · 20% chuva</div>
          </GlassCard>
          <GlassCard className="w-40 p-3 md:w-56 md:p-4">
            <div className="flex items-center gap-2 text-primary"><CalendarDays className="size-4" /><span className="hud-label">Agenda</span></div>
            <div className="mt-1 text-sm font-medium">Reunião de produto</div>
            <div className="text-xs text-muted-foreground">Hoje · 10:30</div>
          </GlassCard>
        </div>
      </section>

      <footer className="relative z-10 flex flex-col items-center gap-4 pb-8">
        <Waveform active={orbState === "listening" || orbState === "speaking"} />
        <MicButton active={orbState === "listening"} onClick={toggleMic} />
        <div className="flex max-w-[92vw] flex-wrap justify-center gap-1.5">
          {STATES.map((s) => (
            <button key={s} onClick={() => setOrbState(s)} className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-wider transition ${orbState === s ? "border-primary text-primary" : "border-glass-border text-subtle hover:text-muted-foreground"}`}>
              {s}
            </button>
          ))}
        </div>
      </footer>
    </main>
  );
}
