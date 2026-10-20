import { motion, AnimatePresence } from "framer-motion";
import { PanoramaCard } from "./PanoramaCard";
import { WeatherCard } from "./WeatherCard";
import { AgendaCard } from "./AgendaCard";
import { PriorityEmailsCard } from "./PriorityEmailsCard";
import { NewsCard } from "./NewsCard";
import { GlassCard } from "@/components/jarvis";
import { Heart, Newspaper, Mail, CalendarDays, CloudSun, Activity } from "lucide-react";
import type { BriefingData } from "@/types/briefing";

/**
 * BriefingOverlay — minimal, video-faithful layout.
 *
 * Video reference (@lucasvictor.ai Frame 5):
 *   - Orb stays centered
 *   - ONE card visible at a time (focus mode)
 *   - Card is positioned at the bottom-third of the orb (overlapping)
 *   - A large caption text shows what JARVIS is currently saying (below the orb)
 *   - Mic button stays at the bottom center
 *
 * Desktop (≥ md): card floats centered, slightly overlapping the orb's lower third.
 * Mobile (< md): card stacks vertically below orb, with caption above mic.
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

interface CardSlot {
  key: keyof RevealedCards;
  positionClass: string;
  width: string;
}

const DESKTOP_SLOTS: CardSlot[] = [
  { key: "panorama", positionClass: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%]", width: "w-[320px]" },
  { key: "weather", positionClass: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%]", width: "w-[320px]" },
  { key: "agenda", positionClass: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%]", width: "w-[300px]" },
  { key: "emails", positionClass: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%]", width: "w-[340px]" },
  { key: "news", positionClass: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%]", width: "w-[340px]" },
  { key: "health", positionClass: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%]", width: "w-[300px]" },
  { key: "closing", positionClass: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%]", width: "w-[280px]" },
];

export function BriefingOverlay({
  data,
  revealedCards,
  activeCard,
}: {
  data: BriefingData;
  revealedCards: RevealedCards;
  activeCard?: keyof RevealedCards;
}) {
  // Determine which card to show as "focused" — the active card from the briefing flow.
  const focusedCard = activeCard ?? "panorama";
  const slot = DESKTOP_SLOTS.find((s) => s.key === focusedCard) ?? DESKTOP_SLOTS[0]!;
  // The caption text is the narration segment for the focused card.
  const captionText = (() => {
    const map: Record<keyof RevealedCards, string> = {
      panorama: data.narration.find((n) => n.revealCard === "panorama")?.text ?? "",
      weather: data.narration.find((n) => n.revealCard === "weather")?.text ?? "",
      agenda: data.narration.find((n) => n.revealCard === "agenda")?.text ?? "",
      emails: data.narration.find((n) => n.revealCard === "emails")?.text ?? "",
      news: data.narration.find((n) => n.revealCard === "news")?.text ?? "",
      health: data.narration.find((n) => n.revealCard === "health")?.text ?? "",
      closing: data.narration.find((n) => n.revealCard === "closing")?.text ?? "",
    };
    return map[focusedCard] ?? "";
  })();

  return (
    <>
      {/* === Focused single card (desktop) === */}
      <div className="pointer-events-none fixed inset-0 z-30 hidden md:block">
        <AnimatePresence mode="wait">
          <motion.div
            key={focusedCard}
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.92 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className={cn("absolute z-30", slot.positionClass, slot.width)}
          >
            {focusedCard === "panorama" && <PanoramaCard visible={true} active={true} />}
            {focusedCard === "weather" && <WeatherCard visible={true} active={true} data={data.weather} />}
            {focusedCard === "agenda" && <AgendaCard visible={true} active={true} data={data.agenda} />}
            {focusedCard === "emails" && <PriorityEmailsCard visible={true} active={true} data={data.emails} />}
            {focusedCard === "news" && (
              <NewsCard
                visible={true}
                active={true}
                data={data.news[0] ?? { id: "n0", category: "Notícias", title: "", source: "", summary: "" }}
                positionClass=""
                width="w-full"
              />
            )}
            {focusedCard === "health" && (
              <HealthCard count={data.healthObservations ?? 0} />
            )}
            {focusedCard === "closing" && (
              <ClosingCard />
            )}
          </motion.div>
        </AnimatePresence>

        {/* === Dotted indicator line under status === */}
        <div className="pointer-events-none absolute left-1/2 top-20 -translate-x-1/2 text-primary/60 tracking-widest">
          {"·".repeat(60)}
        </div>

        {/* === Caption text (what JARVIS is currently saying) — big, centered, below orb === */}
        <div className="pointer-events-none absolute bottom-32 left-1/2 -translate-x-1/2 w-[90vw] max-w-2xl text-center">
          <p className="text-lg font-medium text-foreground/90 leading-relaxed text-glow">
            {captionText}
          </p>
        </div>
      </div>

      {/* === Mobile: stacked card + caption === */}
      <div className="pointer-events-none fixed inset-x-0 top-[50vh] bottom-24 z-30 flex flex-col items-center gap-3 px-4 md:hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={focusedCard}
            initial={{ opacity: 0, y: 20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.92 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md"
          >
            {focusedCard === "panorama" && <PanoramaCard visible={true} active={true} />}
            {focusedCard === "weather" && <WeatherCard visible={true} active={true} data={data.weather} />}
            {focusedCard === "agenda" && <AgendaCard visible={true} active={true} data={data.agenda} />}
            {focusedCard === "emails" && <PriorityEmailsCard visible={true} active={true} data={data.emails} />}
            {focusedCard === "news" && (
              <NewsCard
                visible={true}
                active={true}
                data={data.news[0] ?? { id: "n0", category: "Notícias", title: "", source: "", summary: "" }}
                positionClass=""
                width="w-full"
              />
            )}
            {focusedCard === "health" && <HealthCard count={data.healthObservations ?? 0} />}
            {focusedCard === "closing" && <ClosingCard />}
          </motion.div>
        </AnimatePresence>

        <p className="text-sm font-medium text-foreground/90 leading-relaxed text-glow text-center max-w-md">
          {captionText}
        </p>
      </div>
    </>
  );
}

// Helper to avoid verbose imports
function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}

function HealthCard({ count }: { count: number }) {
  return (
    <GlassCard className="p-4 border-accent/30">
      <div className="mb-1 flex items-center gap-1.5 text-accent-foreground">
        <Heart className="size-3.5" />
        <span className="hud-label">SAÚDE · OBSERVAÇÕES</span>
      </div>
      <h3 className="text-base font-bold">{count} observações</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Tenho {count} observações sobre seus dados de saúde. O senhor quer ouvi-las?
      </p>
    </GlassCard>
  );
}

function ClosingCard() {
  return (
    <GlassCard className="p-4 text-center">
      <Activity className="mx-auto size-8 text-primary" />
      <h3 className="mt-2 text-base font-bold">Foco no essencial</h3>
      <p className="mt-1 text-xs text-muted-foreground">Estou à disposição, senhor.</p>
    </GlassCard>
  );
}

// Suppress unused-import warnings (kept for future use)
void Newspaper;
void Mail;
void CalendarDays;
void CloudSun;
