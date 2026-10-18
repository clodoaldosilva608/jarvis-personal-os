import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CloudSun, CalendarDays, Newspaper, Droplets, Wind, Umbrella, Loader2, Sparkles, Volume2 } from "lucide-react";
import { GlassCard, NeonButton, SectionHeader, StatusBadge } from "@/components/jarvis";
import { useBriefingConfig } from "@/stores/briefing-config";
import { generateBriefing, type BriefingResult } from "@/lib/briefing.functions";
import { useJarvis } from "@/stores/jarvis";

export const Route = createFileRoute("/_dashboard/briefing")({
  head: () => ({
    meta: [
      { title: "Briefing Matinal — J.A.R.V.I.S." },
      { name: "description", content: "Clima, agenda e notícias do seu dia em um só lugar." },
      { property: "og:title", content: "Briefing Matinal — J.A.R.V.I.S." },
      { property: "og:description", content: "Clima, agenda e notícias do seu dia." },
    ],
  }),
  component: BriefingPage,
});

function buildSpeech(b: BriefingResult, modules: string[]) {
  const parts: string[] = ["Bom dia. Aqui está seu briefing."];
  if (modules.includes("weather") && b.weather) parts.push(`Em ${b.weather.location}, ${b.weather.temp} graus, ${b.weather.condition.toLowerCase()}, mínima de ${b.weather.min} e máxima de ${b.weather.max}, com ${b.weather.rainChance}% de chance de chuva.`);
  if (modules.includes("agenda")) parts.push(b.events.length ? `Próximo compromisso: ${b.events[0]!.title}, ${fmt(b.events[0]!.start)}.` : "Sua agenda está livre.");
  if (modules.includes("news") && b.news.length) parts.push(`Notícias: ${b.news.map((n) => n.title).join(". ")}.`);
  return parts.join(" ");
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function BriefingPage() {
  const cfg = useBriefingConfig();
  const run = useServerFn(generateBriefing);
  const setOrbState = useJarvis((s) => s.setOrbState);
  const [data, setData] = useState<BriefingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    setLoading(true); setError("");
    try {
      const res = await run({ data: { location: cfg.location, timezone: cfg.timezone, agendaUrls: cfg.agendaSources.map((s) => s.url.replace(/^webcal:/i, "https:")), newsTopics: cfg.newsTopics, maxNews: cfg.maxNews } });
      setData(res);
    } catch (e) {
      setError("Não foi possível gerar o briefing. Verifique as configurações e tente novamente.");
      console.error(e);
    } finally { setLoading(false); }
  };

  const speak = () => {
    if (!data || !("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(buildSpeech(data, cfg.spokenModules));
    u.lang = "pt-BR";
    u.onstart = () => setOrbState("speaking");
    u.onend = () => setOrbState("idle");
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  };

  const w = data?.weather;

  return (
    <div className="mx-auto max-w-5xl pb-16">
      <SectionHeader
        title="Briefing Matinal"
        subtitle={data ? `Gerado ${fmt(data.generatedAt)}` : `${cfg.location} · ${cfg.agendaSources.length} agenda(s) · ${cfg.newsTopics.length} tópico(s)`}
        action={
          <div className="flex gap-2">
            {data && <NeonButton onClick={speak}><Volume2 className="size-4" /> Ouvir</NeonButton>}
            <NeonButton variant="solid" onClick={generate} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} Gerar agora
            </NeonButton>
          </div>
        }
      />

      {error && <GlassCard className="mb-4 border-destructive/40 text-sm text-destructive">{error}</GlassCard>}

      {!data && !loading && (
        <GlassCard className="py-12 text-center">
          <p className="text-muted-foreground">Toque em <span className="text-primary">Gerar agora</span> para buscar clima, agenda e notícias.</p>
          <Link to="/settings" className="mt-3 inline-block text-xs text-primary hover:underline">Ajustar configurações</Link>
        </GlassCard>
      )}

      {data && (
        <div className="grid gap-4 md:grid-cols-2">
          <GlassCard glow>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary"><CloudSun className="size-4" /><span className="hud-label">Clima</span></div>
              {w && <StatusBadge tone="muted">{w.location}</StatusBadge>}
            </div>
            {w ? (
              <>
                <div className="mt-4 flex items-end gap-3">
                  <span className="text-5xl font-semibold text-glow">{w.temp}°</span>
                  <span className="pb-2 text-sm text-muted-foreground">{w.condition}<br />{w.min}° / {w.max}°</span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Droplets className="size-3.5 text-primary" />{w.humidity}%</span>
                  <span className="flex items-center gap-1.5"><Wind className="size-3.5 text-primary" />{w.windSpeed} km/h</span>
                  <span className="flex items-center gap-1.5"><Umbrella className="size-3.5 text-primary" />{w.rainChance}%</span>
                </div>
              </>
            ) : <p className="mt-4 text-sm text-destructive">{data.weatherError ?? "Clima indisponível."}</p>}
          </GlassCard>

          <GlassCard glow>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary"><CalendarDays className="size-4" /><span className="hud-label">Agenda · 7 dias</span></div>
              <StatusBadge tone={data.events.length ? "primary" : "success"}>{data.events.length ? "OCUPADO" : "LIVRE"}</StatusBadge>
            </div>
            {data.agendaError && <p className="mt-4 text-sm text-destructive">{data.agendaError}</p>}
            {!cfg.agendaSources.length && <p className="mt-4 text-sm text-muted-foreground">Nenhuma agenda conectada. <Link to="/settings" className="text-primary hover:underline">Adicionar</Link></p>}
            <ul className="mt-4 space-y-2">
              {data.events.map((e, i) => (
                <li key={i} className="flex items-center justify-between gap-3 rounded-xl border border-glass-border bg-glass px-3 py-2 text-sm">
                  <span className="truncate">{e.title}</span><span className="shrink-0 text-xs text-muted-foreground">{fmt(e.start)}</span>
                </li>
              ))}
              {cfg.agendaSources.length > 0 && !data.events.length && !data.agendaError && <li className="text-sm text-muted-foreground">Sem compromissos nos próximos 7 dias.</li>}
            </ul>
          </GlassCard>

          <GlassCard className="md:col-span-2">
            <div className="flex items-center gap-2 text-primary"><Newspaper className="size-4" /><span className="hud-label">Notícias</span></div>
            <ul className="mt-4 space-y-2">
              {data.news.map((n, i) => (
                <li key={i}>
                  <a href={n.url} target="_blank" rel="noreferrer" className="block rounded-xl border border-glass-border bg-glass px-3 py-2 transition hover:border-border-strong">
                    <div className="text-sm">{n.title}</div>
                    <div className="mt-0.5 text-xs text-subtle">{n.source} · {n.topic}</div>
                  </a>
                </li>
              ))}
              {!data.news.length && <li className="text-sm text-muted-foreground">Nenhuma notícia encontrada.</li>}
            </ul>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
