import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock, Unlock, RefreshCw, Monitor, Activity, Cpu, ShieldAlert, Scan } from "lucide-react";
import { GlassCard, SectionHeader, StatusBadge } from "@/components/jarvis";
import { useMonitors } from "@/stores/monitors";
import { useUnlockFlow } from "@/hooks/use-unlock-flow";
import { cn } from "@/lib/utils";
import type { MonitorModule } from "@/types/smarthome";

export const Route = createFileRoute("/_dashboard/monitors")({
  head: () => ({ meta: [{ title: "Monitores — J.A.R.V.I.S." }] }),
  component: MonitorsPage,
});

function moduleLabel(m: MonitorModule) {
  switch (m) {
    case "command-center": return "Centro de Comando";
    case "news-radar": return "Radar de Notícias";
    case "hud": return "HUD Principal";
    default: return "Custom";
  }
}

function MonitorsPage() {
  const monitors = useMonitors();
  const unlockFlow = useUnlockFlow();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const cleanup = monitors.initSync();
    setHydrated(true);
    return cleanup;
  }, [monitors]);

  const lockedCount = monitors.globalLocked ? monitors.monitors.length : 0;
  const activeCount = monitors.monitors.length - lockedCount;

  return (
    <div className="mx-auto max-w-5xl pb-16">
      <SectionHeader
        title="Multi-Monitor"
        subtitle={`${activeCount} ativos · ${lockedCount} bloqueados · ${monitors.monitors.length} total`}
        action={
          <div className="flex gap-2">
            <StatusBadge tone={monitors.globalLocked ? "warning" : "success"} live>
              {monitors.globalLocked ? "BLOQUEADO" : "ATIVO"}
            </StatusBadge>
            <button
              onClick={() => monitors.globalLocked ? unlockFlow.start() : unlockFlow.lock()}
              disabled={unlockFlow.running}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-semibold transition disabled:opacity-50",
                monitors.globalLocked
                  ? "border-primary bg-primary/10 text-primary hover:bg-primary/20"
                  : "border-warning/40 bg-warning/10 text-warning hover:bg-warning/20"
              )}
            >
              {monitors.globalLocked ? <Unlock className="size-4" /> : <Lock className="size-4" />}
              {monitors.globalLocked ? "Ativar monitores" : "Bloquear"}
            </button>
          </div>
        }
      />

      {/* === Scan in progress banner === */}
      {monitors.scanning && (
        <GlassCard className="mb-4 border-primary/40 neon-glow-strong">
          <div className="flex items-center gap-3">
            <Scan className="size-5 animate-pulse text-primary" />
            <div className="flex-1">
              <div className="text-sm font-bold text-primary">ESCANEANDO…</div>
              <div className="text-xs text-muted-foreground">Reconhecimento facial em andamento ({monitors.scanProgress}%)</div>
            </div>
            <span className="font-mono text-2xl font-bold text-primary">{Math.round(monitors.scanProgress)}%</span>
          </div>
          {/* Progress bar */}
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-glass">
            <div
              className="h-full bg-primary transition-all duration-200"
              style={{ width: `${monitors.scanProgress}%` }}
            />
          </div>
        </GlassCard>
      )}

      {/* === Monitor grid === */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {monitors.monitors.map((m) => (
          <MonitorCard
            key={m.id}
            id={m.id}
            name={m.name}
            module={m.module}
            locked={monitors.globalLocked || m.locked}
            scanning={monitors.scanning}
          />
        ))}
      </div>

      {/* === Multi-window launcher === */}
      <GlassCard className="mt-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Cpu className="size-5 text-primary" />
            <div>
              <div className="hud-label text-primary">SINCRONIZAÇÃO MULTI-WINDOW</div>
              <p className="mt-1 text-xs text-muted-foreground">
                Abra cada monitor em uma janela separada. O estado de bloqueio sincroniza via BroadcastChannel.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => window.open("/", "jarvis-hud", "width=1280,height=800")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/20"
            >
              <Monitor className="size-3.5" /> Abrir HUD
            </button>
            <button
              onClick={() => window.open("/monitors", "jarvis-monitors", "width=480,height=800")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-glass px-3 py-1.5 text-xs text-muted-foreground transition hover:text-primary"
            >
              <Monitor className="size-3.5" /> Abrir Monitores
            </button>
          </div>
        </div>
      </GlassCard>

      {!hydrated && (
        <p className="mt-4 text-center text-xs text-subtle">Inicializando sincronização…</p>
      )}
    </div>
  );
}

function MonitorCard({
  id,
  name,
  module,
  locked,
  scanning,
}: {
  id: string;
  name: string;
  module: MonitorModule;
  locked: boolean;
  scanning: boolean;
}) {
  const monitors = useMonitors();
  return (
    <GlassCard
      key={id}
      className={cn(
        "relative p-4 transition",
        locked ? "border-warning/30 opacity-90" : "border-success/30",
        scanning && "border-primary/50 neon-glow-strong"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={cn(
            "flex size-10 items-center justify-center rounded-lg border",
            locked
              ? "border-warning/30 bg-warning/10 text-warning"
              : "border-success/30 bg-success/10 text-success"
          )}>
            {locked ? <Lock className="size-5" /> : <Activity className="size-5" />}
          </div>
          <div>
            <div className="text-sm font-bold text-foreground">{name}</div>
            <div className="text-xs text-muted-foreground">{moduleLabel(module)}</div>
          </div>
        </div>
        <StatusBadge tone={locked ? "warning" : "success"}>
          {locked ? "BLOQUEADO" : "ATIVO"}
        </StatusBadge>
      </div>

      {/* Lock screen content */}
      {locked && !scanning && (
        <div className="mt-4 rounded-lg border border-warning/20 bg-glass p-3 text-center">
          <div className="text-[10px] uppercase tracking-wider text-warning">EM ESPERA</div>
          <p className="mt-1 text-xs text-muted-foreground">INTERFACE PROTEGIDA</p>
          <p className="mt-1 text-[10px] text-subtle">VOZ, AGENDA, E-MAILS E TELEMETRIA — DADOS ATIVOS</p>
        </div>
      )}

      {/* Active content */}
      {!locked && (
        <div className="mt-4 rounded-lg border border-success/20 bg-glass p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-success">● SISTEMA ATIVO</span>
            <span className="font-mono text-subtle">{module}</span>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] uppercase tracking-wider text-subtle">
            <div>VOZ<br /><span className="text-success">OK</span></div>
            <div>AGENDA<br /><span className="text-success">OK</span></div>
            <div>E-MAILS<br /><span className="text-success">OK</span></div>
          </div>
        </div>
      )}

      {/* Scan animation overlay */}
      {scanning && (
        <div className="mt-4 rounded-lg border border-primary/40 bg-primary/5 p-3 text-center">
          <RefreshCw className="mx-auto size-5 animate-spin text-primary" />
          <p className="mt-1 text-xs font-semibold text-primary">ESCANEANDO…</p>
        </div>
      )}

      {/* Per-monitor lock toggle (only when global is unlocked) */}
      {!monitors.globalLocked && !scanning && (
        <button
          onClick={() => {/* per-monitor lock would go here */}}
          className="mt-3 w-full rounded-lg border border-border bg-glass py-1.5 text-[10px] uppercase tracking-wider text-subtle transition hover:text-primary"
        >
          {locked ? "Desbloquear" : "Bloquear"}
        </button>
      )}
    </GlassCard>
  );
}

// Helper to avoid unused import warning
void ShieldAlert;
