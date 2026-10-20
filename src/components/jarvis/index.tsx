import { cva, type VariantProps } from "class-variance-authority";
import { Mic, MicOff } from "lucide-react";
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function GlassCard({ className, glow, ...p }: HTMLAttributes<HTMLDivElement> & { glow?: boolean }) {
  return <div className={cn("glass rounded-2xl p-5 transition-all duration-300 hover:border-border-strong", glow && "neon-glow", className)} {...p} />;
}

const neonButton = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        primary: "border border-border-strong bg-primary/10 text-primary hover:bg-primary/20 hover:neon-glow",
        solid: "bg-primary text-primary-foreground hover:neon-glow-strong",
        accent: "bg-accent text-accent-foreground hover:neon-glow-accent",
        ghost: "text-muted-foreground hover:bg-glass hover:text-foreground",
      },
      glow: { true: "neon-glow", false: "" },
      active: { true: "border-primary bg-primary/20 text-primary", false: "" },
    },
    defaultVariants: { variant: "primary", glow: false, active: false },
  },
);
export function NeonButton({ className, variant, glow, active, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof neonButton>) {
  return <button className={cn(neonButton({ variant, glow, active }), className)} {...p} />;
}

const badge = cva("inline-flex items-center gap-2 rounded-full border px-3 py-1 hud-label", {
  variants: {
    tone: {
      primary: "border-border-strong bg-primary/10 text-primary text-glow",
      success: "border-success/40 bg-success/10 text-success",
      danger: "border-destructive/40 bg-destructive/10 text-destructive",
      muted: "border-glass-border bg-glass text-muted-foreground",
    },
  },
  defaultVariants: { tone: "primary" },
});
export function StatusBadge({ children, tone, live, className, dotted }: { children: ReactNode; live?: boolean; className?: string; dotted?: boolean } & VariantProps<typeof badge>) {
  return (
    <span className="flex flex-col items-center gap-0.5">
      <span className={cn(badge({ tone }), className)}>
        {live && <span className="relative flex size-1.5"><span className="absolute inset-0 animate-ping rounded-full bg-current" /><span className="size-1.5 rounded-full bg-current" /></span>}
        {children}
      </span>
      {dotted && (
        <span className="text-primary/60 leading-none tracking-widest text-[8px] select-none" aria-hidden>
          {"·".repeat(30)}
        </span>
      )}
    </span>
  );
}

export function MicButton({ active, onClick, disabled }: { active?: boolean; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={active ? "Parar de ouvir" : "Falar com Jarvis"}
      className={cn(
        "relative flex size-16 items-center justify-center rounded-full border transition-all duration-300 disabled:opacity-40",
        active ? "border-primary bg-primary/20 text-primary neon-glow-strong" : "glass text-primary neon-glow hover:neon-glow-strong",
      )}
    >
      {active && <span className="absolute inset-0 rounded-full border border-primary" style={{ animation: "pulse-ring 1.6s ease-out infinite" }} />}
      {active ? <Mic className="size-6" /> : <MicOff className="size-6 opacity-80" />}
    </button>
  );
}

export function Waveform({ active, bars = 18, className }: { active?: boolean; bars?: number; className?: string }) {
  return (
    <div className={cn("flex h-6 items-center gap-[3px]", className)} aria-hidden>
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className="h-full w-[3px] rounded-full bg-primary"
          style={{ animation: active ? `wave ${0.6 + (i % 5) * 0.12}s ease-in-out ${i * 0.05}s infinite` : undefined, transform: active ? undefined : "scaleY(0.2)", opacity: 0.8 }}
        />
      ))}
    </div>
  );
}

export function MetricCard({ label, value, hint, icon }: { label: string; value: ReactNode; hint?: string; icon?: ReactNode }) {
  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between text-muted-foreground"><span className="hud-label">{label}</span>{icon}</div>
      <div className="mt-2 text-2xl font-semibold text-foreground">{value}</div>
      {hint && <div className="mt-1 text-xs text-subtle">{hint}</div>}
    </GlassCard>
  );
}

export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
