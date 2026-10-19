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
            "radial-gradient(ellipse at center, #0a1430 0%, #050a1c 50%, #020410 100%)",
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
        {/* Layer A — Wide atmospheric halo (deep electric blue, not cyan) */}
        <div
          style={{
            position: "absolute",
            inset: "-30%",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(20,90,220,0.30) 0%, rgba(20,60,180,0.12) 35%, transparent 70%)",
            filter: "blur(70px)",
          }}
        />

        {/* Layer B — Mid-range blue glow ring */}
        <div
          style={{
            position: "absolute",
            inset: "-8%",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(20,90,220,0.20) 30%, rgba(20,90,220,0.08) 50%, transparent 70%)",
            filter: "blur(35px)",
          }}
        />

        {/* Layer C — Soft central glow (subtle, NOT a bright "sun" — reference has a darker center) */}
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
              "radial-gradient(circle, rgba(180,210,255,0.30) 0%, rgba(20,90,220,0.18) 35%, rgba(20,60,180,0.06) 65%, transparent 85%)",
            filter: "blur(20px)",
            boxShadow:
              "0 0 60px rgba(20,90,220,0.35), 0 0 120px rgba(20,90,220,0.20)",
          }}
        />

        {/* Layer D — Decorative rings (very subtle, just hints of structure) */}
        <div
          style={{
            position: "absolute",
            inset: "8%",
            borderRadius: "50%",
            border: "1px solid rgba(20,90,220,0.20)",
            boxShadow:
              "0 0 20px rgba(20,90,220,0.15), inset 0 0 20px rgba(20,90,220,0.08)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: "22%",
            borderRadius: "50%",
            border: "1px dashed rgba(20,90,220,0.15)",
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
