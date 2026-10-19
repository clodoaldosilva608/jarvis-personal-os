import type { OrbState } from "@/types/jarvis";

interface Ribbon {
  // 3 superimposed sine harmonics for organic, flowing radius modulation
  amps: [number, number, number];
  phases: [number, number, number];
  speeds: [number, number, number];
  // base width of the ribbon (px at scale=1)
  width: number;
  // peak brightness of this ribbon (0..1)
  peak: number;
  // per-ribbon rotational offset (radians) — makes the halo asymmetric
  rotation: number;
  // per-ribbon radial offset (fraction of R) — adds depth between layers
  radialOffset: number;
  // hue shift applied to this ribbon (-1 = pure blue, 0 = cyan, +1 = white)
  hueShift: number;
}
interface Node { ribbon: number; theta: number; speed: number; size: number; }

interface Params { rot: number; speed: number; expand: number; glow: number; flash: number; }

// Lower glow values look darker; the bright halo comes from the wide blur strokes below.
const TARGETS: Record<OrbState, Omit<Params, "flash">> = {
  idle:       { rot: 0.10, speed: 0.35, expand: 1.00, glow: 1.0 },
  listening:  { rot: 0.18, speed: 0.85, expand: 1.06, glow: 1.4 },
  speaking:   { rot: 0.16, speed: 0.70, expand: 1.03, glow: 1.6 },
  thinking:   { rot: 0.55, speed: 1.30, expand: 0.96, glow: 2.0 },
  identifying:{ rot: 0.25, speed: 0.65, expand: 1.05, glow: 1.4 },
  success:    { rot: 0.14, speed: 0.50, expand: 0.92, glow: 2.2 },
  error:      { rot: 0.20, speed: 1.10, expand: 1.00, glow: 1.6 },
};

/**
 * Canvas 2D renderer for the JARVIS energy-ribbon orb.
 *
 * Visual identity (matches Lovable reference):
 *   - ~12 wide flowing ribbons (not thin lines), each composed of 3 layered
 *     strokes (wide soft halo + mid glow + bright core) for a "liquid light"
 *     look.
 *   - 4-5 bright asymmetric nodes (hotspots) on the ring.
 *   - Deep sky-blue color (HSL ~210°, 90%, 75%) fading to deep blue at edges.
 *   - Background gradient + vignette done in CSS (see GlobalOrb.tsx).
 *   - Strands use 3 harmonics of sine noise → organic, breathing motion.
 */
