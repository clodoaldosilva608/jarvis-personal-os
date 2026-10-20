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
 * morning briefing.
 *
 * Desktop (≥ md): cards float around the orb (orb is rendered globally by
 *   GlobalOrb and stays in the center). Cards use absolute positioning.
 *
 * Mobile (< md): cards stack vertically BELOW the orb in a single column,
 *   scrollable. The orb stays visible at top, mic stays accessible at bottom.
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
    <>
      {/* === Desktop: floating cards around orb === */}
      <div className="pointer-events-none fixed inset-0 z-30 hidden md:block">
        {/* Panorama — top-left */}
        <PanoramaCard visible={!!revealedCards.panorama} active={activeCard === "panorama"} />

        {/* Weather — bottom-left */}
        <WeatherCard visible={!!revealedCards.weather} active={activeCard === "weather"} data={data.weather} />

        {/* Agenda — middle-left */}
        <AgendaCard visible={!!revealedCards.agenda} active={activeCard === "agenda"} data={data.agenda} />

        {/* Priority emails — top-right */}
        <PriorityEmailsCard visible={!!revealedCards.emails} active={activeCard === "emails"} data={data.emails} />

        {/* News — right side, stacked vertically */}
        {data.news.slice(0, 3).map((news, i) => {
          const positions = [
            "top-44 right-6 md:right-12",
            "top-[19rem] right-6 md:right-12",
            "top-[27rem] right-6 md:right-12",
          ];
          return (
            <NewsCard
              key={news.id}
              visible={!!revevealedNews(revealedCards, i)}
              active={activeCard === "news"}
              data={news}
              positionClass={positions[i] ?? positions[2]!}
              width="w-[280px]"
            />
          );
        })}

        {/* Health — bottom-right */}
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

        {/* Closing hint */}
        {revealedCards.closing && (
          <div className="pointer-events-auto absolute bottom-4 left-1/2 -translate-x-1/2 z-30">
            <p className="hud-label text-primary/60 text-glow">FOCO NO ESSENCIAL</p>
          </div>
        )}
      </div>

      {/* === Mobile: stacked vertical cards below orb === */}
      <div className="pointer-events-auto fixed inset-x-0 top-[60vh] bottom-20 z-30 flex flex-col gap-2 overflow-y-auto px-4 pb-4 md:hidden">
        {revealedCards.panorama && (
          <div className={activeCard === "panorama" ? "rounded-xl border border-primary/60 neon-glow-strong" : ""}>
            <MobilePanorama />
          </div>
        )}
        {revealedCards.weather && (
          <div className={activeCard === "weather" ? "rounded-xl border border-primary/60 neon-glow-strong" : ""}>
            <MobileWeather data={data.weather} />
          </div>
        )}
        {revealedCards.agenda && (
          <div className={activeCard === "agenda" ? "rounded-xl border border-primary/60 neon-glow-strong" : ""}>
            <MobileAgenda data={data.agenda} />
          </div>
        )}
        {revealedCards.emails && (
          <div className={activeCard === "emails" ? "rounded-xl border border-primary/60 neon-glow-strong" : ""}>
            <MobilePriorityEmails data={data.emails} />
          </div>
        )}
        {revealedCards.news && data.news.slice(0, 3).map((news) => (
          <div key={news.id} className={activeCard === "news" ? "rounded-xl border border-primary/60 neon-glow-strong" : ""}>
            <MobileNews data={news} />
          </div>
        ))}
        {revealedCards.health && (
          <div className={activeCard === "health" ? "rounded-xl border border-accent/60 neon-glow-accent" : ""}>
            <MobileHealth count={data.healthObservations ?? 0} />
          </div>
        )}
        {revealedCards.closing && (
          <p className="text-center hud-label text-primary/60 text-glow">FOCO NO ESSENCIAL</p>
        )}
      </div>
    </>
  );
}

function revevealedNews(r: RevealedCards, _i: number): boolean {
  return !!r.news;
}

// === Mobile simplified cards ===

function MobilePanorama() {
  return (
    <GlassCard className="p-3">
      <div className="mb-1 flex items-center gap-1.5 text-primary">
        <span className="hud-label">PANORAMA PRÉVIO</span>
      </div>
      <h3 className="text-sm font-bold">Sem desvios relevantes</h3>
      <p className="mt-1 text-xs text-muted-foreground">Dados consolidados desde ontem.</p>
    </GlassCard>
  );
}

function MobileWeather({ data }: { data: import("@/types/briefing").BriefingWeather }) {
  return (
    <GlassCard className="p-3">
      <div className="mb-1 text-primary">
        <span className="hud-label">PREVISÃO · CLIMA</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-3xl font-bold">{data.temp.toFixed(1)}°</span>
        <div className="text-xs text-muted-foreground">
          <div>{data.location}</div>
          <div>{data.min}° / {data.max}° · {data.rainChance}% chuva</div>
        </div>
      </div>
    </GlassCard>
  );
}

function MobileAgenda({ data }: { data: import("@/types/briefing").BriefingAgenda }) {
  const isFree = data.status === "free" || data.events.length === 0;
  return (
    <GlassCard className="p-3">
      <div className="mb-1 text-primary">
        <span className="hud-label">AGENDA · HOJE</span>
      </div>
      <p className="text-sm font-bold">{isFree ? "Agenda livre" : `${data.events.length} compromissos`}</p>
      <p className="text-xs text-muted-foreground">{isFree ? "Nenhum compromisso" : data.events[0]?.title}</p>
    </GlassCard>
  );
}

function MobilePriorityEmails({ data }: { data: import("@/types/briefing").BriefingEmails }) {
  return (
    <GlassCard className="p-3">
      <div className="mb-1 text-primary">
        <span className="hud-label">E-MAIL · PRIORIDADE</span>
      </div>
      <p className="text-sm font-bold">{data.priorityCount} prioritárias · {data.total} recebidas</p>
      {data.items[0] && (
        <p className="mt-1 text-xs text-muted-foreground">{data.items[0].from}: {data.items[0].subject}</p>
      )}
    </GlassCard>
  );
}

function MobileNews({ data }: { data: import("@/types/briefing").BriefingNews }) {
  return (
    <GlassCard className="p-3">
      <div className="mb-1 text-primary">
        <span className="hud-label">NOTÍCIAS · {data.category.toUpperCase()}</span>
      </div>
      <p className="text-sm font-bold leading-snug">{data.title}</p>
      <p className="mt-1 text-[10px] text-subtle">{data.source}</p>
    </GlassCard>
  );
}

function MobileHealth({ count }: { count: number }) {
  return (
    <GlassCard className="p-3">
      <div className="mb-1 flex items-center gap-1.5 text-accent-foreground">
        <Heart className="size-3.5" />
        <span className="hud-label">SAÚDE</span>
      </div>
      <p className="text-sm font-bold">{count} observações</p>
      <p className="mt-1 text-xs text-muted-foreground">O senhor quer ouvi-las?</p>
    </GlassCard>
  );
}
