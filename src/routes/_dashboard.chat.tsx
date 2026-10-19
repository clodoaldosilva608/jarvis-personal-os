import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Send, Loader2, Trash2, KeyRound, AlertCircle } from "lucide-react";
import { GlassCard, SectionHeader, StatusBadge } from "@/components/jarvis";
import { useAIConfig } from "@/stores/ai-config";
import { useGemini } from "@/hooks/use-gemini";
import { useMorningBriefing } from "@/hooks/use-morning-briefing";
import { useJarvis } from "@/stores/jarvis";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_dashboard/chat")({
  head: () => ({
    meta: [
      { title: "Chat — J.A.R.V.I.S." },
      { name: "description", content: "Converse com o J.A.R.V.I.S. via Gemini." },
    ],
  }),
  component: ChatPage,
});

interface Msg { role: "user" | "model"; text: string; pending?: boolean }

const SUGGESTIONS = [
  "Bom dia. Pode me dar o briefing de hoje?",
  "Resuma as últimas notícias de tecnologia",
  "Qual a previsão do tempo para amanhã?",
  "Ajude-me a planejar minha semana",
];

const input = "w-full resize-none rounded-xl border border-border bg-glass px-3 py-2.5 text-sm text-foreground placeholder:text-subtle outline-none transition focus:border-primary focus:neon-glow";

function ChatPage() {
  const apiKey = useAIConfig((s) => s.apiKey);
  const configured = useAIConfig((s) => s.configured);
  const { generateStream, isConfigured } = useGemini();
  const setOrbState = useJarvis((s) => s.setOrbState);
  const briefing = useMorningBriefing();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Msg[]>([
    { role: "model", text: "Sistema online. Como posso ajudar?" },
  ]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  }, [inputText]);

  const send = async (text: string) => {
    if (!text.trim() || sending) return;
    if (!isConfigured) {
      setError("Configure sua chave API do Google AI Studio para conversar.");
      return;
    }
    setError(null);
    setInputText("");
    setSending(true);
    setOrbState("thinking");

    // === Special: "bom dia" → trigger cinematic briefing on the home HUD ===
    if (briefing.matchesGoodMorning(text)) {
      setMessages((prev) => [...prev, { role: "user", text }]);
      setMessages((prev) => [...prev, { role: "model", text: "Iniciando o briefing matinal. Retornando ao HUD…" }]);
      setSending(false);
      setOrbState("idle");
      // Brief delay so user can read the response, then redirect home and start
      setTimeout(() => {
        navigate({ to: "/" });
        setTimeout(() => briefing.start(), 800);
      }, 1200);
      return;
    }

    const history = messages
      .filter((m) => !m.pending)
      .map((m) => ({ role: m.role, text: m.text }))
      .slice(-12); // keep last 12 turns for context

    setMessages((prev) => [...prev, { role: "user", text }, { role: "model", text: "", pending: true }]);

    try {
      let acc = "";
      const stream = generateStream(text, { history });
      setOrbState("speaking");
      for await (const chunk of stream) {
        acc += chunk;
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last && last.role === "model") next[next.length - 1] = { ...last, text: acc, pending: true };
          return next;
        });
      }
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last && last.role === "model") next[next.length - 1] = { ...last, pending: false };
        return next;
      });
    } catch (e) {
      const err = e as { message?: string };
      const msg = err.message ?? "Erro desconhecido";
      setError(msg);
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last && last.role === "model") next[next.length - 1] = { role: "model", text: `Erro: ${msg}`, pending: false };
        return next;
      });
    } finally {
      setSending(false);
      setOrbState("idle");
    }
  };

  const clear = () => {
    setMessages([{ role: "model", text: "Sistema online. Como posso ajudar?" }]);
    setError(null);
  };

  // === Not configured ===
  if (configured === false || !apiKey) {
    return (
      <div className="mx-auto max-w-3xl">
        <SectionHeader title="Chat" subtitle="Converse com o J.A.R.V.I.S." action={<StatusBadge tone="warning" live>NÃO CONFIGURADO</StatusBadge>} />
        <GlassCard className="py-10 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">
            <KeyRound className="size-7" />
          </div>
          <h2 className="text-lg font-bold">Configure sua chave de IA</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Para conversar com o JARVIS, você precisa de uma chave API gratuita do Google AI Studio (Gemini). A configuração leva menos de 1 minuto.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link
              to="/ai-config"
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/20 hover:neon-glow"
            >
              <KeyRound className="size-4" /> Configurar chave de IA
            </Link>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-glass px-4 py-2 text-sm text-muted-foreground transition hover:text-primary"
            >
              Abrir Google AI Studio →
            </a>
          </div>
        </GlassCard>
      </div>
    );
  }

  // === Configured ===
  return (
    <div className="mx-auto flex h-[calc(100vh-7rem)] max-w-4xl flex-col">
      <SectionHeader
        title="Chat"
        subtitle="Converse com o J.A.R.V.I.S."
        action={
          <button
            onClick={clear}
            aria-label="Limpar conversa"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-glass px-3 py-1.5 text-xs text-muted-foreground transition hover:text-destructive"
          >
            <Trash2 className="size-3.5" /> Limpar
          </button>
        }
      />

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "flex w-full gap-2",
              m.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {m.role === "model" && (
              <div className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-[10px] font-bold text-primary">
                J
              </div>
            )}
            <div
              className={cn(
                "max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                m.role === "user"
                  ? "rounded-tr-sm border border-primary bg-primary/15 text-foreground"
                  : "rounded-tl-sm border border-border-strong/40 bg-card/40 text-foreground"
              )}
            >
              {m.pending && !m.text && (
                <span className="flex items-center gap-2 text-subtle">
                  <Loader2 className="size-3.5 animate-spin" /> pensando…
                </span>
              )}
              {m.text && <span className="whitespace-pre-wrap">{m.text}</span>}
              {m.pending && m.text && <span className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-primary" />}
            </div>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-2.5 text-xs text-destructive">
          <AlertCircle className="size-3.5 shrink-0" />
          <span>{error}</span>
          <Link to="/ai-config" className="ml-auto shrink-0 underline">Configurar</Link>
        </div>
      )}

      {/* Suggestions (only when conversation is fresh) */}
      {messages.length === 1 && !sending && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="rounded-full border border-border bg-glass px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary hover:text-primary"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="mt-3 flex items-end gap-2">
        <textarea
          ref={textareaRef}
          className={input}
          placeholder="Pergunte qualquer coisa…"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(inputText);
            }
          }}
          rows={1}
          maxLength={2000}
          disabled={sending}
        />
        <button
          onClick={() => send(inputText)}
          disabled={!inputText.trim() || sending}
          aria-label="Enviar"
          className="flex size-[44px] shrink-0 items-center justify-center rounded-xl border border-primary bg-primary/15 text-primary transition hover:bg-primary/30 hover:neon-glow disabled:opacity-40 disabled:hover:bg-primary/15"
        >
          {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        </button>
      </div>
    </div>
  );
}
