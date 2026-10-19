import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { KeyRound, ExternalLink, Eye, EyeOff, Check, AlertCircle, Loader2, Sparkles, Trash2 } from "lucide-react";
import { GlassCard, NeonButton, SectionHeader, StatusBadge } from "@/components/jarvis";
import { useAIConfig, AVAILABLE_MODELS, GOOGLE_AI_STUDIO_URL, GOOGLE_AI_STUDIO_HELP_URL, type GeminiModel } from "@/stores/ai-config";
import { useGemini } from "@/hooks/use-gemini";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_dashboard/ai-config")({
  head: () => ({
    meta: [
      { title: "Chave de IA — J.A.R.V.I.S." },
      { name: "description", content: "Configure sua chave do Google AI Studio (Gemini) para o JARVIS funcionar." },
    ],
  }),
  component: AIConfigPage,
});

const input = "w-full rounded-xl border border-border bg-glass px-3 py-2.5 text-sm text-foreground placeholder:text-subtle outline-none transition focus:border-primary focus:neon-glow font-mono";

function AIConfigPage() {
  const store = useAIConfig();
  const { testKey, isConfigured } = useGemini();
  const [hydrated, setHydrated] = useState(false);
  const [draftKey, setDraftKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    const done = () => {
      const s = useAIConfig.getState();
      setDraftKey(s.apiKey);
      setHydrated(true);
    };
    if (useAIConfig.persist.hasHydrated()) done();
    return useAIConfig.persist.onFinishHydration(done);
  }, []);

  const save = () => {
    const trimmed = draftKey.trim();
    store.setApiKey(trimmed);
    store.setConfigured(Boolean(trimmed));
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  };

  const onTest = async () => {
    setTesting(true);
    setTestResult(null);
    const key = draftKey.trim() || store.apiKey;
    const res = await testKey(key);
    setTestResult({ ok: res.ok, msg: res.error ?? "Chave válida — Gemini API acessível." });
    if (res.ok && key) {
      store.setApiKey(key);
      store.setConfigured(true);
    }
    setTesting(false);
  };

  const clear = () => {
    store.clear();
    setDraftKey("");
    setTestResult(null);
  };

  const status = isConfigured
    ? <StatusBadge tone="success" live>CONFIGURADO</StatusBadge>
    : <StatusBadge tone="warning" live>NÃO CONFIGURADO</StatusBadge>;

  return (
    <div className="mx-auto max-w-3xl">
      <SectionHeader
        title="Chave de IA"
        subtitle="Google AI Studio (Gemini) — necessário para chat, resumo de briefing e respostas por voz"
        action={status}
      />

      {/* === Quickstart card === */}
      <GlassCard className="mb-4">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
            <KeyRound className="size-5" />
          </div>
          <div className="flex-1">
            <h2 className="hud-label text-primary">Passo a passo</h2>
            <ol className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              <li>
                <span className="text-foreground">1.</span>{" "}
                Acesse o Google AI Studio:{" "}
                <a
                  href={GOOGLE_AI_STUDIO_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                >
                  aistudio.google.com/app/apikey <ExternalLink className="size-3" />
                </a>
              </li>
              <li>
                <span className="text-foreground">2.</span>{" "}
                Clique em <span className="font-medium text-foreground">"Create API key"</span> (pode pedir para fazer login com sua conta Google).
              </li>
              <li>
                <span className="text-foreground">3.</span>{" "}
                Copie a chave (começa com <span className="font-mono text-foreground">AIza…</span>) e cole no campo abaixo.
              </li>
              <li>
                <span className="text-foreground">4.</span>{" "}
                Salve e teste a conexão. Pronto — o JARVIS já pode conversar com você.
              </li>
            </ol>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={GOOGLE_AI_STUDIO_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-primary bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/20 hover:neon-glow"
              >
                <ExternalLink className="size-3.5" /> Abrir Google AI Studio
              </a>
              <a
                href={GOOGLE_AI_STUDIO_HELP_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-glass px-3 py-1.5 text-xs text-muted-foreground transition hover:text-primary"
              >
                Como funciona a chave API?
              </a>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* === API key input === */}
      <GlassCard className="mb-4">
        <h2 className="hud-label mb-2 text-primary">Sua chave API</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          A chave fica armazenada apenas neste navegador (localStorage). Nenhum dado é enviado para o servidor — todas as chamadas para a Gemini são feitas do seu navegador.
        </p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type={showKey ? "text" : "password"}
              className={cn(input, "pr-12")}
              placeholder="AIza…"
              value={draftKey}
              onChange={(e) => { setDraftKey(e.target.value); setTestResult(null); }}
              spellCheck={false}
              autoComplete="off"
              maxLength={120}
            />
            <button
              type="button"
              aria-label={showKey ? "Esconder chave" : "Mostrar chave"}
              onClick={() => setShowKey((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-subtle transition hover:text-primary"
            >
              {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <NeonButton variant="solid" onClick={save} disabled={!hydrated || !draftKey.trim()} className="min-h-[44px]">
            {savedFlash ? <><Check className="size-4" /> Salvo</> : "Salvar"}
          </NeonButton>
        </div>

        {/* Test result */}
        {testResult && (
          <div className={cn("mt-3 flex items-start gap-2 rounded-lg border p-3 text-sm",
            testResult.ok
              ? "border-success/40 bg-success/10 text-success"
              : "border-destructive/40 bg-destructive/10 text-destructive"
          )}>
            {testResult.ok ? <Check className="size-4 shrink-0" /> : <AlertCircle className="size-4 shrink-0" />}
            <span>{testResult.msg}</span>
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <NeonButton onClick={onTest} disabled={testing || !hydrated || (!draftKey.trim() && !store.apiKey)} className="min-h-[44px]">
            {testing ? <><Loader2 className="size-4 animate-spin" /> Testando…</> : <><Sparkles className="size-4" /> Testar conexão</>}
          </NeonButton>
          {store.apiKey && (
            <NeonButton variant="ghost" onClick={clear} className="min-h-[44px]">
              <Trash2 className="size-4" /> Limpar chave
            </NeonButton>
          )}
        </div>
      </GlassCard>

      {/* === Model selection === */}
      <GlassCard className="mb-4">
        <h2 className="hud-label mb-2 text-primary">Modelo padrão</h2>
        <p className="mb-3 text-xs text-muted-foreground">Escolha qual modelo Gemini usar nas conversas. Você pode mudar a qualquer momento.</p>
        <div className="space-y-2">
          {AVAILABLE_MODELS.map((m) => (
            <button
              key={m.id}
              onClick={() => store.setModel(m.id as GeminiModel)}
              className={cn(
                "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition",
                store.model === m.id
                  ? "border-primary bg-primary/10 neon-glow"
                  : "border-border bg-glass hover:border-border-strong"
              )}
            >
              <div className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border",
                store.model === m.id ? "border-primary bg-primary text-primary-foreground" : "border-border")}>
                {store.model === m.id && <Check className="size-3" />}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-foreground">{m.label}</div>
                <div className="font-mono text-[11px] text-subtle">{m.id}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{m.description}</div>
              </div>
            </button>
          ))}
        </div>
      </GlassCard>

      {/* === System prompt === */}
      <GlassCard className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="hud-label text-primary">Personalidade do JARVIS</h2>
          <button
            onClick={() => navigator.clipboard?.readText().then((t) => store.setSystemPrompt(t.slice(0, 4000)))}
            className="text-[10px] uppercase tracking-wide text-subtle transition hover:text-primary"
          >
            Colar do clipboard
          </button>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">Instruções de sistema (system prompt) que guiam o comportamento do JARVIS em todas as conversas.</p>
        <textarea
          className={cn(input, "min-h-[140px] resize-y font-sans")}
          value={store.systemPrompt}
          onChange={(e) => store.setSystemPrompt(e.target.value)}
          maxLength={4000}
        />
        <div className="mt-1 text-right text-[10px] text-subtle">{store.systemPrompt.length}/4000</div>
      </GlassCard>

      {/* === Status / next steps === */}
      <GlassCard>
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="hud-label text-primary">Status da IA</div>
            <p className="mt-1 text-sm text-muted-foreground">
              {isConfigured
                ? "JARVIS pronto para conversar. Acesse o Chat ou toque no microfone da home."
                : "Configure a chave para liberar o Chat e respostas por voz."}
            </p>
          </div>
          <Link
            to="/chat"
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/20 hover:neon-glow"
          >
            Ir para o Chat →
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
