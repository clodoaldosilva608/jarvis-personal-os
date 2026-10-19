import { Mail, AlertCircle } from "lucide-react";
import { BriefingCard } from "./BriefingCard";
import type { BriefingEmails } from "@/types/briefing";

/**
 * PriorityEmailsCard — "Pedem sua atenção" — top priority e-mails.
 */
export function PriorityEmailsCard({ visible, active, data }: { visible: boolean; active: boolean; data: BriefingEmails }) {
  return (
    <BriefingCard
      visible={visible}
      active={active}
      positionClass="top-12 right-6 md:right-12"
      width="w-[300px]"
    >
      <div className="mb-1 flex items-center gap-1.5 text-primary">
        <Mail className="size-3.5" />
        <span className="hud-label">COMUNICAÇÕES · E-MAIL</span>
      </div>
      <h3 className="text-base font-bold">Pedem sua atenção</h3>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <span className="rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
          {data.priorityCount} PRIORITÁRIAS
        </span>
        <span className="rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-[10px] font-semibold text-warning">
          {data.total} RECEBIDAS
        </span>
      </div>
      <div className="mt-3 space-y-1.5">
        {data.items.slice(0, 3).map((e) => (
          <div key={e.id} className="flex items-start gap-1.5 rounded-lg border border-glass-border bg-glass p-2 text-xs">
            <AlertCircle className={e.priority === "high" ? "size-3 shrink-0 text-destructive" : "size-3 shrink-0 text-warning"} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="rounded border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary">
                  {e.from}
                </span>
              </div>
              <p className="mt-0.5 truncate text-foreground">{e.subject}</p>
            </div>
          </div>
        ))}
        {data.items.length > 3 && (
          <p className="pt-0.5 text-center text-[10px] uppercase tracking-wider text-subtle">
            + {data.items.length - 3} outras
          </p>
        )}
      </div>
    </BriefingCard>
  );
}
