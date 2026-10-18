import { useHydrated } from "@tanstack/react-router";
import { useMemo } from "react";

export function Particles({ count = 28 }: { count?: number }) {
  const hydrated = useHydrated();
  const items = useMemo(
    () => (hydrated ? Array.from({ length: count }, () => ({ left: Math.random() * 100, delay: Math.random() * 20, dur: 14 + Math.random() * 16, size: 1 + Math.random() * 2 })) : []),
    [hydrated, count],
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {items.map((p, i) => (
        <span key={i} className="absolute bottom-0 rounded-full bg-primary/60" style={{ left: `${p.left}%`, width: p.size, height: p.size, animation: `float-up ${p.dur}s linear ${p.delay}s infinite` }} />
      ))}
    </div>
  );
}
