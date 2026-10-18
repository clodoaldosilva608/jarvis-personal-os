import { useEffect, useRef } from "react";
import type { OrbState } from "@/types/jarvis";
import { OrbRenderer } from "./renderer";
import { cn } from "@/lib/utils";

export interface OrbProps {
  state: OrbState;
  intensity?: number;
  userImage?: string;
  size?: number;
  className?: string;
}

export function Orb({ state, intensity = 0.6, userImage, size = 480, className }: OrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<OrbRenderer | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const r = new OrbRenderer(canvas);
    rendererRef.current = r;
    let raf = 0, last = performance.now();
    const loop = (now: number) => {
      r.frame(Math.min(0.05, (now - last) / 1000));
      last = now;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [size]);

  useEffect(() => { rendererRef.current?.setState(state); }, [state]);
  useEffect(() => { if (rendererRef.current) rendererRef.current.intensity = intensity; }, [intensity]);
  useEffect(() => {
    if (!rendererRef.current) return;
    if (!userImage) { rendererRef.current.image = null; return; }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = userImage;
    rendererRef.current.image = img;
  }, [userImage]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={`J.A.R.V.I.S. orb — ${state}`}
      className={cn("pointer-events-none select-none", className)}
      style={{ width: size, height: size }}
    />
  );
}
