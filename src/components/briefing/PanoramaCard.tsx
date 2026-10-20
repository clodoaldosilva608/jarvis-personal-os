import { Activity } from "lucide-react";
import { BriefingCard } from "./BriefingCard";

/**
 * PanoramaCard — "Sem desvios relevantes" pre-briefing overview.
 * Shown first, before any specific data card.
 */
export function PanoramaCard({ visible, active }: { visible: boolean; active: boolean }) {
  return (
    <BriefingCard
      visible={visible}
      active={active}
      positionClass="top-12 left-6 md:left-12"
      width="w-[260px]"
    >
      <div className="mb-1 flex items-center gap-1.5 text-primary">
        <Activity className="size-3.5" />
        <span className="hud-label">PANORAMA PRÉVIO</span>
      </div>
      <h3 className="text-base font-bold">Sem desvios relevantes</h3>
      <p className="mt-1 text-xs text-muted-foreground">Dados consolidados desde ontem.</p>
      <div className="mt-3 flex flex-wrap gap-1">
        {["AGENDA", "E-MAILS", "NOTÍCIAS", "CLIMA", "PRIORIDADES"].map((t) => (
          <span key={t} className="rounded-full border border-border-strong/40 bg-glass px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-subtle">
            {t}
          </span>
        ))}
      </div>
    </BriefingCard>
  );
}
