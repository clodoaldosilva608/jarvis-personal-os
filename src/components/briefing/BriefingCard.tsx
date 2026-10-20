import { motion } from "framer-motion";
import { GlassCard } from "@/components/jarvis";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/**
 * BriefingCard — shared wrapper for all briefing cards.
 *
 * Uses framer-motion to fade+scale in from below when `visible` becomes true.
 * Cards are absolutely positioned around the orb (see BriefingOverlay).
 */

export interface BriefingCardProps {
  visible: boolean;
  /** Position class around the orb. Examples: "top-8 left-8", "bottom-8 right-8". */
  positionClass: string;
  /** Max width on desktop. */
  width?: string;
  /** Highlighted (active narration) — adds neon glow. */
  active?: boolean;
  children: ReactNode;
}

export function BriefingCard({ visible, positionClass, width = "w-[280px]", active, children }: BriefingCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.92 }}
      animate={visible ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 20, scale: 0.92 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "pointer-events-auto absolute z-30",
        width,
        positionClass,
      )}
    >
      <GlassCard
        className={cn(
          "p-4 transition-all duration-300",
          active && "border-primary/60 neon-glow-strong",
        )}
      >
        {children}
      </GlassCard>
    </motion.div>
  );
}
