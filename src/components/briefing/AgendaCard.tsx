import { CalendarDays, CheckCircle2 } from "lucide-react";
import { BriefingCard } from "./BriefingCard";
import type { BriefingAgenda } from "@/types/briefing";

/**
 * AgendaCard — shows today's agenda (free or busy).
 */
export function AgendaCard({ visible, active, data }: { visible: boolean; active: boolean; data: BriefingAgenda }) {
  const isFree = data.status === "free" || data.events.length === 0;
  return (
    <BriefingCard
      visible={visible}
      active={active}
      positionClass="top-32 md:top-36 left-6 md:left-1/2 -translate-x-1/2 md:translate-x-0 md:left-12"
      width="w-[260px]"
    >
      <div className="mb-1 flex items-center gap-1.5 text-primary">
        <CalendarDays className="size-3.5" />
        <span className="hud-label">AGENDA · HOJE</span>
      </div>
      {isFree ? (
        <div className="py-3 text-center">
          <CheckCircle2 className="mx-auto size-8 text-success" />
          <p className="mt-1 text-sm font-bold text-foreground">Agenda livre</p>
          <p className="text-xs text-muted-foreground">Nenhum compromisso registrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-bold text-foreground">{data.events.length} compromissos</p>
          {data.events.slice(0, 3).map((e) => (
            <div key={e.id} className="rounded-lg border border-border-strong/40 bg-glass p-2 text-xs">
              <div className="font-semibold text-foreground">{e.title}</div>
              <div className="text-[10px] text-subtle">
                {new Date(e.start).toLocaleString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          ))}
        </div>
      )}
    </BriefingCard>
  );
}
