import { PanoramaCard } from "./PanoramaCard";
import { WeatherCard } from "./WeatherCard";
import { AgendaCard } from "./AgendaCard";
import { PriorityEmailsCard } from "./PriorityEmailsCard";
import { NewsCard } from "./NewsCard";
import { GlassCard } from "@/components/jarvis";
import { Heart } from "lucide-react";
import type { BriefingData } from "@/types/briefing";

/**
 * BriefingOverlay — the floating cards revealed progressively during the
 * morning briefing. Cards are positioned around the orb (orb is rendered
 * globally by GlobalOrb and stays in the center).
 *
 * Visibility is controlled by the parent via `revealedCards`.
 * Active card is controlled by `activeCard` for the neon highlight.
 */

export interface RevealedCards {
  panorama?: boolean;
  weather?: boolean;
  agenda?: boolean;
  emails?: boolean;
  news?: boolean;
  health?: boolean;
  closing?: boolean;
}

export function BriefingOverlay({
  data,
  revealedCards,
  activeCard,
}: {
  data: BriefingData;
  revealedCards: RevealedCards;
  activeCard?: keyof RevealedCards;
}) {
  return (
    <div className="pointer-events-none fixed inset-0 z-30 hidden md:block">
      {/* Panorama — top-left */}
      <PanoramaCard visible={!!revealedCards.panorama} active={activeCard === "panorama"} />

      {/* Weather — bottom-left */}
      <WeatherCard visible={!!revealedCards.weather} active={activeCard === "weather"} data={data.weather} />

      {/* Agenda — middle-left (slightly lower than panorama) */}
      <AgendaCard visible={!!revealedCards.agenda} active={activeCard === "agenda"} data={data.agenda} />

      {/* Priority emails — top-right */}
      <PriorityEmailsCard visible={!!revealedCards.emails} active={activeCard === "emails"} data={data.emails} />

      {/* News — right side, stacked vertically (3 cards max) */}
      {data.news.slice(0, 3).map((news, i) => {
        const positions = [
          "top-44 right-6 md:right-12",
          "top-[19rem] right-6 md:right-12",
          "top-[27rem] right-6 md:right-12",
        ];
        return (
          <NewsCard
            key={news.id}
            visible={!!revealedCards.news}
            active={activeCard === "news"}
            data={news}
            positionClass={positions[i] ?? positions[2]!}
            width="w-[280px]"
          />
        );
      })}

      {/* Health observations — bottom-right */}
      {revealedCards.health && (
        <div className="pointer-events-auto absolute bottom-24 right-6 md:bottom-32 md:right-12 z-30 w-[260px]">
          <GlassCard
            className={`p-4 transition-all duration-300 ${activeCard === "health" ? "border-accent/60 neon-glow-accent" : ""}`}
          >
            <div className="mb-1 flex items-center gap-1.5 text-accent-foreground">
              <Heart className="size-3.5" />
              <span className="hud-label">SAÚDE · OBSERVAÇÕES</span>
            </div>
            <h3 className="text-base font-bold">{data.healthObservations ?? 0} observações</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Tenho {data.healthObservations ?? 0} observações sobre seus dados de saúde. O senhor quer ouvi-las?
            </p>
          </GlassCard>
        </div>
      )}

      {/* Closing subtle hint */}
      {revealedCards.closing && (
        <div className="pointer-events-auto absolute bottom-4 left-1/2 -translate-x-1/2 z-30">
          <p className="hud-label text-primary/60 text-glow">FOCO NO ESSENCIAL</p>
        </div>
      )}
    </div>
  );
}
