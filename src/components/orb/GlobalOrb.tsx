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
      {/* Outer atmospheric halo — soft glow visible against dark background */}
      <div
        style={{
          position: "absolute",
          inset: "-15%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(0,229,255,0.30) 0%, rgba(0,229,255,0.10) 35%, transparent 70%)",
          filter: "blur(50px)",
        }}
      />

      {/* Static bright core — always visible (even before hydration) */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "30%",
          height: "30%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,255,255,0.85) 0%, rgba(0,229,255,0.55) 30%, rgba(0,229,255,0.15) 60%, transparent 80%)",
          filter: "blur(20px)",
          boxShadow:
            "0 0 80px rgba(0,229,255,0.55), 0 0 160px rgba(0,229,255,0.30)",
        }}
      />

      {/* Decorative rings — visible immediately (no hydration needed) */}
      <div
        style={{
          position: "absolute",
          inset: "8%",
          borderRadius: "50%",
          border: "2px solid rgba(0,229,255,0.35)",
          boxShadow: "0 0 30px rgba(0,229,255,0.25), inset 0 0 30px rgba(0,229,255,0.15)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: "22%",
          borderRadius: "50%",
          border: "1.5px dashed rgba(0,229,255,0.30)",
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
