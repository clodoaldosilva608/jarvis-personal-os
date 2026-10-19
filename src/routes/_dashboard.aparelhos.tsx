import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plug, Lightbulb, Power, Home, AlertCircle, RefreshCw } from "lucide-react";
import { GlassCard, SectionHeader, StatusBadge } from "@/components/jarvis";
import { useDevices } from "@/stores/devices";
import { useJarvis } from "@/stores/jarvis";
import { useSpeech } from "@/hooks/use-speech";
import { cn } from "@/lib/utils";
import type { Device, DeviceType } from "@/types/smarthome";

export const Route = createFileRoute("/_dashboard/aparelhos")({
  head: () => ({ meta: [{ title: "Aparelhos — J.A.R.V.I.S." }] }),
  component: AparelhosPage,
});

function deviceIcon(type: DeviceType) {
  switch (type) {
    case "light": return Lightbulb;
    case "switch": return Power;
    case "outlet": return Plug;
    case "group":
    default: return Home;
  }
}

function deviceTypeLabel(t: DeviceType) {
  switch (t) {
    case "light": return "Luz";
    case "switch": return "Interruptor";
    case "outlet": return "Tomada";
    case "group":
    default: return "Grupo";
  }
}

function AparelhosPage() {
  const devices = useDevices((s) => s.devices);
  const toggle = useDevices((s) => s.toggle);
  const setOrbState = useJarvis((s) => s.setOrbState);
  const { speak, supported: ttsSupported } = useSpeech();
  const [filter, setFilter] = useState<"all" | "online" | "ewelink" | "homeassistant">("all");

  const filtered = devices.filter((d) => {
    if (filter === "all") return true;
    if (filter === "online") return d.status === "online";
    return d.source === filter;
  });

  const onlineCount = devices.filter((d) => d.status === "online").length;
  const onCount = devices.filter((d) => d.state === "on").length;

  const sayAndToggle = (d: Device) => {
    if (d.status === "offline") return;
    toggle(d.id);
    const next = d.state === "on" ? "off" : "on";
    const verb = next === "on" ? "Ligando" : "Desligando";
    setOrbState("speaking");
    if (ttsSupported) {
      speak(`${verb} ${d.name}.`, { onEnd: () => setOrbState("idle") });
    } else {
      setTimeout(() => setOrbState("idle"), 1500);
    }
  };

  const turnAll = (action: "on" | "off") => {
    setOrbState("speaking");
    const verb = action === "on" ? "Ligando" : "Desligando";
    if (ttsSupported) {
      speak(`${verb} todos os aparelhos.`, { onEnd: () => setOrbState("idle") });
    } else {
      setTimeout(() => setOrbState("idle"), 1500);
    }
    devices.forEach((d, i) => {
      if (d.status === "online" && d.state !== action) {
        setTimeout(() => toggle(d.id), i * 200);
      }
    });
  };

  return (
    <div className="mx-auto max-w-5xl pb-16">
      <SectionHeader
        title="Aparelhos"
        subtitle={`${onlineCount} online · ${onCount} ligados · ${devices.length} total`}
        action={
          <div className="flex gap-2">
            <button onClick={() => turnAll("on")} className="rounded-lg border border-primary bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/20">
              Ligar todas
            </button>
            <button onClick={() => turnAll("off")} className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-1.5 text-xs font-semibold text-destructive transition hover:bg-destructive/15">
              Desligar todas
            </button>
          </div>
        }
      />

      {/* Filter */}
      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
        {[
          { id: "all", label: "Todos" },
          { id: "online", label: "Online" },
          { id: "ewelink", label: "eWeLink" },
          { id: "homeassistant", label: "Home Assistant" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as typeof filter)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition",
              filter === f.id
                ? "border-primary bg-primary/15 text-primary"
                : "border-border bg-glass text-muted-foreground hover:border-border-strong hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((d) => {
          const Icon = deviceIcon(d.type);
          const isOn = d.state === "on";
          const isOnline = d.status === "online";
          return (
            <GlassCard
              key={d.id}
              className={cn(
                "p-4 transition",
                !isOnline && "opacity-60",
                isOn && isOnline && "border-primary/50 neon-glow"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-lg border transition",
                  isOn && isOnline
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border-strong/40 bg-glass text-muted-foreground"
                )}>
                  <Icon className="size-5" />
                </div>
                <StatusBadge tone={isOnline ? "success" : "danger"}>
                  {isOnline ? "ONLINE" : "OFFLINE"}
                </StatusBadge>
              </div>

              <div className="mt-3">
                <div className="text-sm font-bold text-foreground">{d.name}</div>
                <div className="text-xs text-muted-foreground">
                  {deviceTypeLabel(d.type)}
                  {d.room ? ` · ${d.room}` : ""}
                </div>
                <div className="mt-1 text-[10px] uppercase tracking-wider text-subtle">
                  {d.source === "ewelink" ? "via eWeLink" : "via Home Assistant"}
                </div>
              </div>

              <button
                onClick={() => sayAndToggle(d)}
                disabled={!isOnline}
                aria-label={isOn ? "Desligar" : "Ligar"}
                className={cn(
                  "mt-3 flex w-full items-center justify-between rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-wide transition disabled:opacity-30",
                  isOn
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border bg-glass text-muted-foreground hover:border-border-strong"
                )}
              >
                <span>{isOn ? "LIGADO" : "DESLIGADO"}</span>
                <div className={cn(
                  "relative h-5 w-9 rounded-full border transition",
                  isOn ? "border-primary bg-primary/30" : "border-border bg-glass"
                )}>
                  <span className={cn(
                    "absolute top-0.5 size-4 rounded-full transition-all",
                    isOn ? "left-[18px] bg-primary" : "left-0.5 bg-muted-foreground"
                  )} />
                </div>
              </button>
            </GlassCard>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <GlassCard className="py-10 text-center text-muted-foreground">
          <AlertCircle className="mx-auto mb-2 size-6 text-subtle" />
          Nenhum aparelho encontrado com este filtro.
        </GlassCard>
      )}

      <div className="mt-4">
        <GlassCard className="flex items-center gap-3 p-3 text-xs text-muted-foreground">
          <RefreshCw className="size-4 text-primary" />
          Para adicionar mais aparelhos, conecte o eWeLink ou Home Assistant em <strong className="text-foreground">Fontes</strong>.
        </GlassCard>
      </div>
    </div>
  );
}
