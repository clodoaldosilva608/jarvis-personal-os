import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Tag, Mic, Zap, Clock, ListChecks, Plus, ChevronUp, ChevronDown, X } from "lucide-react";
import { GlassCard, NeonButton, SectionHeader } from "@/components/jarvis";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_dashboard/new-routine")({
  head: () => ({ meta: [{ title: "Nova Rotina — J.A.R.V.I.S." }] }),
  component: NewRoutinePage,
});

const EVENTS = [
  { id: "bomdia", label: "Bom dia", desc: "Quando o J.A.R.V.I.S. começa o bom dia" },
  { id: "rosto", label: "Rosto reconhecido", desc: "Quando o monitor liga e reconhece o seu rosto" },
  { id: "monitor", label: "Monitor ativado", desc: "Sempre que o monitor do J.A.R.V.I.S. é ligado" },
];

const inputCls = "w-full rounded-lg border border-border bg-glass px-3 py-2.5 text-sm text-foreground placeholder:text-subtle outline-none transition focus:border-primary focus:neon-glow";

function NewRoutinePage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<string[]>(["bomdia"]);
  const [actionTab, setActionTab] = useState("aparelho");
  const [steps, setSteps] = useState([{ id: 1, type: "aparelho", target: "", action: "ligar" }]);

  const toggleEvent = (id: string) => setEvents((p) => p.includes(id) ? p.filter((e) => e !== id) : [...p, id]);
  const addStep = () => setSteps((p) => [...p, { id: Date.now(), type: "aparelho", target: "", action: "ligar" }]);
  const removeStep = (id: number) => setSteps((p) => p.filter((s) => s.id !== id));

  return (
    <div className="mx-auto max-w-2xl pb-16">
      <SectionHeader title="Nova rotina" subtitle="Defina o que inicia a rotina e organize as ações na ordem em que devem acontecer." />

      {/* Nome */}
      <GlassCard className="mb-3 p-4 neon-glow border-primary/40">
        <div className="mb-2 flex items-center gap-2"><Tag className="size-4 text-primary" /><label className="text-sm font-semibold">Nome da rotina</label></div>
        <p className="mb-3 text-xs text-muted-foreground">Use um nome curto para reconhecer esta automação rapidamente.</p>
        <input className={inputCls} placeholder="Ex: Cheguei em casa" />
      </GlassCard>

      {/* Frases */}
      <GlassCard className="mb-3 p-4">
        <div className="mb-2 flex items-center gap-2"><Mic className="size-4 text-primary" /><label className="text-sm font-semibold">Frases que disparam</label></div>
        <p className="mb-3 text-xs text-muted-foreground">O HUD compara a fala inteira para evitar acionamentos por engano.</p>
        <input className={inputCls} placeholder="Ex: cheguei" />
        <p className="mt-2 text-xs italic text-primary">"Jarvis, cheguei" dispara; "cheguei a pensar que..." não.</p>
      </GlassCard>

      {/* Eventos */}
      <GlassCard className="mb-3 p-4">
        <div className="mb-2 flex items-center gap-2"><Zap className="size-4 text-primary" /><label className="text-sm font-semibold">Eventos do J.A.R.V.I.S.</label></div>
        <p className="mb-3 text-xs text-muted-foreground">A rotina também pode começar automaticamente quando o sistema reconhecer um momento.</p>
        <div className="space-y-2">
          {EVENTS.map((e) => (
            <label key={e.id} className="flex cursor-pointer items-start gap-3 rounded-lg p-2 transition hover:bg-glass">
              <input type="checkbox" checked={events.includes(e.id)} onChange={() => toggleEvent(e.id)} className="mt-0.5 size-5 accent-primary" />
              <div><div className="text-sm font-medium">{e.label}</div><div className="text-xs text-subtle">{e.desc}</div></div>
            </label>
          ))}
        </div>
      </GlassCard>

      {/* Quando vale */}
      <GlassCard className="mb-3 p-4">
        <div className="mb-2 flex items-center gap-2"><Clock className="size-4 text-primary" /><label className="text-sm font-semibold">Quando vale</label></div>
        <p className="mb-3 text-xs text-muted-foreground">Opcional: limite a execução a um período e a dias específicos.</p>
        <div className="flex items-center gap-3">
          <button className="relative h-5 w-9 rounded-full bg-border transition" onClick={(e) => e.currentTarget.classList.toggle("bg-primary")}>
            <span className="absolute left-0.5 top-0.5 size-4 rounded-full bg-foreground transition-transform" />
          </button>
          <span className="text-sm">Usar horários e dias</span>
        </div>
        <p className="mt-2 text-xs text-subtle">Fora desse período, a rotina não será executada.</p>
      </GlassCard>

      {/* Passos */}
      <GlassCard className="mb-3 p-4">
        <div className="mb-2 flex items-center gap-2"><ListChecks className="size-4 text-primary" /><label className="text-sm font-semibold">Passos da rotina</label></div>
        <p className="mb-3 text-xs text-muted-foreground">As ações são executadas de cima para baixo. Reordene quando precisar.</p>
        <div className="space-y-2">
          {steps.map((s, i) => (
            <div key={s.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-background p-2">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{i + 1}</span>
              <select className="min-w-0 flex-1 rounded border border-border bg-transparent px-2 py-1.5 text-xs text-muted-foreground">
                <option>Escolha o aparelho...</option>
              </select>
              <div className="flex gap-1">
                <button className={cn("rounded px-2.5 py-1 text-xs font-medium transition", s.action === "ligar" ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground")} onClick={() => setSteps((p) => p.map((x) => x.id === s.id ? { ...x, action: "ligar" } : x))}>Ligar</button>
                <button className={cn("rounded px-2.5 py-1 text-xs font-medium transition", s.action === "desligar" ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground")} onClick={() => setSteps((p) => p.map((x) => x.id === s.id ? { ...x, action: "desligar" } : x))}>Desligar</button>
              </div>
              <div className="flex gap-0.5">
                <button className="rounded p-1 text-subtle hover:text-primary"><ChevronUp className="size-3" /></button>
                <button className="rounded p-1 text-subtle hover:text-primary"><ChevronDown className="size-3" /></button>
                <button onClick={() => removeStep(s.id)} className="rounded p-1 text-subtle hover:text-destructive"><X className="size-3" /></button>
              </div>
            </div>
          ))}
        </div>
        <button onClick={addStep} className="mt-2 w-full rounded-lg border border-dashed border-border py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground transition hover:border-primary hover:text-primary">
          + Adicionar passo
        </button>
        <div className="mt-3 flex gap-1">
          {["Aparelho", "Esperar", "Falar"].map((t, i) => (
            <button key={t} onClick={() => setActionTab(t.toLowerCase())} className={cn("rounded-lg border px-3 py-2 text-xs font-medium transition flex items-center gap-1.5", actionTab === t.toLowerCase() ? "border-primary bg-glass text-primary" : "border-border text-muted-foreground")}>
              {i === 0 ? <Plus className="size-3" /> : i === 1 ? <Clock className="size-3" /> : <Mic className="size-3" />} {t}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-subtle">Os aparelhos são comandados pelo servidor. Falas e comandos do J.A.R.V.I.S. acontecem no HUD.</p>
      </GlassCard>

      {/* Footer */}
      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <p className="mr-auto text-xs text-subtle self-center">As alterações entram em vigor depois de salvar.</p>
        <NeonButton variant="ghost" onClick={() => navigate({ to: "/routines" })}>Cancelar</NeonButton>
        <NeonButton variant="solid" onClick={() => navigate({ to: "/routines" })}>Salvar rotina</NeonButton>
      </div>
    </div>
  );
}
