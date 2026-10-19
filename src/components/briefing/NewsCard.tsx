import { Newspaper } from "lucide-react";
import { BriefingCard } from "./BriefingCard";
import type { BriefingNews } from "@/types/briefing";

/**
 * NewsCard — single news item (category, headline, source, quote).
 * Multiple NewsCards are stacked around the orb.
 */
export function NewsCard({
  visible,
  active,
  data,
  positionClass,
  width = "w-[260px]",
}: {
  visible: boolean;
  active: boolean;
  data: BriefingNews;
  positionClass: string;
  width?: string;
}) {
  return (
    <BriefingCard visible={visible} active={active} positionClass={positionClass} width={width}>
      <div className="mb-1 flex items-center gap-1.5 text-primary">
        <Newspaper className="size-3.5" />
        <span className="hud-label">NOTÍCIAS · {data.category.toUpperCase()}</span>
      </div>
      <h3 className="text-sm font-bold leading-snug">{data.title}</h3>
      {data.quote && (
        <p className="mt-2 text-xs italic text-muted-foreground leading-relaxed">
          "{data.quote}"
        </p>
      )}
      {!data.quote && data.summary && (
        <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{data.summary}</p>
      )}
      <p className="mt-1 text-[10px] text-subtle">{data.source}</p>
    </BriefingCard>
  );
}
