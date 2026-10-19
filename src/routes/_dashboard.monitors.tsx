import { createFileRoute } from "@tanstack/react-router";
import { Lock, Zap } from "lucide-react";
import { SectionHeader } from "@/components/jarvis";

export const Route = createFileRoute("/_dashboard/monitors")({
  head: () => ({ meta: [{ title: "Monitores — J.A.R.V.I.S." }] }),
  component: MonitorsPage,
});

function MonitorsPage() {
  return (
    <div className="mx-auto max-w-4xl pb-16">
      <SectionHeader title="Monitores adicionais" subtitle="Animação de desbloqueio nas telas extras do JARVIS" />

      <div className="grid gap-6 sm:grid-cols-2">
        {/* ESPERA */}
        <div className="relative flex h-80 flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl border border-border bg-background-secondary">
          <div className="absolute inset-0 flex items-center justify-center">
            {[200, 160, 120, 80].map((sz, i) => (
              <div key={i} className="absolute rounded-full border border-border" style={{
                width: sz, height: sz,
                animation: `spin ${8 - i * 2}s linear infinite ${i % 2 ? "reverse" : ""}`,
                borderColor: i === 3 ? "var(--color-primary)" : undefined,
                borderStyle: i === 1 ? "dashed" : "solid",
              }} />
            ))}
          </div>
          <div className="relative z-10 flex flex-col items-center gap-3">
            <Lock className="size-8 text-primary" />
            <p className="hud-label text-primary">ESPERA</p>
            <p className="px-6 text-center text-xs text-muted-foreground">Indo para hibernação<br />Diga "ativar monitor" para despertar</p>
          </div>
        </div>

        {/* INICIALIZANDO */}
        <div className="relative flex h-80 flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl border border-border bg-background-secondary">
          <div className="absolute inset-0 flex items-center justify-center">
            {[200, 160, 120, 80].map((sz, i) => (
              <div key={i} className="absolute rounded-full border border-border" style={{
                width: sz, height: sz,
                animation: `spin ${6 - i * 1.5}s linear infinite ${i % 2 ? "reverse" : ""}`,
                borderColor: i === 3 ? "var(--color-primary)" : undefined,
              }} />
            ))}
          </div>
          <div className="relative z-10 flex flex-col items-center gap-3">
            <Zap className="size-8 text-primary" />
            <p className="hud-label text-primary">INICIALIZANDO</p>
            <p className="px-6 text-center text-xs text-muted-foreground">Ativando monitor...<br />Carregando preferências do usuário</p>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-glass p-4">
        <h3 className="hud-label mb-2 text-primary">Como funciona</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Quando o JARVIS detecta inatividade, os monitores adicionais entram em modo ESPERA (hibernação).
          Diga "ativar monitor" ou "Jarvis, liga a tela" para despertar. A tela INICIALIZANDO mostra a
          animação de boot com os anéis girando em velocidades diferentes.
        </p>
      </div>
    </div>
  );
}
