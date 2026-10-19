import { useEffect, useState } from "react";
import { useHydrated } from "@tanstack/react-router";
import { Orb } from "./Orb";
import { useJarvis } from "@/stores/jarvis";

/**
 * GlobalOrb — fixed full-viewport Canvas orb that renders behind all pages.
 *
 * Visual identity (matches the Lovable reference image):
 *   - Deep blue radial-gradient background (not pure black)
 *   - Wide atmospheric halo bleeding into the background
 *   - 12 flowing ribbons + 5 hotspot nodes + white-hot core
 *   - Soft ring decorations (visible immediately, before hydration)
 *
 * Visible on EVERY route (home, briefing, settings, etc).
 * Size scales with viewport so it's always the dominant visual element.
 */
export function GlobalOrb() {
  const hydrated = useHydrated();
  const orbState = useJarvis((s) => s.orbState);
  const [size, setSize] = useState(560);

  useEffect(() => {
    const calc = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // Largest possible orb that fits both dimensions, min 480 (mobile), max 760 (desktop)
      const target = Math.max(480, Math.min(vw * 0.58, vh * 0.78, 760));
      setSize(target);
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  return (
    <>
      {/* === Deep-blue radial background gradient (replaces pure-black page bg) ===
          This is rendered as a fixed full-viewport layer BEHIND the orb.
          Center is slightly brighter (illuminated by the orb), edges fade to deep navy. */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: -2,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse at center, #0c1834 0%, #050a1a 55%, #02050f 100%)",
        }}
      />

      {/* === The orb container itself === */}
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
        {/* Layer A — Wide atmospheric halo (the "aura" that bleeds into bg) */}
        <div
          style={{
            position: "absolute",
            inset: "-25%",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(0,191,255,0.30) 0%, rgba(0,140,210,0.12) 35%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />

        {/* Layer B — Mid-range cyan glow ring */}
        <div
          style={{
            position: "absolute",
            inset: "-5%",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(0,191,255,0.20) 30%, rgba(0,191,255,0.08) 50%, transparent 70%)",
            filter: "blur(30px)",
          }}
        />

        {/* Layer C — Static bright white-hot core (always visible, even pre-hydration) */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "26%",
            height: "26%",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(255,255,255,0.85) 0%, rgba(180,235,255,0.55) 25%, rgba(0,191,255,0.30) 55%, rgba(0,140,210,0.10) 75%, transparent 90%)",
            filter: "blur(15px)",
            boxShadow:
              "0 0 80px rgba(0,191,255,0.55), 0 0 160px rgba(0,191,255,0.30), 0 0 240px rgba(0,140,210,0.20)",
          }}
        />

        {/* Layer D — Decorative rings (visible immediately, no hydration needed) */}
        <div
          style={{
            position: "absolute",
            inset: "6%",
            borderRadius: "50%",
            border: "1.5px solid rgba(0,191,255,0.30)",
            boxShadow:
              "0 0 30px rgba(0,191,255,0.20), inset 0 0 30px rgba(0,191,255,0.10)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: "18%",
            borderRadius: "50%",
            border: "1px dashed rgba(0,191,255,0.22)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: "30%",
            borderRadius: "50%",
            border: "0.5px solid rgba(0,191,255,0.18)",
          }}
        />

        {/* Layer E — Canvas orb (12 ribbons + 5 hotspot nodes + white-hot core) */}
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
    </>
  );
}
