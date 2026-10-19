import { createFileRoute } from "@tanstack/react-router";
import { Plug, Lightbulb, DoorOpen, Power, MapPin } from "lucide-react";
import { GlassCard, SectionHeader } from "@/components/jarvis";

export const Route = createFileRoute("/_dashboard/aparelhos")({
  head: () => ({ meta: [{ title: "Aparelhos — J.A.R.V.I.S." }] }),
  component: AparelhosPage,
});

const DEVICES = [
  { name: "Interruptor", type: "Grupo (todos os canais)", icon: Power },
  { name: "Quarto de Visita", type: "Aparelho", icon: Plug },
  { name: "Sala de Jantar", type: "Aparelho", icon: Plug },
  { name: "Banheiro", type: "Aparelho", icon: MapPin },
  { name: "Sala de Estar", type: "Luz", icon: Lightbulb },
  { name: "Cozinha", type: "Luz", icon: Lightbulb },
  { name: "Quarto Casal", type: "Luz", icon: Lightbulb },
  { name: "Garagem", type: "Portão", icon: DoorOpen },
  { name: "Escritório", type: "Tomada", icon: Plug },
  { name: "Corredor", type: "Luz", icon: Lightbulb },
];

function AparelhosPage() {
  return (
    <div className="mx-auto max-w-4xl pb-16">
      <SectionHeader title="Aparelhos" subtitle="Dispositivos do eWeLink e Home Assistant disponíveis para rotinas" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {DEVICES.map((d) => {
          const Icon = d.icon;
          return (
            <GlassCard key={d.name} className="p-4 transition hover:border-border-strong">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </div>
                <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-success">
                  <span className="size-1.5 rounded-full bg-success shadow-[0_0_4px_var(--success)]" /> online
                </span>
              </div>
              <h3 className="text-sm font-semibold text-foreground">{d.name}</h3>
              <p className="text-xs text-subtle">{d.type}</p>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
