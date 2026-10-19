import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Zap, Play, Pencil, Trash2, Plus, Home, Clock, Mic } from "lucide-react";
import { GlassCard, NeonButton, SectionHeader, StatusBadge } from "@/components/jarvis";
import { useRoutines } from "@/stores/routines";
import { useDevices } from "@/stores/devices";
import { useJarvis } from "@/stores/jarvis";
import { useSpeech } from "@/hooks/use-speech";
import { cn } from "@/lib/utils";
import type { Routine } from "@/types/smarthome";

export const Route = createFileRoute("/_dashboard/routines")({
  head: () => ({ meta: [{ title: "Rotinas — J.A.R.V.I.S." }] }),
  component: RoutinesPage,
});

function RoutinesPage() {
  const [tab, setTab] = useState<"rotinas" | "aparelhos">("rotinas");
  const routines = useRoutines((s) => s.routines);
  const toggle = useRoutines((s) => s.toggle);
  const remove = useRoutines((s) => s.remove);
  const describeSteps = useRoutines((s) => s.describeSteps);
  const devices = useDevices((s) => s.devices);
  const setDeviceState = useDevices((s) => s.set);
  const setOrbState = useJarvis((s) => s.setOrbState);
  const { speak, supported: ttsSupported } = useSpeech();
  const navigate = useNavigate();
  const [testing, setTesting] = useState<string | null>(null);

  const runRoutine = async (r: Routine) => {
    setTesting(r.id);
    setOrbState("thinking");
    // Run steps sequentially
    for (const step of r.steps) {
      if (step.type === "speak") {
        if (ttsSupported) {
          setOrbState("speaking");
          await new Promise<void>((resolve) => {
            speak(step.text, { onEnd: () => resolve() });
          });
        } else {
          // No TTS — just wait a moment
          await new Promise((r) => setTimeout(r, 800));
        }
      } else if (step.type === "wait") {
        await new Promise((r) => setTimeout(r, step.seconds * 1000));
      } else if (step.type === "device") {
        setDeviceState(step.deviceId, step.action);
        await new Promise((r) => setTimeout(r, 400));
      }
    }
    setOrbState("success");
    setTimeout(() => setOrbState("idle"), 1200);
    setTesting(null);
  };

  return (
    <div className="mx-auto max-w-3xl pb-16">
      <SectionHeader
        title="Casa Inteligente → Rotinas"
        subtitle="Frases e eventos que comandam a casa"
        action={
          <NeonButton variant="solid" onClick={() => navigate({ to: "/new-routine" })}>
            <Plus className="size-4" /> Nova rotina
          </NeonButton>
        }
      />

      {/* Tabs */}
      <div className="mb-4 flex gap-2">
        {(["rotinas", "aparelhos"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-lg border px-4 py-2 text-sm font-semibold uppercase tracking-wide transition",
              tab === t
                ? "border-primary bg-primary/15 text-primary neon-glow"
                : "border-border bg-glass text-muted-foreground hover:border-border-strong hover:text-foreground"
            )}
          >
            {t === "rotinas" ? "Rotinas" : "Aparelhos"}
          </button>
        ))}
      </div>

      {tab === "rotinas" && (
        <div className="space-y-3">
          {routines.length === 0 && (
            <GlassCard className="py-10 text-center text-muted-foreground">
              Nenhuma rotina configurada.{" "}
              <Link to="/new-routine" className="text-primary hover:underline">Criar primeira rotina</Link>
            </GlassCard>
          )}
          {routines.map((r) => {
            const steps = describeSteps(r.steps);
            return (
              <GlassCard key={r.id} className={cn("p-4 transition", !r.enabled && "opacity-60")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Zap className="size-4 shrink-0 text-primary" />
                      <h3 className="text-sm font-bold text-foreground">{r.name}</h3>
                    </div>
                    {/* Trigger phrases */}
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {r.phrases.map((p) => (
                        <span
                          key={p}
                          className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs text-primary"
                        >
                          <Mic className="size-3" /> {p}
                        </span>
                      ))}
                      {r.events.bomDia && (
                        <span className="rounded-full border border-warning/30 bg-warning/10 px-2.5 py-0.5 text-xs text-warning">☀ BOM DIA</span>
                      )}
                      {r.events.rostoReconhecido && (
                        <span className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-xs text-accent-foreground">👤 ROSTO</span>
                      )}
                      {r.events.monitorAtivado && (
                        <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs text-primary">🖥 MONITOR</span>
                      )}
                      {r.schedule && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-border-strong/40 bg-glass px-2.5 py-0.5 text-xs text-muted-foreground">
                          <Clock className="size-3" />
                          {r.schedule.startTime}–{r.schedule.endTime}
                        </span>
                      )}
                    </div>
                    {/* Action summary */}
                    <div className="mt-2 text-xs text-muted-foreground">
                      {steps.map((s, i) => (
                        <span key={i}>
                          {i > 0 && <span className="text-subtle"> · </span>}
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    {/* Enabled toggle */}
                    <button
                      onClick={() => toggle(r.id)}
                      aria-label={r.enabled ? "Desligar rotina" : "Ligar rotina"}
                      className={cn(
                        "relative h-6 w-11 rounded-full border transition",
                        r.enabled
                          ? "border-primary bg-primary/30"
                          : "border-border-strong/40 bg-glass"
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 size-5 rounded-full transition-all",
                          r.enabled ? "left-[22px] bg-primary" : "left-0.5 bg-muted-foreground"
                        )}
                      />
                    </button>
                    <StatusBadge tone={r.enabled ? "success" : "muted"}>
                      {r.enabled ? "LIGADA" : "DESLIGADA"}
                    </StatusBadge>
                  </div>
                </div>
                {/* Action buttons */}
                <div className="mt-3 flex gap-2">
                  <NeonButton
                    onClick={() => runRoutine(r)}
                    disabled={testing === r.id}
                    className="min-h-[40px]"
                  >
                    <Play className="size-3.5" /> {testing === r.id ? "Executando…" : "Testar"}
                  </NeonButton>
                  <Link to="/new-routine" search={{ id: r.id }}>
                    <NeonButton className="min-h-[40px]">
                      <Pencil className="size-3.5" /> Editar
                    </NeonButton>
                  </Link>
                  <button
                    onClick={() => remove(r.id)}
                    aria-label="Excluir rotina"
                    className="ml-auto flex size-[40px] items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 text-destructive transition hover:bg-destructive/15"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {tab === "aparelhos" && (
        <div className="space-y-2">
          {devices.map((d) => (
            <GlassCard key={d.id} className="flex items-center justify-between gap-3 p-3">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex size-10 items-center justify-center rounded-lg border",
                  d.source === "ewelink" ? "border-primary/30 bg-primary/10 text-primary" : "border-accent/30 bg-accent/10 text-accent-foreground"
                )}>
                  <Home className="size-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">{d.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {d.room ?? "—"} · {d.type === "group" ? "Grupo" : d.type === "light" ? "Luz" : d.type === "switch" ? "Interruptor" : "Tomada"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge tone={d.status === "online" ? "success" : "danger"}>
                  {d.status === "online" ? "ONLINE" : "OFFLINE"}
                </StatusBadge>
                <button
                  onClick={() => useDevices.getState().toggle(d.id)}
                  disabled={d.status === "offline"}
                  className={cn(
                    "relative h-7 w-12 rounded-full border transition disabled:opacity-30",
                    d.state === "on" ? "border-primary bg-primary/30" : "border-border bg-glass"
                  )}
                >
                  <span className={cn(
                    "absolute top-0.5 size-6 rounded-full transition-all",
                    d.state === "on" ? "left-[22px] bg-primary" : "left-0.5 bg-muted-foreground"
                  )} />
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
