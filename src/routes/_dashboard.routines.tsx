import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Zap, Home, Play, Pencil, Trash2, Plus } from "lucide-react";
import { GlassCard, NeonButton, SectionHeader } from "@/components/jarvis";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_dashboard/routines")({
  head: () => ({ meta: [{ title: "Rotinas — J.A.R.V.I.S." }] }),
  component: RoutinesPage,
});

const MODELS = [
  { id: "chegada", label: "Chegada em casa" },
  { id: "saida", label: "Saindo de casa" },
  { id: "noite", label: "Boa noite" },
  { id: "manha", label: "Bom dia" },
];

const TRIGGERS = ["cheguei", "tô em casa", "voltei"];

function RoutinesPage() {
  const [tab, setTab] = useState<"rotinas" | "aparelhos">("rotinas");
  const [model, setModel] = useState("chegada");

  return (
    <div className="mx-auto max-w-3xl pb-16">
      <SectionHeader
        title="Rotinas"
        subtitle="Frases e eventos que comandam a casa"
        action={<NeonButton variant="solid"><Plus className="size-4" /> Nova rotina</NeonButton>}
      />

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-border pb-3">
        <button onClick={() => setTab("rotinas")} className={cn("flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition", tab === "rotinas" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground")}>
          <Zap className="size-4" /> Rotinas
        </button>
        <Link to="/aparelhos" className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition hover:text-foreground">
          <Home className="size-4" /> Aparelhos
        </Link>
      </div>

      {/* Card principal */}
      <GlassCard className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-60" />
        <p className="hud-label text-primary mb-2">Automação</p>
        <h2 className="text-xl font-semibold mb-2">Rotinas da casa</h2>
        <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
          Diga uma frase ao J.A.R.V.I.S. — ou deixe um evento disparar — e os aparelhos respondem na hora.
        </p>

        {/* Modelos */}
        <p className="text-sm font-medium mb-3">Começar de um modelo</p>
        <div className="mb-5 flex flex-wrap gap-2">
          {MODELS.map((m) => (
            <button key={m.id} onClick={() => setModel(m.id)} className={cn("rounded-lg border px-3 py-2 text-xs font-medium transition", model === m.id ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:border-border-strong hover:text-foreground")}>
              {m.label}
            </button>
          ))}
        </div>

        {/* Sub-card: Chegada em casa */}
        <div className="rounded-xl border border-border bg-background-secondary p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold">Chegada em casa</h3>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-success/40 bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
              <span className="size-1.5 rounded-full bg-success" /> Ligada
            </span>
          </div>

          {/* Triggers */}
          <div className="mb-4 flex flex-wrap gap-2">
            {TRIGGERS.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 rounded-full border border-blue/30 bg-blue/15 px-2.5 py-1 font-mono text-xs text-blue-200">
                <Zap className="size-3 text-primary" /> "{t}"
              </span>
            ))}
          </div>

          {/* Ações */}
          <div className="mb-3 rounded-lg bg-background p-3">
            <p className="text-sm text-foreground"><em className="text-primary">Falar "Bem-vindo de volta, Senhor."</em></p>
            <p className="text-xs text-muted-foreground mt-1">Ligar Escritório</p>
          </div>

          <p className="mb-4 text-xs text-subtle">Ainda não rodou</p>

          {/* Botões */}
          <div className="flex gap-2">
            <NeonButton variant="solid" className="py-1.5 text-xs"><Play className="size-3" /> Testar</NeonButton>
            <NeonButton variant="primary" className="py-1.5 text-xs"><Pencil className="size-3" /> Editar</NeonButton>
            <NeonButton variant="ghost" className="px-3 text-destructive"><Trash2 className="size-3" /></NeonButton>
          </div>
        </div>

        <p className="mt-4 text-xs text-subtle leading-relaxed">
          As frases e os eventos funcionam com a tela Jarvis aberta. Os aparelhos são comandados pelo servidor; comandos do HUD acontecem localmente.
        </p>
      </GlassCard>
    </div>
  );
}
