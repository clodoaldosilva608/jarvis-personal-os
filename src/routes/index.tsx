import { createFileRoute, Link, ClientOnly } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CloudSun, CalendarDays, LayoutGrid, Mail, Newspaper, Droplets, Wind, Thermometer, Activity, Heart, Moon, Cpu } from "lucide-react";
import { Orb } from "@/components/orb/Orb";
import { GlassCard, MicButton, StatusBadge, Waveform } from "@/components/jarvis";
import { Particles } from "@/components/jarvis/Particles";
import { useJarvis, STATUS_LABEL } from "@/stores/jarvis";
import { useBriefingConfig } from "@/stores/briefing-config";
import type { OrbState } from "@/types/jarvis";
import { cn } from "@/lib/utils";

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
const CATS = ["email", "weather", "agenda", "news"] as const;
type Cat = typeof CATS[number];

const WIDGETS = [
  { icon: CloudSun, label: "Clima", title: "—", value: "29°" },
  { icon: CalendarDays, label: "Agenda", title: "Livre", value: "" },
  { icon: Mail, label: "E-mails", title: "5 prioritárias", value: "" },
  { icon: Newspaper, label: "Notícias", title: "3 novas", value: "" },
  { icon: Heart, label: "Saúde", title: "WHOOP 85%", value: "" },
  { icon: Moon, label: "Sono", title: "7.4h", value: "" },
];

