import { useEffect, useState } from "react";
import { useHydrated } from "@tanstack/react-router";
import { Orb } from "./Orb";
import { useJarvis } from "@/stores/jarvis";

/**
 * GlobalOrb — fixed full-viewport Canvas orb that renders behind all pages.
 * Visible on EVERY route (home, briefing, settings, etc).
 * Size scales with viewport so it's always the dominant visual element.
 */
export function GlobalOrb() {
  const hydrated = useHydrated();
  const orbState = useJarvis((s) => s.orbState);
  const [size, setSize] = useState(520);

  useEffect(() => {
    const calc = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // Largest possible orb that fits both dimensions, min 420 (mobile), max 720 (desktop)
      const target = Math.max(420, Math.min(vw * 0.55, vh * 0.72, 720));
      setSize(target);
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  // Always render the glow container (SSR + client) so users see *something*
  // immediately. The Canvas itself only mounts after hydration.
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: size,
        height: size,
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
      {/* Soft outer halo — always visible, even during SSR */}
      <div
        style={{
          position: "absolute",
          inset: "-10%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(0,229,255,0.18) 0%, rgba(0,229,255,0.06) 35%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Canvas orb — mounts after hydration, animates 38 strands + 6 nodes */}
      {hydrated && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Orb state={orbState} size={size} className="pointer-events-none" />
        </div>
      )}
    </div>
  );
}
