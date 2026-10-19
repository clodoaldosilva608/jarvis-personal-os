import type { OrbState } from "@/types/jarvis";

interface Strand { amps: number[]; phases: number[]; speeds: number[]; width: number; alpha: number; offset: number }
interface Node { strand: number; theta: number; speed: number; size: number }

interface Params { rot: number; speed: number; expand: number; glow: number; hue: number; flash: number }

const TARGETS: Record<OrbState, Omit<Params, "flash">> = {
  idle: { rot: 0.08, speed: 0.5, expand: 1, glow: 1.4, hue: 0 },
  listening: { rot: 0.14, speed: 1.1, expand: 1.08, glow: 1.8, hue: 0 },
  speaking: { rot: 0.12, speed: 0.9, expand: 1.03, glow: 2.0, hue: 0 },
  thinking: { rot: 0.45, speed: 1.6, expand: 0.98, glow: 2.6, hue: 0 },
  identifying: { rot: 0.2, speed: 0.8, expand: 1.05, glow: 1.8, hue: 0 },
  success: { rot: 0.1, speed: 0.6, expand: 0.9, glow: 2.8, hue: 0 },
  error: { rot: 0.1, speed: 1.2, expand: 1, glow: 2.2, hue: 1 },
};

/** Canvas 2D renderer for the energy-strand orb. Deterministic seeds (no module-scope randomness). */
export class OrbRenderer {
  private ctx: CanvasRenderingContext2D;
  private strands: Strand[] = [];
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
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 38; i++) {
      this.strands.push({
        amps: [0.05 + rnd() * 0.06, 0.03 + rnd() * 0.05, 0.015 + rnd() * 0.03],
        phases: [rnd() * 6.28, rnd() * 6.28, rnd() * 6.28],
        speeds: [(rnd() - 0.5) * 1.2, (rnd() - 0.5) * 1.6, (rnd() - 0.5) * 2],
        width: 0.5 + rnd() * 1.4,
        alpha: 0.15 + rnd() * 0.45,
        offset: (rnd() - 0.5) * 0.08,
      });
    }
    for (let i = 0; i < 6; i++) this.nodes.push({ strand: Math.floor(rnd() * 38), theta: rnd() * 6.28, speed: 0.2 + rnd() * 0.4, size: 0.7 + rnd() * 0.6 });
  }

  setState(s: OrbState) {
    if (s === "success") this.p.flash = 1;
    if (s === "error") this.p.flash = 0.6;
    this.state = s;
  }

  private radius(s: Strand, th: number, R: number) {
    const t = this.t;
    const k = [3, 5, 7];
    let r = 1 + s.offset;
    for (let i = 0; i < 3; i++) r += s.amps[i]! * Math.sin(k[i]! * th + s.phases[i]! + t * s.speeds[i]!);
    return r * R;
  }

  frame(dt: number) {
    const { canvas, ctx } = this;
    const w = canvas.width, h = canvas.height;
    const target = TARGETS[this.state];
    const k = Math.min(1, dt * 3);
    for (const key of ["rot", "speed", "expand", "glow", "hue"] as const) this.p[key] += (target[key] - this.p[key]) * k;
    this.p.flash = Math.max(0, this.p.flash - dt * 1.2);
    this.t += dt * this.p.speed * (0.6 + this.intensity * 0.8);

    const cx = w / 2, cy = h / 2;
    const breathe = 1 + Math.sin(this.t * 1.4) * 0.015;
    const R = Math.min(w, h) * 0.34 * this.p.expand * breathe;
    const rot = this.t * this.p.rot * 2;
    const hue = this.p.hue;
    const col = (a: number) => {
      const r = Math.round(0 + 239 * hue), g = Math.round(200 - 132 * hue), b = Math.round(255 - 187 * hue);
      return `rgba(${r},${g},${b},${a})`;
    };

    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = "lighter";

    // core glow — boosted for visible central halo
    const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.25);
    core.addColorStop(0, col(Math.min(1, 0.32 * this.p.glow + this.p.flash * 0.6)));
    core.addColorStop(0.4, col(Math.min(1, 0.18 * this.p.glow)));
    core.addColorStop(0.7, col(Math.min(1, 0.08 * this.p.glow)));
    core.addColorStop(1, col(0));
    ctx.fillStyle = core;
    ctx.fillRect(0, 0, w, h);

    // bright white-hot core dot
    const hot = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.18);
    hot.addColorStop(0, "rgba(255,255,255,0.95)");
    hot.addColorStop(0.5, "rgba(220,250,255,0.55)");
    hot.addColorStop(1, "rgba(0,229,255,0)");
    ctx.fillStyle = hot;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.18, 0, Math.PI * 2);
    ctx.fill();

    // speaking waves
    if (this.state === "speaking" && this.t - this.lastWave > 0.5) { this.waves.push(0); this.lastWave = this.t; }
    this.waves = this.waves.map((x) => x + dt * 0.6).filter((x) => x < 1);
    for (const wv of this.waves) {
      ctx.beginPath();
      ctx.arc(cx, cy, R * (0.3 + wv * 1.1), 0, Math.PI * 2);
      ctx.strokeStyle = col((1 - wv) * 0.5);
      ctx.lineWidth = 2 * (w / 600);
      ctx.stroke();
    }

    // strands
    const scale = w / 600;
    const steps = 140;
    ctx.lineCap = "round";
    for (const s of this.strands) {
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const th = (i / steps) * Math.PI * 2;
        const r = this.radius(s, th, R);
        const x = cx + Math.cos(th + rot) * r, y = cy + Math.sin(th + rot) * r;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      // Wide soft halo stroke
      ctx.strokeStyle = col(Math.min(1, s.alpha * 0.6 * this.p.glow));
      ctx.lineWidth = s.width * 4 * scale;
      ctx.stroke();
      // Bright core stroke — boosted for visibility against dark background
      ctx.strokeStyle = col(Math.min(1, s.alpha * 1.8 * this.p.glow + this.p.flash * 0.5));
      ctx.lineWidth = s.width * scale;
      ctx.stroke();
    }

    // bright nodes
    for (const n of this.nodes) {
      n.theta += dt * n.speed * this.p.speed;
      const r = this.radius(this.strands[n.strand]!, n.theta, R);
      const x = cx + Math.cos(n.theta + rot) * r, y = cy + Math.sin(n.theta + rot) * r;
      const g = ctx.createRadialGradient(x, y, 0, x, y, 22 * n.size * scale);
      g.addColorStop(0, col(0.95));
      g.addColorStop(0.25, col(0.45));
      g.addColorStop(1, col(0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, 22 * n.size * scale, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalCompositeOperation = "source-over";

    // identifying: user image + scan ring
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
        ctx.fillStyle = col(0.08);
        ctx.fillRect(cx - ir, cy - ir, ir * 2, ir * 2);
      }
      const sy = cy - ir + ((this.t * 0.8) % 1) * ir * 2;
      const lg = ctx.createLinearGradient(0, sy - 30 * scale, 0, sy);
      lg.addColorStop(0, col(0));
      lg.addColorStop(1, col(0.6));
      ctx.fillStyle = lg;
      ctx.fillRect(cx - ir, sy - 30 * scale, ir * 2, 30 * scale);
      ctx.restore();
      ctx.lineWidth = 2 * scale;
      ctx.strokeStyle = col(0.9);
      ctx.beginPath();
      ctx.arc(cx, cy, ir + 8 * scale, this.t * 3, this.t * 3 + Math.PI * 1.2);
      ctx.stroke();
      ctx.strokeStyle = col(0.35);
      ctx.beginPath();
      ctx.arc(cx, cy, ir + 16 * scale, -this.t * 2, -this.t * 2 + Math.PI * 0.6);
      ctx.stroke();
    }
  }
}
