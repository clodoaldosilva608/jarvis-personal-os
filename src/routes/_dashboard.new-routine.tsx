import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Mic, Zap, Clock, Plus, ChevronUp, ChevronDown, X, Save, Play } from "lucide-react";
import { GlassCard, NeonButton, SectionHeader } from "@/components/jarvis";
import { useRoutines } from "@/stores/routines";
import { useDevices } from "@/stores/devices";
import { useJarvis } from "@/stores/jarvis";
import { useSpeech } from "@/hooks/use-speech";
import { cn } from "@/lib/utils";
import type { Routine, RoutineStep, RoutineStepType } from "@/types/smarthome";

export const Route = createFileRoute("/_dashboard/new-routine")({
  head: () => ({ meta: [{ title: "Nova Rotina — J.A.R.V.I.S." }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search.id === "string" ? search.id : undefined,
  }),
  component: NewRoutinePage,
});

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const EVENTS = [
  { id: "bomDia" as const, label: "Bom dia", desc: "Quando o J.A.R.V.I.S. começa o bom dia" },
  { id: "rostoReconhecido" as const, label: "Rosto reconhecido", desc: "Quando o monitor liga e reconhece o seu rosto" },
  { id: "monitorAtivado" as const, label: "Monitor ativado", desc: "Sempre que o monitor do J.A.R.V.I.S. é ligado" },
];

const inputCls = "w-full rounded-lg border border-border bg-glass px-3 py-2.5 text-sm text-foreground placeholder:text-subtle outline-none transition focus:border-primary focus:neon-glow";

interface DraftStep {
  id: string;
  type: RoutineStepType;
  deviceId?: string;
  action?: "on" | "off";
  seconds?: number;
  text?: string;
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function NewRoutinePage() {
  const navigate = useNavigate();
  const { id } = Route.useSearch();
  const routines = useRoutines((s) => s.routines);
  const add = useRoutines((s) => s.add);
  const update = useRoutines((s) => s.update);
  const devices = useDevices((s) => s.devices);
  const setDeviceState = useDevices((s) => s.set);
  const setOrbState = useJarvis((s) => s.setOrbState);
  const { speak, supported: ttsSupported } = useSpeech();

  const [name, setName] = useState("");
  const [phrases, setPhrases] = useState<string[]>([]);
  const [phraseInput, setPhraseInput] = useState("");
  const [events, setEvents] = useState<{ bomDia?: boolean; rostoReconhecido?: boolean; monitorAtivado?: boolean }>({});
  const [useSchedule, setUseSchedule] = useState(false);
  const [days, setDays] = useState<number[]>([]);
  const [startTime, setStartTime] = useState("07:00");
  const [endTime, setEndTime] = useState("11:00");
  const [steps, setSteps] = useState<DraftStep[]>([
    { id: uid(), type: "speak", text: "Bem-vindo de volta, Senhor." },
  ]);

  // If editing existing routine, load its data into the form
  useEffect(() => {
    if (!id) return;
    const r = routines.find((x) => x.id === id);
    if (!r) return;
    setName(r.name);
    setPhrases(r.phrases);
    setEvents(r.events);
    if (r.schedule) {
      setUseSchedule(true);
      setDays(r.schedule.days);
      setStartTime(r.schedule.startTime ?? "07:00");
      setEndTime(r.schedule.endTime ?? "11:00");
    }
    setSteps(r.steps.map((s) => ({ id: uid(), ...s })));
  }, [id, routines]);

  const addPhrase = () => {
    const t = phraseInput.trim().toLowerCase();
    if (!t || phrases.includes(t)) return;
    setPhrases((p) => [...p, t]);
    setPhraseInput("");
  };
  const removePhrase = (p: string) => setPhrases((arr) => arr.filter((x) => x !== p));

  const toggleEvent = (e: "bomDia" | "rostoReconhecido" | "monitorAtivado") =>
    setEvents((prev) => ({ ...prev, [e]: !prev[e] }));

  const toggleDay = (d: number) =>
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  const addStep = (type: RoutineStepType) => {
    const newStep: DraftStep = type === "device"
      ? { id: uid(), type, deviceId: devices[0]?.id ?? "", action: "on" }
      : type === "wait"
      ? { id: uid(), type, seconds: 5 }
      : { id: uid(), type, text: "" };
    setSteps((p) => [...p, newStep]);
  };
  const updateStep = (sid: string, patch: Partial<DraftStep>) =>
    setSteps((p) => p.map((s) => (s.id === sid ? { ...s, ...patch } : s)));
  const removeStep = (sid: string) => setSteps((p) => p.filter((s) => s.id !== sid));
  const moveStep = (sid: string, dir: "up" | "down") => {
    setSteps((p) => {
      const idx = p.findIndex((s) => s.id === sid);
      if (idx < 0) return p;
      const newIdx = dir === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= p.length) return p;
      const next = [...p];
      [next[idx], next[newIdx]] = [next[newIdx]!, next[idx]!];
      return next;
    });
  };

  const buildRoutine = (): Routine => {
    const cleanSteps: RoutineStep[] = steps.map((s) => {
      if (s.type === "device") return { type: "device", deviceId: s.deviceId ?? "", action: s.action ?? "on" };
      if (s.type === "wait") return { type: "wait", seconds: s.seconds ?? 5 };
      return { type: "speak", text: s.text ?? "" };
    });
    return {
      id: id ?? uid(),
      name: name.trim() || "Rotina sem nome",
      phrases,
      events,
      schedule: useSchedule && days.length > 0 ? { days, startTime, endTime } : undefined,
      steps: cleanSteps,
      enabled: true,
    };
  };

  const save = () => {
    const r = buildRoutine();
    if (id) update(id, r);
    else add(r);
    navigate({ to: "/routines" });
  };

  const test = async () => {
    setOrbState("thinking");
    for (const s of steps) {
      if (s.type === "speak" && s.text) {
        if (ttsSupported) {
          setOrbState("speaking");
          await new Promise<void>((resolve) => speak(s.text!, { onEnd: () => resolve() }));
        } else {
          await new Promise((r) => setTimeout(r, 500));
        }
      } else if (s.type === "wait") {
        await new Promise((r) => setTimeout(r, (s.seconds ?? 5) * 1000));
      } else if (s.type === "device" && s.deviceId) {
        setDeviceState(s.deviceId, s.action ?? "on");
        await new Promise((r) => setTimeout(r, 400));
      }
    }
    setOrbState("success");
    setTimeout(() => setOrbState("idle"), 1200);
  };

  return (
    <div className="mx-auto max-w-3xl pb-16">
      <SectionHeader
        title={id ? "Editar Rotina" : "Nova Rotina"}
        subtitle="Configure frases de disparo, eventos e passos"
        action={
          <div className="flex gap-2">
            <NeonButton onClick={test}><Play className="size-4" /> Testar</NeonButton>
            <NeonButton variant="solid" onClick={save}><Save className="size-4" /> Salvar</NeonButton>
          </div>
        }
      />

      {/* === Nome === */}
      <GlassCard className="mb-4">
        <h2 className="hud-label mb-2 text-primary">Nome da rotina</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          Utilizaremos este nome para reconhecer a rotina na lista e nos logs.
        </p>
        <input
          className={inputCls}
          placeholder="Ex.: Chegada em casa"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
        />
      </GlassCard>

      {/* === Frases de disparo === */}
      <GlassCard className="mb-4">
        <h2 className="hud-label mb-2 text-primary">Frases que disparam</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          O HUD compara a fala inteira para evitar acionamentos por engano.
        </p>
        {phrases.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {phrases.map((p) => (
              <span key={p} className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs text-primary">
                <Mic className="size-3" /> "{p}"
                <button onClick={() => removePhrase(p)} aria-label={`Remover ${p}`} className="ml-0.5 hover:text-foreground">
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            className={inputCls}
            placeholder="Ex: cheguei"
            value={phraseInput}
            onChange={(e) => setPhraseInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addPhrase())}
            maxLength={60}
          />
          <NeonButton onClick={addPhrase} className="min-h-[44px]">
            <Plus className="size-4" /> Adicionar
          </NeonButton>
        </div>
      </GlassCard>

      {/* === Eventos do JARVIS === */}
      <GlassCard className="mb-4">
        <h2 className="hud-label mb-2 text-primary">Eventos do J.A.R.V.I.S.</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          A rotina também pode começar a funcionar automaticamente quando o sistema reconhecer um estímulo.
        </p>
        <div className="space-y-2">
          {EVENTS.map((ev) => (
            <button
              key={ev.id}
              onClick={() => toggleEvent(ev.id)}
              className={cn(
                "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition",
                events[ev.id]
                  ? "border-primary bg-primary/10 neon-glow"
                  : "border-border bg-glass hover:border-border-strong"
              )}
            >
              <div className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border",
                events[ev.id] ? "border-primary bg-primary text-primary-foreground" : "border-border")}>
                {events[ev.id] && <span className="text-[10px]">✓</span>}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-foreground">{ev.label}</div>
                <div className="text-xs text-muted-foreground">{ev.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </GlassCard>

      {/* === Quando vale (schedule) === */}
      <GlassCard className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="hud-label text-primary">Quando vale</h2>
            <p className="mt-1 text-xs text-muted-foreground">Opcional. Limita a execução a um período e dias específicos.</p>
          </div>
          <button
            onClick={() => setUseSchedule((v) => !v)}
            aria-label="Toggle schedule"
            className={cn(
              "relative h-6 w-11 rounded-full border transition",
              useSchedule ? "border-primary bg-primary/30" : "border-border bg-glass"
            )}
          >
            <span className={cn(
              "absolute top-0.5 size-5 rounded-full transition-all",
              useSchedule ? "left-[22px] bg-primary" : "left-0.5 bg-muted-foreground"
            )} />
          </button>
        </div>
        {useSchedule && (
          <div className="mt-3">
            <p className="mb-2 text-xs text-muted-foreground">Fora desse período, a rotina não será executada.</p>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {DAYS.map((d, i) => (
                <button
                  key={d}
                  onClick={() => toggleDay(i)}
                  className={cn(
                    "flex size-9 items-center justify-center rounded-lg border text-xs font-medium transition",
                    days.includes(i)
                      ? "border-primary bg-primary/15 text-primary neon-glow"
                      : "border-border bg-glass text-muted-foreground hover:border-border-strong"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-wider text-subtle">Início</label>
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputCls} />
              </div>
              <span className="text-subtle">até</span>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-wider text-subtle">Fim</label>
                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputCls} />
              </div>
            </div>
          </div>
        )}
      </GlassCard>

      {/* === Passos da rotina === */}
      <GlassCard className="mb-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="hud-label text-primary">Passos da rotina</h2>
            <p className="mt-1 text-xs text-muted-foreground">Ações são executadas de cima para baixo. Reordene quando precisar.</p>
          </div>
          <div className="flex gap-1.5">
            <NeonButton variant="ghost" onClick={() => addStep("device")} className="px-2.5 py-1 text-xs">
              <Plus className="size-3" /> Aparelho
            </NeonButton>
            <NeonButton variant="ghost" onClick={() => addStep("wait")} className="px-2.5 py-1 text-xs">
              <Plus className="size-3" /> <Clock className="size-3" /> Esperar
            </NeonButton>
            <NeonButton variant="ghost" onClick={() => addStep("speak")} className="px-2.5 py-1 text-xs">
              <Plus className="size-3" /> <Mic className="size-3" /> Falar
            </NeonButton>
          </div>
        </div>

        {steps.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">Nenhum passo ainda. Use os botões acima para adicionar.</p>
        )}

        <ol className="space-y-2">
          {steps.map((s, i) => (
            <li key={s.id} className="flex items-start gap-2 rounded-lg border border-border-strong/40 bg-glass p-2.5">
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={() => moveStep(s.id, "up")}
                  disabled={i === 0}
                  aria-label="Mover para cima"
                  className="rounded p-0.5 text-subtle transition hover:text-primary disabled:opacity-30"
                >
                  <ChevronUp className="size-3.5" />
                </button>
                <span className="text-[10px] font-mono text-subtle">{i + 1}</span>
                <button
                  onClick={() => moveStep(s.id, "down")}
                  disabled={i === steps.length - 1}
                  aria-label="Mover para baixo"
                  className="rounded p-0.5 text-subtle transition hover:text-primary disabled:opacity-30"
                >
                  <ChevronDown className="size-3.5" />
                </button>
              </div>
              <div className="flex-1">
                {s.type === "device" && (
                  <div className="flex flex-wrap gap-2">
                    <select
                      className={cn(inputCls, "min-w-[140px] flex-1")}
                      value={s.deviceId ?? ""}
                      onChange={(e) => updateStep(s.id, { deviceId: e.target.value })}
                    >
                      {devices.map((d) => (
                        <option key={d.id} value={d.id}>{d.name} ({d.room ?? "—"})</option>
                      ))}
                    </select>
                    <div className="flex gap-1">
                      <button
                        onClick={() => updateStep(s.id, { action: "on" })}
                        className={cn("rounded-lg border px-3 py-2 text-xs font-semibold transition",
                          s.action === "on" ? "border-primary bg-primary/15 text-primary" : "border-border bg-glass text-muted-foreground")}
                      >
                        Ligar
                      </button>
                      <button
                        onClick={() => updateStep(s.id, { action: "off" })}
                        className={cn("rounded-lg border px-3 py-2 text-xs font-semibold transition",
                          s.action === "off" ? "border-destructive bg-destructive/15 text-destructive" : "border-border bg-glass text-muted-foreground")}
                      >
                        Desligar
                      </button>
                    </div>
                  </div>
                )}
                {s.type === "wait" && (
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Esperar</span>
                    <input
                      type="number"
                      min={1}
                      max={300}
                      value={s.seconds ?? 5}
                      onChange={(e) => updateStep(s.id, { seconds: Number(e.target.value) })}
                      className={cn(inputCls, "w-20")}
                    />
                    <span className="text-sm text-muted-foreground">segundos</span>
                  </div>
                )}
                {s.type === "speak" && (
                  <div>
                    <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-primary">
                      <Mic className="size-3" /> JARVIS fala:
                    </div>
                    <textarea
                      className={cn(inputCls, "min-h-[60px] resize-y")}
                      placeholder="Texto que o JARVIS vai falar no HUD…"
                      value={s.text ?? ""}
                      onChange={(e) => updateStep(s.id, { text: e.target.value })}
                      maxLength={500}
                    />
                  </div>
                )}
              </div>
              <button
                onClick={() => removeStep(s.id)}
                aria-label="Remover passo"
                className="flex size-8 shrink-0 items-center justify-center rounded-lg text-subtle transition hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ol>
      </GlassCard>

      {/* Footer buttons */}
      <div className="flex gap-2">
        <NeonButton variant="ghost" onClick={() => navigate({ to: "/routines" })} className="min-h-[44px]">
          Cancelar
        </NeonButton>
        <NeonButton variant="solid" onClick={save} className="min-h-[44px] flex-1">
          <Save className="size-4" /> {id ? "Salvar alterações" : "Salvar rotina"}
        </NeonButton>
      </div>
    </div>
  );
}