function Hud() {
  const { orbState, setOrbState } = useJarvis();
  const { location } = useBriefingConfig();
  const [size, setSize] = useState(420);
  const [cat, setCat] = useState<Cat>("email");

  useEffect(() => {
    const f = () => setSize(Math.min(window.innerWidth * 0.7, window.innerHeight * 0.4, 480));
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

  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden bg-background">
      <div className="hud-grid absolute inset-0" />
      <div className="hud-vignette absolute inset-0" />
      <Particles />

      {/* Header: JARVIS + status + dashboard link */}
      <header className="relative z-20 flex w-full items-center justify-between px-4 pt-4 md:px-6">
        <span className="hud-label text-primary text-glow">J.A.R.V.I.S.</span>
        <div className="flex flex-col items-center gap-1">
          <StatusBadge tone={tone} live>{STATUS_LABEL[orbState]}</StatusBadge>
        </div>
        <Link to="/briefing" aria-label="Dashboard" className="rounded-lg p-2 text-muted-foreground transition hover:text-primary">
          <LayoutGrid className="size-5" />
        </Link>
      </header>

      {/* Category buttons */}
      <div className="relative z-20 flex gap-1.5 overflow-x-auto px-4 py-2 md:justify-center md:overflow-visible">
        {CATS.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={cn(
              "shrink-0 rounded-lg border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition",
              cat === c
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-border-strong hover:text-foreground"
            )}
          >
            {c === "email" ? "E-MAIL" : c === "weather" ? "CLIMA" : c === "agenda" ? "AGENDA" : "NOTÍCIAS"}
          </button>
        ))}
      </div>

      {/* Center: orb behind + dynamic card front */}
      <section className="relative z-10 flex flex-1 w-full items-center justify-center">
        {/* Orb (behind card) */}
        <ClientOnly fallback={<div style={{ width: size, height: size }} />}>
          <Orb
            state={orbState}
            size={size}
            className="absolute z-0 opacity-90"
            userImage={orbState === "identifying" ? "https://i.pravatar.cc/300?img=12" : undefined}
          />
        </ClientOnly>

        {/* Dynamic card (semi-transparent, orb visible behind) */}
        <div className="relative z-10 w-full max-w-md px-4 md:max-w-lg">
          <GlassCard className="border-border-strong/40 bg-card/35 p-5 backdrop-blur-md">
            {cat === "email" && (
              <div>
                <p className="hud-label mb-1 text-primary">COMUNICAÇÕES · E-MAIL</p>
                <h2 className="text-lg font-bold">Pedem sua atenção</h2>
                <p className="mb-3 text-xs text-muted-foreground">5 mensagens prioritárias de agora</p>
                <div className="mb-3 flex gap-2">
                  <span className="rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">34 NÃO LIDOS</span>
                  <span className="rounded-full border border-warning/30 bg-warning/10 px-2.5 py-0.5 text-xs font-semibold text-warning">5 PARA DEPOIS</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-2 rounded-lg border border-glass-border bg-glass p-2.5">
                    <span className="rounded border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">ESTREME</span>
                    <p className="text-xs text-foreground">Atualize os dados comerciais e envie o documento à Síntese até 22/10/2026.</p>
                  </div>
                  <div className="flex items-start gap-2 rounded-lg border border-glass-border bg-glass p-2.5">
                    <span className="rounded border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">SANTANDER</span>
                    <p className="text-xs text-foreground">Fatura próxima do vencimento.</p>
                  </div>
                </div>
                <div className="mt-3 flex gap-3 text-[10px] uppercase tracking-wide text-subtle">
                  <button className="text-primary hover:underline">Todas as mensagens</button>
                  <button className="text-primary hover:underline">Enviar nova</button>
                </div>
              </div>
            )}

            {cat === "weather" && (
              <div>
                <p className="hud-label mb-1 text-primary">PREVISÃO · CLIMA</p>
                <h2 className="text-lg font-bold">{location || "Sua localização"}</h2>
                <p className="mb-3 text-xs text-muted-foreground">Previsão de hoje</p>
                <div className="flex items-center gap-4">
                  <CloudSun className="size-10 text-warning" />
                  <span className="text-4xl font-bold">26,7°</span>
                </div>
                <p className="mt-2 text-sm text-primary">Parcialmente nublado</p>
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Droplets className="size-3" /> 62%</span>
                  <span className="flex items-center gap-1"><Wind className="size-3" /> 16,3 km/h</span>
                  <span className="flex items-center gap-1"><Thermometer className="size-3" /> Sensação 29°</span>
                  <span className="flex items-center gap-1"><CloudSun className="size-3" /> Máx 30°</span>
                </div>
              </div>
            )}

            {cat === "agenda" && (
              <div className="text-center">
                <p className="hud-label mb-1 text-primary">AGENDA · DIA</p>
                <h2 className="text-lg font-bold">Agenda livre</h2>
                <div className="py-6">
                  <CalendarDays className="mx-auto size-12 text-muted-foreground" />
                  <p className="mt-2 text-sm font-medium">Nenhum compromisso agendado</p>
                  <p className="text-xs text-subtle">Sua agenda está completamente disponível.</p>
                </div>
              </div>
            )}

            {cat === "news" && (
              <div>
                <p className="hud-label mb-1 text-primary">NOTÍCIAS · TECNOLOGIA</p>
                <h2 className="text-lg font-bold">OpenAI freia modelo</h2>
                <div className="my-3 flex h-24 items-center justify-center rounded-lg bg-glass text-3xl">📰</div>
                <p className="text-xs italic text-muted-foreground leading-relaxed">
                  "A felicidade surge quando o que você pensa, o que você diz e o que você faz estão em harmonia."
                </p>
                <p className="mt-1 text-[10px] text-subtle">Correio Braziliense</p>
                <button className="mt-2 text-[10px] uppercase tracking-wide text-primary hover:underline">Ver mais notícias →</button>
              </div>
            )}
          </GlassCard>
        </div>
      </section>

      {/* Bottom widgets row */}
      <div className="relative z-10 flex gap-2 overflow-x-auto px-4 pb-2 md:justify-center md:overflow-visible">
        {WIDGETS.map((w) => {
          const Icon = w.icon;
          return (
            <div key={w.label} className="shrink-0 rounded-lg border border-border bg-card/60 p-2.5 backdrop-blur-sm transition hover:border-border-strong" style={{ width: "140px" }}>
              <p className="text-[8px] uppercase tracking-wider text-subtle">{w.label}</p>
              <p className="text-xs font-semibold text-foreground">{w.title}</p>
              {w.value && <p className="text-base font-bold text-primary">{w.value}</p>}
            </div>
          );
        })}
      </div>

      {/* Footer: mic + hint */}
      <footer className="relative z-10 flex flex-col items-center gap-3 pb-6">
        <Waveform active={orbState === "listening" || orbState === "speaking"} />
        <MicButton active={orbState === "listening"} onClick={toggleMic} />
        <p className="text-[10px] uppercase tracking-wider text-subtle">
          {orbState === "listening" ? "Fale agora..." : orbState === "speaking" ? "Respondendo..." : "Toque para falar"}
        </p>
      </footer>
    </main>
  );
}
