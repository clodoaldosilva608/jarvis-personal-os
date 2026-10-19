import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { RefreshCw, ExternalLink, CheckCircle2, AlertCircle, XCircle, Terminal, Mic } from "lucide-react";
import { GlassCard, SectionHeader, StatusBadge } from "@/components/jarvis";
import { useIntegrations } from "@/stores/integrations";
import { useJarvis } from "@/stores/jarvis";
import { useSpeech } from "@/hooks/use-speech";
import { cn } from "@/lib/utils";
import type { Integration, IntegrationStatus } from "@/types/smarthome";

export const Route = createFileRoute("/_dashboard/sources")({
  head: () => ({
    meta: [
      { title: "Fontes — J.A.R.V.I.S." },
      { name: "description", content: "Integrações com eWeLink, Home Assistant e mais." },
    ],
  }),
  component: SourcesPage,
});

function statusTone(s: IntegrationStatus) {
  if (s === "connected") return "success" as const;
  if (s === "needs_attention") return "warning" as const;
  return "danger" as const;
}
function statusLabel(s: IntegrationStatus) {
  if (s === "connected") return "CONECTADO";
  if (s === "needs_attention") return "ATENÇÃO";
  return "DESCONECTADO";
}
function statusIcon(s: IntegrationStatus) {
  if (s === "connected") return CheckCircle2;
  if (s === "needs_attention") return AlertCircle;
  return XCircle;
}

function IntegrationCard({ i }: { i: Integration }) {
  const connect = useIntegrations((s) => s.connect);
  const disconnect = useIntegrations((s) => s.disconnect);
  const setOrbState = useJarvis((s) => s.setOrbState);
  const { speak } = useSpeech();
  const [verifying, setVerifying] = useState(false);
  const Icon = statusIcon(i.status);

  const verify = async () => {
    setVerifying(true);
    setOrbState("thinking");
    // Mock verification: in production this would ping the MCP server
    await new Promise((r) => setTimeout(r, 1500));
    if (i.id === "ewelink" || i.id === "homeassistant") {
      connect(i.id);
    }
    setVerifying(false);
    setOrbState("success");
    setTimeout(() => setOrbState("idle"), 1500);
    if (speak) speak(`${i.name} verificado.`, { onEnd: () => {} });
  };

  return (
    <GlassCard className={cn("flex flex-col p-4 transition", i.status === "connected" && "border-success/30")}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg border border-border-strong/40 bg-glass text-xl">
            {i.iconGlyph}
          </div>
          <div>
            <div className="text-sm font-bold text-foreground">{i.name}</div>
            {i.description && (
              <div className="text-xs text-muted-foreground">{i.description}</div>
            )}
          </div>
        </div>
        <StatusBadge tone={statusTone(i.status)} live={i.status === "needs_attention"}>
          <Icon className="size-3" /> {statusLabel(i.status)}
        </StatusBadge>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="rounded-full border border-border-strong/40 bg-glass px-2 py-0.5 font-mono">
          {i.toolsCount} {i.toolsCount === 1 ? "ferramenta" : "ferramentas"}
        </span>
      </div>

      {/* eWeLink / Home Assistant specifics: show MCP server URL */}
      {i.mcpUrl && (
        <div className="mt-3 rounded-lg border border-border-strong/40 bg-glass p-2.5">
          <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
            <Terminal className="size-3" /> MCP Server URL
          </div>
          <code className="block truncate text-xs text-foreground">{i.mcpUrl}</code>
        </div>
      )}

      {/* Action buttons */}
      <div className="mt-auto flex gap-2 pt-3">
        {i.status !== "connected" && (
          <button
            onClick={verify}
            disabled={verifying}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/20 disabled:opacity-50"
          >
            <RefreshCw className={cn("size-3", verifying && "animate-spin")} />
            {verifying ? "Verificando…" : "Verificar conexão"}
          </button>
        )}
        {i.status === "connected" && (
          <button
            onClick={() => disconnect(i.id)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-glass px-3 py-1.5 text-xs text-muted-foreground transition hover:border-destructive/30 hover:text-destructive"
          >
            Desconectar
          </button>
        )}
        {i.docsUrl && (
          <a
            href={i.docsUrl}
            target="_blank"
            rel="noreferrer"
            className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-subtle transition hover:text-primary"
          >
            <ExternalLink className="size-3" /> Docs
          </a>
        )}
      </div>
    </GlassCard>
  );
}

function SourcesPage() {
  const integrations = useIntegrations((s) => s.integrations);
  const connected = integrations.filter((i) => i.status === "connected");
  const needsAttention = integrations.filter((i) => i.status === "needs_attention");
  const disconnected = integrations.filter((i) => i.status === "disconnected");

  return (
    <div className="mx-auto max-w-5xl pb-16">
      <SectionHeader
        title="Fontes de Dados"
        subtitle={`${connected.length} conectadas · ${needsAttention.length} precisam atenção · ${disconnected.length} desconectadas`}
      />

      {/* eWeLink callout */}
      <GlassCard className="mb-4">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-xl">
            ⚡
          </div>
          <div className="flex-1">
            <h2 className="hud-label text-primary">Como usar no HUD</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Com eWeLink conectado, você pode falar comandos naturais no HUD ou no chat:
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {["Acende a luz da sala", "Apaga todas as luzes", "Liga o escritório", "Modo boa noite"].map((cmd) => (
                <span key={cmd} className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs text-primary">
                  <Mic className="size-3" /> "{cmd}"
                </span>
              ))}
            </div>
            <Link to="/routines" className="mt-3 inline-block text-xs text-primary hover:underline">
              Ver rotinas prontas →
            </Link>
          </div>
        </div>
      </GlassCard>

      {/* All integrations grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {integrations.map((i) => (
          <IntegrationCard key={i.id} i={i} />
        ))}
      </div>
    </div>
  );
}
