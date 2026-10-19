import { createFileRoute } from "@tanstack/react-router";
import { GlassCard, MetricCard, SectionHeader, StatusBadge } from "@/components/jarvis";

export const Route = createFileRoute("/_dashboard/finance")({
  head: () => ({
    meta: [
      { title: "Finanças — J.A.R.V.I.S." },
      { name: "description", content: "Visão geral financeira." },
      { property: "og:title", content: "Finanças — J.A.R.V.I.S." },
      { property: "og:description", content: "Visão geral financeira." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="mx-auto max-w-5xl">
      <SectionHeader title="Finanças" subtitle="Visão geral financeira." action={<StatusBadge live>SISTEMA ONLINE</StatusBadge>} />
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Status" value="Online" hint="Fase 1" />
        <MetricCard label="Última sync" value="—" hint="Aguardando integração" />
        <MetricCard label="Itens" value="0" />
      </div>
      <GlassCard className="mt-4 text-sm text-muted-foreground">Este módulo será implementado nas próximas fases.</GlassCard>
    </div>
  );
}
