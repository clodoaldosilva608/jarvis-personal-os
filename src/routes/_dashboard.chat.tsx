import { createFileRoute } from "@tanstack/react-router";
import { GlassCard, MetricCard, SectionHeader, StatusBadge } from "@/components/jarvis";

export const Route = createFileRoute("/_dashboard/chat")({
  head: () => ({
    meta: [
      { title: "Chat — J.A.R.V.I.S." },
      { name: "description", content: "Converse com o J.A.R.V.I.S." },
      { property: "og:title", content: "Chat — J.A.R.V.I.S." },
      { property: "og:description", content: "Converse com o J.A.R.V.I.S." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="mx-auto max-w-5xl">
      <SectionHeader title="Chat" subtitle="Converse com o J.A.R.V.I.S." action={<StatusBadge live>SISTEMA ONLINE</StatusBadge>} />
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Status" value="Online" hint="Fase 1" />
        <MetricCard label="Última sync" value="—" hint="Aguardando integração" />
        <MetricCard label="Itens" value="0" />
      </div>
      <GlassCard className="mt-4 text-sm text-muted-foreground">Este módulo será implementado nas próximas fases.</GlassCard>
    </div>
  );
}