export class OrbRenderer {
  private ctx: CanvasRenderingContext2D;
  private ribbons: Ribbon[] = [];
  private nodes: Node[] = [];
  private p: Params = { ...TARGETS.idle, flash: 0 };
  private t = 0;
  private waves: number[] = [];
  private lastWave = 0;
  state: OrbState = "idle";
  intensity = 0.6;
  image: HTMLImageElement | null = null;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d")!;
    let seed = 13;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    // 12 main ribbons — wide flowing bands (not 38 thin lines)
    for (let i = 0; i < 12; i++) {
      this.ribbons.push({
        amps: [
          0.08 + rnd() * 0.10,
          0.04 + rnd() * 0.08,
          0.02 + rnd() * 0.04,
        ],
        phases: [rnd() * 6.28, rnd() * 6.28, rnd() * 6.28],
        speeds: [(rnd() - 0.5) * 0.9, (rnd() - 0.5) * 1.3, (rnd() - 0.5) * 1.7],
        width: 1.2 + rnd() * 2.4,
        peak: 0.55 + rnd() * 0.45,
        rotation: (i / 12) * Math.PI * 2 + (rnd() - 0.5) * 0.3,
        radialOffset: (rnd() - 0.5) * 0.10,
        hueShift: (rnd() - 0.5) * 0.4,
      });
    }
    // 5 asymmetric hotspot nodes
    const nodeAngles = [0.4, 1.7, 2.9, 4.3, 5.5];
    for (let i = 0; i < 5; i++) {
      this.nodes.push({
        ribbon: Math.floor(rnd() * 12),
        theta: nodeAngles[i]! + (rnd() - 0.5) * 0.2,
        speed: 0.15 + rnd() * 0.30,
        size: 0.9 + rnd() * 0.5,
      });
    }
  }

  setState(s: OrbState) {
    if (s === "success") this.p.flash = 1;
    if (s === "error") this.p.flash = 0.6;
    this.state = s;
  }

  // 3-harmonic radius function — produces smooth, organic, breathing shapes
  private radius(r: Ribbon, th: number, R: number) {
    const t = this.t;
    const k = [3, 5, 7];
    let val = 1 + r.radialOffset;
    for (let i = 0; i < 3; i++) val += r.amps[i]! * Math.sin(k[i]! * th + r.phases[i]! + t * r.speeds[i]!);
    return val * R;
  }

  // Color: deep electric blue / indigo (matches Lovable reference).
  // Baseline rgb(20, 90, 220). Hue shift > 0 → toward white.
  // Less saturated than cyan, more "midnight electric" feel.
  private col(a: number, hueShift = 0) {
    const shift = Math.max(-1, Math.min(1, hueShift));
    const r = Math.round(20 + (255 - 20) * Math.max(0, shift));
    const g = Math.round(90 + (255 - 90) * Math.max(0, shift));
    const b = Math.round(220 + (255 - 220) * Math.max(0, shift));
    return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, a))})`;
  }

  frame(dt: number) {
    const { canvas, ctx } = this;
    const w = canvas.width, h = canvas.height;
    const target = TARGETS[this.state];
    const k = Math.min(1, dt * 3);
    for (const key of ["rot", "speed", "expand", "glow"] as const) {
      this.p[key] += (target[key] - this.p[key]) * k;
    }
    this.p.flash = Math.max(0, this.p.flash - dt * 1.2);
    this.t += dt * this.p.speed * (0.6 + this.intensity * 0.8);

    const cx = w / 2, cy = h / 2;
    const breathe = 1 + Math.sin(this.t * 1.2) * 0.02;
    const R = Math.min(w, h) * 0.34 * this.p.expand * breathe;
    const rot = this.t * this.p.rot * 2;

    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = "lighter";

    // === Layer 1: wide atmospheric halo (the "aura" that bleeds into the background) ===
    const halo = ctx.createRadialGradient(cx, cy, R * 0.3, cx, cy, R * 2.2);
    halo.addColorStop(0, this.col(0.10 * this.p.glow, 0));
    halo.addColorStop(0.4, this.col(0.06 * this.p.glow, 0));
    halo.addColorStop(1, this.col(0, 0));
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, w, h);

    // === Layer 2: core glow (cyan-blue radial gradient in the center) ===
    const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.1);
    core.addColorStop(0, this.col(0.35 * this.p.glow + this.p.flash * 0.4, +0.6));
    core.addColorStop(0.4, this.col(0.15 * this.p.glow, 0));
    core.addColorStop(1, this.col(0, 0));
    ctx.fillStyle = core;
    ctx.fillRect(0, 0, w, h);

    // === Layer 3: speaking waves (concentric pulses emanating from core) ===
    if (this.state === "speaking" && this.t - this.lastWave > 0.5) {
      this.waves.push(0);
      this.lastWave = this.t;
    }
    this.waves = this.waves.map((x) => x + dt * 0.6).filter((x) => x < 1);
    for (const wv of this.waves) {
      ctx.beginPath();
      ctx.arc(cx, cy, R * (0.3 + wv * 1.1), 0, Math.PI * 2);
      ctx.strokeStyle = this.col((1 - wv) * 0.5, 0);
      ctx.lineWidth = 2 * (w / 600);
      ctx.stroke();
    }

    // === Layer 4: the 12 flowing ribbons ===
    // Each ribbon draws 3 stacked strokes:
    //   (a) wide soft halo (low alpha, large line width)
    //   (b) mid glow (medium alpha, medium width)
    //   (c) bright core (high alpha, thin) — produces the "liquid light" look
    // Widths are tuned to be ethereal and airy, not chunky.
    const scale = w / 600;
    const steps = 200; // smooth curves
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const r of this.ribbons) {
      // Pre-compute path points
      const pts: [number, number][] = [];
      for (let i = 0; i <= steps; i++) {
        const th = (i / steps) * Math.PI * 2;
        const rr = this.radius(r, th + r.rotation, R);
        const x = cx + Math.cos(th + rot + r.rotation) * rr;
        const y = cy + Math.sin(th + rot + r.rotation) * rr;
        pts.push([x, y]);
      }

      // (a) Wide soft halo stroke — airy outer glow
      ctx.beginPath();
      for (let i = 0; i < pts.length; i++) {
        const [x, y] = pts[i]!;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.strokeStyle = this.col(r.peak * 0.10 * this.p.glow, r.hueShift);
      ctx.lineWidth = r.width * 7 * scale;
      ctx.stroke();

      // (b) Mid glow stroke
      ctx.beginPath();
      for (let i = 0; i < pts.length; i++) {
        const [x, y] = pts[i]!;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.strokeStyle = this.col(r.peak * 0.30 * this.p.glow, r.hueShift);
      ctx.lineWidth = r.width * 2.5 * scale;
      ctx.stroke();

      // (c) Bright core stroke — thin and sharp
      ctx.beginPath();
      for (let i = 0; i < pts.length; i++) {
        const [x, y] = pts[i]!;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.strokeStyle = this.col(Math.min(1, r.peak * 0.85 * this.p.glow + this.p.flash * 0.4), r.hueShift + 0.3);
      ctx.lineWidth = r.width * 0.7 * scale;
      ctx.stroke();
    }

    // === Layer 5: bright hotspot nodes ===
    for (const n of this.nodes) {
      n.theta += dt * n.speed * this.p.speed;
      const r = this.ribbons[n.ribbon]!;
      const rr = this.radius(r, n.theta + r.rotation, R);
      const x = cx + Math.cos(n.theta + rot + r.rotation) * rr;
      const y = cy + Math.sin(n.theta + rot + r.rotation) * rr;
      // Outer wide halo
      const g1 = ctx.createRadialGradient(x, y, 0, x, y, 32 * n.size * scale);
      g1.addColorStop(0, this.col(0.55 * this.p.glow, +0.5));
      g1.addColorStop(0.4, this.col(0.20 * this.p.glow, 0));
      g1.addColorStop(1, this.col(0, 0));
      ctx.fillStyle = g1;
      ctx.beginPath();
      ctx.arc(x, y, 32 * n.size * scale, 0, Math.PI * 2);
      ctx.fill();
      // Bright core dot (near-white)
      const g2 = ctx.createRadialGradient(x, y, 0, x, y, 8 * n.size * scale);
      g2.addColorStop(0, this.col(0.95, +0.8));
      g2.addColorStop(0.6, this.col(0.60, +0.4));
      g2.addColorStop(1, this.col(0, 0));
      ctx.fillStyle = g2;
      ctx.beginPath();
      ctx.arc(x, y, 8 * n.size * scale, 0, Math.PI * 2);
      ctx.fill();
    }

    // === Layer 6: white-hot center dot (the "arc reactor" core) ===
    const hot = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.15);
    hot.addColorStop(0, "rgba(255,255,255,0.95)");
    hot.addColorStop(0.4, this.col(0.65, +0.7));
    hot.addColorStop(1, this.col(0, 0));
    ctx.fillStyle = hot;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.15, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = "source-over";

    // === Layer 7 (state-specific): Face ID scan ring when identifying ===
    if (this.state === "identifying") {
      const ir = R * 0.55;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, ir, 0, Math.PI * 2);
      ctx.clip();
      if (this.image?.complete && this.image.naturalWidth) {
        ctx.globalAlpha = 0.85;
        ctx.drawImage(this.image, cx - ir, cy - ir, ir * 2, ir * 2);
        ctx.globalAlpha = 1;
      } else {
        ctx.fillStyle = this.col(0.08);
        ctx.fillRect(cx - ir, cy - ir, ir * 2, ir * 2);
      }
      const sy = cy - ir + ((this.t * 0.8) % 1) * ir * 2;
      const lg = ctx.createLinearGradient(0, sy - 30 * scale, 0, sy);
      lg.addColorStop(0, this.col(0));
      lg.addColorStop(1, this.col(0.6));
      ctx.fillStyle = lg;
      ctx.fillRect(cx - ir, sy - 30 * scale, ir * 2, 30 * scale);
      ctx.restore();
      ctx.lineWidth = 2 * scale;
      ctx.strokeStyle = this.col(0.9, +0.5);
      ctx.beginPath();
      ctx.arc(cx, cy, ir + 8 * scale, this.t * 3, this.t * 3 + Math.PI * 1.2);
      ctx.stroke();
      ctx.strokeStyle = this.col(0.35);
      ctx.beginPath();
      ctx.arc(cx, cy, ir + 16 * scale, -this.t * 2, -this.t * 2 + Math.PI * 0.6);
      ctx.stroke();
    }
  }
}
