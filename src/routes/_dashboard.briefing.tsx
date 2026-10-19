import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CalendarDays, Mail, Radar, CloudSun, Sparkles, Loader2, Volume2, Settings, AlertCircle } from "lucide-react";
import { GlassCard, NeonButton, SectionHeader, StatusBadge } from "@/components/jarvis";
import { useBriefingConfig } from "@/stores/briefing-config";
import { generateBriefing, type BriefingResult } from "@/lib/briefing.functions";
import { useJarvis } from "@/stores/jarvis";

export const Route = createFileRoute("/_dashboard/briefing")({
  head: () => ({
    meta: [
      { title: "Briefing Matinal — J.A.R.V.I.S." },
      { name: "description", content: "Agenda, e-mails, notícias e clima consolidados." },
    ],
  }),
  component: BriefingPage,
});

function fmtFullDate(d: Date): string {
  return d.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).replace(/^\w/, (c) => c.toUpperCase());
}

function BriefingPage() {
  const cfg = useBriefingConfig();
  const setOrbState = useJarvis((s) => s.setOrbState);
  const run = useServerFn(generateBriefing);
  const navigate = useNavigate();
  const [data, setData] = useState<BriefingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const today = fmtFullDate(new Date());

  // === Top 4 cards summary ===
  // We use data if generated, else fall back to placeholder/empty values.
  const events = data?.events ?? [];
  const agendaStatus = events.length > 0 ? "Ocupado" : "Livre";
  const priorityEmailsCount = data?.weather ? 5 : 5; // mocked until IMAP integration lands
  const radarTopics = cfg.newsTopics.length;
  const w = data?.weather;

  const generate = async () => {
    setLoading(true); setError("");
    try {
      const res = await run({ data: {
        location: cfg.location,
        timezone: cfg.timezone,
        agendaUrls: cfg.agendaSources.map((s) => s.url.replace(/^webcal:/i, "https:")),
        newsTopics: cfg.newsTopics,
        maxNews: cfg.spokenBriefing.newsCount,
      } });
      setData(res);
    } catch (e) {
      setError("Não foi possível gerar o briefing. Verifique sua conexão e tente novamente.");
      console.error(e);
    } finally { setLoading(false); }
  };

  const speak = () => {
    if (!data || !("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(buildSpeech(data, cfg.spokenBriefing.modules));
    u.lang = "pt-BR";
    u.onstart = () => setOrbState("speaking");
    u.onend = () => setOrbState("idle");
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  };

  // Group news by topic for "Radar de notícias" section
  const newsByTopic = data?.news.reduce<Record<string, typeof data.news>>((acc, n) => {
    (acc[n.topic] ??= []).push(n);
    return acc;
  }, {}) ?? {};

  return (
    <div className="mx-auto max-w-6xl pb-16">
      <SectionHeader
        title="Seu briefing do dia"
        subtitle={today}
        action={
          <div className="flex gap-2">
            <StatusBadge tone="primary" live>CENTRAL MATINAL</StatusBadge>
            <button
              onClick={() => navigate({ to: "/briefing/configurar" })}
              aria-label="Configurar briefing"
              className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-glass text-muted-foreground transition hover:text-primary"
            >
              <Settings className="size-4" />
            </button>
          </div>
        }
      />

      {/* === Top 4 cards grid === */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <GlassCard className="p-4">
          <div className="mb-1 flex items-center gap-1.5 text-primary">
            <CalendarDays className="size-3.5" />
            <span className="hud-label">AGENDA</span>
          </div>
          <div className="text-2xl font-bold">{agendaStatus}</div>
          <div className="text-xs text-muted-foreground">{events.length} evento(s) · 7 dias</div>
          <button className="mt-2 text-[10px] uppercase tracking-wider text-primary hover:underline">Trocar as lentes</button>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="mb-1 flex items-center gap-1.5 text-primary">
            <Mail className="size-3.5" />
            <span className="hud-label">PRIORIDADE</span>
          </div>
          <div className="text-2xl font-bold">{priorityEmailsCount}</div>
          <div className="text-xs text-muted-foreground">3 informativos · 12 filtrados</div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="mb-1 flex items-center gap-1.5 text-primary">
            <Radar className="size-3.5" />
            <span className="hud-label">RADAR</span>
          </div>
          <div className="text-2xl font-bold">{radarTopics}</div>
          <div className="text-xs text-muted-foreground">assuntos monitorados</div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="mb-1 flex items-center gap-1.5 text-primary">
            <CloudSun className="size-3.5" />
            <span className="hud-label">CLIMA</span>
          </div>
          {w ? (
            <>
              <div className="text-2xl font-bold">{w.min}° / {w.max}°</div>
              <div className="text-xs text-muted-foreground">{w.rainChance}% chuva · {w.location}</div>
            </>
          ) : (
            <>
              <div className="text-2xl font-bold">—</div>
              <div className="text-xs text-muted-foreground">{cfg.location}</div>
            </>
          )}
        </GlassCard>
      </div>

      {/* === Central section — "Briefing matinal" with Gerar agora === */}
      <GlassCard className="mb-6 p-6" glow>
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-bold">Briefing matinal</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Consolide agenda, e-mails de ação, notícias e clima em um texto pronto para leitura pelo modo voz.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {cfg.spokenBriefing.modules.map((m) => (
                <span key={m} className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-accent-foreground">
                  {m === "climate" ? "Clima" : m === "emails" ? "E-mails" : m === "news" ? "Notícias" : m === "agenda" ? "Agenda" : "Insights"}
                </span>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            {data && (
              <NeonButton onClick={speak} className="min-h-[44px]">
                <Volume2 className="size-4" /> Ouvir
              </NeonButton>
            )}
            <NeonButton variant="solid" onClick={generate} disabled={loading} className="min-h-[44px]">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {loading ? "Gerando…" : "Gerar agora"}
            </NeonButton>
          </div>
        </div>
      </GlassCard>

      {error && (
        <GlassCard className="mb-4 border-destructive/40 text-sm text-destructive">
          <AlertCircle className="mr-2 inline size-4" />
          {error}
        </GlassCard>
      )}

      {/* === Spoken digest text === */}
      {data && (
        <GlassCard className="mb-6 p-5">
          <h3 className="hud-label mb-2 text-primary">TEXTO DO BRIEFING</h3>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {buildSpeech(data, cfg.spokenBriefing.modules)}
          </p>
        </GlassCard>
      )}

      {/* === Lower sections: Agenda / Email triage / News radar === */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Agenda consolidada */}
        <GlassCard className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary">
              <CalendarDays className="size-4" />
              <span className="hud-label">AGENDA · 7 DIAS</span>
            </div>
            <StatusBadge tone={events.length ? "primary" : "success"}>
              {events.length ? "OCUPADO" : "LIVRE"}
            </StatusBadge>
          </div>
          {data?.agendaError && <p className="text-xs text-destructive">{data.agendaError}</p>}
          {!cfg.agendaSources.length && (
            <p className="text-sm text-muted-foreground">
              Nenhuma agenda conectada.{" "}
              <Link to="/briefing/configurar" className="text-primary hover:underline">Adicionar</Link>
            </p>
          )}
          <ul className="space-y-2">
            {events.slice(0, 5).map((e, i) => (
              <li key={i} className="flex items-center justify-between gap-3 rounded-lg border border-glass-border bg-glass px-3 py-2 text-sm">
                <span className="truncate">{e.title}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {new Date(e.start).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </span>
              </li>
            ))}
            {cfg.agendaSources.length > 0 && !events.length && !data?.agendaError && (
              <li className="text-sm text-muted-foreground">Sem compromissos nos próximos 7 dias.</li>
            )}
          </ul>
        </GlassCard>

        {/* Triagem da caixa de entrada */}
        <GlassCard className="p-5">
          <div className="mb-3 flex items-center gap-2 text-primary">
            <Mail className="size-4" />
            <span className="hud-label">TRIAGEM DE E-MAILS</span>
          </div>
          {!cfg.emailAccounts.length ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma conta conectada.{" "}
              <Link to="/briefing/configurar" className="text-primary hover:underline">Adicionar</Link>
            </p>
          ) : (
            <div className="space-y-2">
              {cfg.emailAccounts.map((acc) => (
                <div key={acc.id} className="rounded-lg border border-glass-border bg-glass px-3 py-2 text-sm">
                  <div className="font-semibold text-foreground">{acc.alias}</div>
                  <div className="text-xs text-subtle">{acc.email}</div>
                </div>
              ))}
              <p className="pt-1 text-[10px] uppercase tracking-wider text-subtle">
                Integração IMAP em desenvolvimento
              </p>
            </div>
          )}
        </GlassCard>

        {/* Radar de notícias */}
        <GlassCard className="p-5">
          <div className="mb-3 flex items-center gap-2 text-primary">
            <Radar className="size-4" />
            <span className="hud-label">RADAR DE NOTÍCIAS</span>
          </div>
          {Object.keys(newsByTopic).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Gere o briefing para ver as notícias agrupadas por categoria.
            </p>
          ) : (
            <div className="space-y-3">
              {Object.entries(newsByTopic).map(([topic, items]) => (
                <div key={topic}>
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">{topic}</div>
                  <ul className="space-y-1">
                    {items.map((n, i) => (
                      <li key={i}>
                        <a href={n.url} target="_blank" rel="noreferrer" className="block rounded-lg border border-glass-border bg-glass px-2.5 py-1.5 text-xs transition hover:border-border-strong">
                          <div className="text-foreground">{n.title}</div>
                          <div className="text-[10px] text-subtle">{n.source}</div>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

function buildSpeech(b: BriefingResult, modules: string[]): string {
  const parts: string[] = ["Bom dia, senhor. Aqui está o seu briefing matinal."];
  if (modules.includes("agenda")) {
    parts.push(b.events.length
      ? `Sua agenda hoje tem ${b.events.length} compromisso(s). O primeiro é: ${b.events[0]!.title}.`
      : "A agenda de hoje está livre, senhor. Nenhum compromisso registrado.");
  }
  if (modules.includes("emails")) {
    parts.push("Há 20 e-mails na caixa, dos quais cinco merecem atenção. O principal solicita a atualização dos dados comerciais.");
  }
  if (modules.includes("news") && b.news.length) {
    parts.push("Nas notícias: " + b.news.map((n) => `${n.title} (${n.source})`).join(". ") + ".");
  }
  if (modules.includes("climate") && b.weather) {
    parts.push(`Em ${b.weather.location}, a temperatura atual é de ${b.weather.temp} graus, ${b.weather.condition.toLowerCase()}, mínima de ${b.weather.min} e máxima de ${b.weather.max}, com ${b.weather.rainChance}% de chance de chuva.`);
  }
  parts.push("Mantenha o foco no essencial.");
  return parts.join(" ");
}
