import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Trash2, Check } from "lucide-react";
import { GlassCard, NeonButton, SectionHeader } from "@/components/jarvis";
import { useBriefingConfig, type SpokenModule, type BriefingSettings } from "@/stores/briefing-config";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_dashboard/settings")({
  head: () => ({
    meta: [
      { title: "Configurações do Briefing — J.A.R.V.I.S." },
      { name: "description", content: "Defina localização, agendas, tópicos de notícias e módulos falados do briefing." },
      { property: "og:title", content: "Configurações do Briefing — J.A.R.V.I.S." },
      { property: "og:description", content: "Personalize seu briefing matinal." },
    ],
  }),
  component: SettingsPage,
});

const MODULES: { id: SpokenModule; label: string }[] = [
  { id: "weather", label: "Clima" },
  { id: "agenda", label: "Agenda" },
  { id: "news", label: "Notícias" },
  { id: "emails", label: "E-mails" },
  { id: "insights", label: "Insights" },
];

const input = "w-full rounded-xl border border-border bg-glass px-3 py-2 text-sm text-foreground placeholder:text-subtle outline-none transition focus:border-primary focus:neon-glow";

function SettingsPage() {
  const store = useBriefingConfig();
  const [draft, setDraft] = useState<BriefingSettings>(store);
  const [hydrated, setHydrated] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newTopic, setNewTopic] = useState("");
  const [src, setSrc] = useState({ name: "", url: "" });
  const [srcError, setSrcError] = useState("");

  useEffect(() => {
    const done = () => { const s = useBriefingConfig.getState(); setDraft({ location: s.location, timezone: s.timezone, agendaSources: s.agendaSources, newsTopics: s.newsTopics, spokenModules: s.spokenModules, maxNews: s.maxNews }); setHydrated(true); };
    if (useBriefingConfig.persist.hasHydrated()) done();
    return useBriefingConfig.persist.onFinishHydration(done);
  }, []);

  const set = (p: Partial<BriefingSettings>) => { setDraft((d) => ({ ...d, ...p })); setSaved(false); };

  const addTopic = () => {
    const t = newTopic.trim();
    if (!t || draft.newsTopics.includes(t) || draft.newsTopics.length >= 10) return;
    set({ newsTopics: [...draft.newsTopics, t] });
    setNewTopic("");
  };
  const addSource = () => {
    const url = src.url.trim();
    if (!/^(https?|webcal):\/\/.+/i.test(url)) { setSrcError("Informe um link iCal válido (https:// ou webcal://)"); return; }
    setSrcError("");
    set({ agendaSources: [...draft.agendaSources, { id: String(Date.now()), name: src.name.trim() || "Agenda", url }] });
    setSrc({ name: "", url: "" });
  };
  const toggleModule = (m: SpokenModule) =>
    set({ spokenModules: draft.spokenModules.includes(m) ? draft.spokenModules.filter((x) => x !== m) : [...draft.spokenModules, m] });

  const save = () => { store.update(draft); setSaved(true); };

  return (
    <div className="mx-auto max-w-3xl pb-16">
      <SectionHeader
        title="Configurações do Briefing"
        subtitle="O que o J.A.R.V.I.S. deve incluir no seu resumo."
        action={<NeonButton variant="solid" onClick={save} disabled={!hydrated || !draft.location.trim()}>{saved ? <><Check className="size-4" /> Salvo</> : "Salvar"}</NeonButton>}
      />

      <div className="space-y-4">
        <GlassCard>
          <h2 className="hud-label mb-3 text-primary">Localização</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5"><span className="text-xs text-muted-foreground">Cidade</span>
              <input className={input} value={draft.location} onChange={(e) => set({ location: e.target.value })} placeholder="Ex.: Maragogi" maxLength={100} />
            </label>
            <label className="space-y-1.5"><span className="text-xs text-muted-foreground">Fuso horário</span>
              <input className={input} value={draft.timezone} onChange={(e) => set({ timezone: e.target.value })} placeholder="America/Sao_Paulo" maxLength={60} />
            </label>
          </div>
        </GlassCard>

        <GlassCard>
          <h2 className="hud-label mb-1 text-primary">Fontes de agenda</h2>
          <p className="mb-3 text-xs text-muted-foreground">Cole o link iCal da sua agenda (Google Agenda → Configurações → "Endereço secreto em formato iCal").</p>
          <ul className="mb-3 space-y-2">
            {draft.agendaSources.map((s) => (
              <li key={s.id} className="flex items-center gap-3 rounded-xl border border-glass-border bg-glass px-3 py-2">
                <div className="min-w-0 flex-1"><div className="text-sm">{s.name}</div><div className="truncate text-xs text-subtle">{s.url}</div></div>
                <button aria-label="Remover agenda" onClick={() => set({ agendaSources: draft.agendaSources.filter((x) => x.id !== s.id) })} className="text-subtle hover:text-destructive"><Trash2 className="size-4" /></button>
              </li>
            ))}
            {!draft.agendaSources.length && <li className="text-xs text-subtle">Nenhuma agenda adicionada.</li>}
          </ul>
          <div className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
            <input className={input} placeholder="Nome" value={src.name} onChange={(e) => setSrc({ ...src, name: e.target.value })} maxLength={40} />
            <input className={input} placeholder="https://…/basic.ics" value={src.url} onChange={(e) => setSrc({ ...src, url: e.target.value })} maxLength={500} />
            <NeonButton onClick={addSource}><Plus className="size-4" /> Adicionar</NeonButton>
          </div>
          {srcError && <p className="mt-2 text-xs text-destructive">{srcError}</p>}
        </GlassCard>

        <GlassCard>
          <h2 className="hud-label mb-3 text-primary">Tópicos de notícias</h2>
          <div className="mb-3 flex flex-wrap gap-2">
            {draft.newsTopics.map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5 rounded-full border border-border-strong bg-primary/10 px-3 py-1 text-xs text-primary">
                {t}
                <button aria-label={`Remover ${t}`} onClick={() => set({ newsTopics: draft.newsTopics.filter((x) => x !== t) })} className="opacity-70 hover:opacity-100">×</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input className={input} placeholder="Novo tópico" value={newTopic} onChange={(e) => setNewTopic(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTopic()} maxLength={60} />
            <NeonButton onClick={addTopic}><Plus className="size-4" /></NeonButton>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            Máx. de notícias:
            {([1, 2, 3, 5] as const).map((n) => (
              <NeonButton key={n} variant="ghost" active={draft.maxNews === n} className="px-3 py-1 text-xs" onClick={() => set({ maxNews: n })}>{n}</NeonButton>
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <h2 className="hud-label mb-1 text-primary">Módulos falados</h2>
          <p className="mb-3 text-xs text-muted-foreground">O que o J.A.R.V.I.S. lê em voz alta no briefing.</p>
          <div className="flex flex-wrap gap-2">
            {MODULES.map((m) => {
              const on = draft.spokenModules.includes(m.id);
              return (
                <button key={m.id} onClick={() => toggleModule(m.id)} aria-pressed={on}
                  className={cn("rounded-xl border px-4 py-2 text-sm transition", on ? "border-primary bg-primary/15 text-primary neon-glow" : "border-glass-border bg-glass text-muted-foreground hover:text-foreground")}>
                  {m.label}
                </button>
              );
            })}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
