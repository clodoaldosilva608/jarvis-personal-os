import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Calendar, Mail, Radar, Mic, Plus, Trash2, Eye, EyeOff, MapPin, Clock, RefreshCw, Check, ShieldCheck } from "lucide-react";
import { GlassCard, NeonButton, SectionHeader } from "@/components/jarvis";
import { useBriefingConfig, type EmailAccount, type AgendaSource, type SpokenModule, type NewsCount, type PrintRetentionDays } from "@/stores/briefing-config";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_dashboard/briefing/configurar")({
  head: () => ({
    meta: [
      { title: "Configurar Briefing — J.A.R.V.I.S." },
      { name: "description", content: "Agendas, e-mails, radar de notícias e briefing falado." },
    ],
  }),
  component: BriefingConfigPage,
});

const input = "w-full rounded-lg border border-border bg-glass px-3 py-2.5 text-sm text-foreground placeholder:text-subtle outline-none transition focus:border-primary focus:neon-glow";

const COMMON_IMAP_HOSTS: Record<string, { host: string; port: number }> = {
  "gmail.com": { host: "imap.gmail.com", port: 993 },
  "outlook.com": { host: "outlook.office365.com", port: 993 },
  "hotmail.com": { host: "outlook.office365.com", port: 993 },
  "live.com": { host: "outlook.office365.com", port: 993 },
  "yahoo.com": { host: "imap.mail.yahoo.com", port: 993 },
  "icloud.com": { host: "imap.mail.me.com", port: 993 },
};

function detectImap(email: string): { host: string; port: number } | null {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return null;
  return COMMON_IMAP_HOSTS[domain] ?? null;
}

function BriefingConfigPage() {
  const store = useBriefingConfig();
  const navigate = useNavigate();
  const [hydrated, setHydrated] = useState(false);
  const [saved, setSaved] = useState(false);

  // Local draft state — user edits in place, only commits to store on save.
  const [agendaSources, setAgendaSources] = useState<AgendaSource[]>([]);
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);
  const [newsTopicsStr, setNewsTopicsStr] = useState("");
  const [newsSourcesStr, setNewsSourcesStr] = useState("");
  const [location, setLocation] = useState("");
  const [timezone, setTimezone] = useState("");
  const [autoUpdate, setAutoUpdate] = useState(15);
  const [climateEnabled, setClimateEnabled] = useState(true);
  const [spoken, setSpoken] = useState(store.spokenBriefing);

  // For adding new agenda
  const [newAgenda, setNewAgenda] = useState({ name: "", url: "" });
  const [agendaError, setAgendaError] = useState("");

  // For adding new email account
  const [newEmail, setNewEmail] = useState({ alias: "", email: "", appPassword: "" });
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const done = () => {
      const s = useBriefingConfig.getState();
      setAgendaSources(s.agendaSources);
      setEmailAccounts(s.emailAccounts);
      setNewsTopicsStr(s.newsTopics.join(", "));
      setNewsSourcesStr(s.newsSources.join(", "));
      setLocation(s.location);
      setTimezone(s.timezone);
      setAutoUpdate(s.autoUpdateMinutes);
      setClimateEnabled(s.climateEnabled);
      setSpoken(s.spokenBriefing);
      setHydrated(true);
    };
    if (useBriefingConfig.persist.hasHydrated()) done();
    return useBriefingConfig.persist.onFinishHydration(done);
  }, []);

  // === Section 1: Agendas ===
  const addAgenda = () => {
    const url = newAgenda.url.trim();
    if (!/^(https?|webcal):\/\/.+/i.test(url)) {
      setAgendaError("Informe um link iCal válido (https:// ou webcal://)");
      return;
    }
    setAgendaError("");
    setAgendaSources((prev) => [...prev, {
      id: String(Date.now()),
      name: newAgenda.name.trim() || "Agenda",
      url: url.replace(/^webcal:/i, "https:"),
    }]);
    setNewAgenda({ name: "", url: "" });
  };

  // === Section 2: E-mail accounts ===
  const addEmail = () => {
    const email = newEmail.email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    const imap = detectImap(email);
    setEmailAccounts((prev) => [...prev, {
      id: String(Date.now()),
      alias: newEmail.alias.trim() || email.split("@")[0]!,
      email,
      appPassword: newEmail.appPassword,
      imapHost: imap?.host,
      imapPort: imap?.port,
    }]);
    setNewEmail({ alias: "", email: "", appPassword: "" });
  };

  // === Section 4: Spoken briefing toggle ===
  const toggleModule = (m: SpokenModule) => {
    setSpoken((prev) => ({
      ...prev,
      modules: prev.modules.includes(m)
        ? prev.modules.filter((x) => x !== m)
        : [...prev.modules, m],
    }));
  };

  // === Save ===
  const save = () => {
    store.update({
      agendaSources,
      emailAccounts,
      newsTopics: newsTopicsStr.split(",").map((s) => s.trim()).filter(Boolean),
      newsSources: newsSourcesStr.split(",").map((s) => s.trim()).filter(Boolean),
      location: location.trim() || "Maceió",
      timezone: timezone.trim() || "America/Maceio",
      autoUpdateMinutes: Math.max(1, Math.min(1440, autoUpdate)),
      climateEnabled,
      spokenBriefing: spoken,
      maxNews: spoken.newsCount,
      spokenModules: spoken.modules,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="mx-auto max-w-4xl pb-20">
      <SectionHeader
        title="Configurar Briefing"
        subtitle="Agendas, contas de e-mail, radar de notícias e narração"
        action={
          <div className="flex gap-2">
            <Link to="/briefing" className="inline-flex items-center rounded-lg border border-border bg-glass px-4 py-2 text-sm text-muted-foreground transition hover:text-primary">
              Voltar
            </Link>
            <NeonButton variant="solid" onClick={save} disabled={!hydrated} className="min-h-[44px]">
              {saved ? <><Check className="size-4" /> Salvo</> : "Salvar alterações"}
            </NeonButton>
          </div>
        }
      />

      {/* === Section 1: Agendas === */}
      <GlassCard className="mb-4">
        <div className="mb-3 flex items-center gap-2">
          <Calendar className="size-5 text-primary" />
          <h2 className="hud-label text-primary">AGENDAS</h2>
        </div>
        <p className="mb-3 text-sm text-muted-foreground">
          Cole o link iCal da sua agenda (Google Agenda → Configurações → "Endereço secreto em formato iCal").
        </p>
        <div className="mb-3 rounded-lg border border-border-strong/40 bg-glass p-2.5 text-xs text-muted-foreground">
          <ShieldCheck className="mb-1 size-3.5 text-success" />
          O endereço iCal fica salvo apenas no computador e é usado somente para leitura.
        </div>

        <ul className="mb-4 space-y-2">
          {agendaSources.map((a) => (
            <li key={a.id} className="flex items-center gap-3 rounded-lg border border-glass-border bg-glass px-3 py-2">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-foreground">{a.name}</div>
                <div className="truncate text-xs text-subtle">{a.url}</div>
              </div>
              <button
                onClick={() => setAgendaSources((prev) => prev.filter((x) => x.id !== a.id))}
                aria-label="Remover agenda"
                className="flex size-10 shrink-0 items-center justify-center rounded-lg text-subtle transition hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
          {agendaSources.length === 0 && (
            <li className="text-xs text-subtle">Nenhuma agenda adicionada.</li>
          )}
        </ul>

        <div className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
          <input
            className={input}
            placeholder="Nome (opcional)"
            value={newAgenda.name}
            onChange={(e) => setNewAgenda({ ...newAgenda, name: e.target.value })}
            maxLength={40}
          />
          <input
            className={input}
            placeholder="https://calendar.google.com/…/basic.ics"
            value={newAgenda.url}
            onChange={(e) => setNewAgenda({ ...newAgenda, url: e.target.value })}
            maxLength={500}
          />
          <NeonButton onClick={addAgenda} className="min-h-[44px]">
            <Plus className="size-4" /> Adicionar
          </NeonButton>
        </div>
        {agendaError && <p className="mt-2 text-xs text-destructive">{agendaError}</p>}
      </GlassCard>

      {/* === Section 2: Contas de e-mail === */}
      <GlassCard className="mb-4">
        <div className="mb-3 flex items-center gap-2">
          <Mail className="size-5 text-primary" />
          <h2 className="hud-label text-primary">CONTAS DE E-MAIL</h2>
        </div>
        <p className="mb-3 text-sm text-muted-foreground">
          Leitura via IMAP + senha de aplicativo. Funciona com Gmail, Outlook, Yahoo, iCloud.
        </p>
        <div className="mb-3 rounded-lg border border-warning/30 bg-warning/5 p-2.5 text-xs text-muted-foreground">
          <ShieldCheck className="mb-1 size-3.5 text-warning" />
          Use uma <strong className="text-foreground">senha de app</strong>. O Jarvis somente lê: não envia, responde nem marca mensagens.
        </div>

        <ul className="mb-4 space-y-2">
          {emailAccounts.map((acc) => (
            <li key={acc.id} className="flex items-center gap-3 rounded-lg border border-glass-border bg-glass px-3 py-2">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-foreground">{acc.alias || acc.email}</div>
                <div className="truncate text-xs text-subtle">
                  {acc.email} {acc.imapHost && `· ${acc.imapHost}:${acc.imapPort}`}
                </div>
              </div>
              <button
                onClick={() => setShowPasswords((prev) => ({ ...prev, [acc.id]: !prev[acc.id] }))}
                aria-label="Mostrar senha"
                className="flex size-9 items-center justify-center rounded-lg text-subtle transition hover:text-primary"
              >
                {showPasswords[acc.id] ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
              <button
                onClick={() => setEmailAccounts((prev) => prev.filter((x) => x.id !== acc.id))}
                aria-label="Remover conta"
                className="flex size-9 items-center justify-center rounded-lg text-subtle transition hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
          {emailAccounts.length === 0 && (
            <li className="text-xs text-subtle">Nenhuma conta adicionada.</li>
          )}
        </ul>

        <div className="grid gap-2 sm:grid-cols-[1fr_2fr_2fr_auto]">
          <input
            className={input}
            placeholder="Apelido"
            value={newEmail.alias}
            onChange={(e) => setNewEmail({ ...newEmail, alias: e.target.value })}
            maxLength={40}
          />
          <input
            className={input}
            type="email"
            placeholder="email@gmail.com"
            value={newEmail.email}
            onChange={(e) => setNewEmail({ ...newEmail, email: e.target.value })}
            maxLength={100}
          />
          <input
            className={input}
            type="password"
            placeholder="Senha de app"
            value={newEmail.appPassword}
            onChange={(e) => setNewEmail({ ...newEmail, appPassword: e.target.value })}
            maxLength={40}
          />
          <NeonButton onClick={addEmail} disabled={!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.email)} className="min-h-[44px]">
            <Plus className="size-4" /> Adicionar
          </NeonButton>
        </div>
      </GlassCard>

      {/* === Section 3: Radar e contexto === */}
      <GlassCard className="mb-4">
        <div className="mb-3 flex items-center gap-2">
          <Radar className="size-5 text-primary" />
          <h2 className="hud-label text-primary">RADAR E CONTEXTO</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Assuntos das notícias</label>
            <input
              className={input}
              placeholder="tecnologia, novos modelos de IA, política"
              value={newsTopicsStr}
              onChange={(e) => setNewsTopicsStr(e.target.value)}
              maxLength={400}
            />
            <p className="mt-1 text-[10px] text-subtle">Separados por vírgula.</p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fontes de notícias (sites)</label>
            <input
              className={input}
              placeholder="g1.globo.com, tecmundo.com.br"
              value={newsSourcesStr}
              onChange={(e) => setNewsSourcesStr(e.target.value)}
              maxLength={400}
            />
            <p className="mt-1 text-[10px] text-subtle">Apenas domínios (sem https://), separados por vírgula.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <MapPin className="mr-1 inline size-3" /> Localidade
              </label>
              <input
                className={input}
                placeholder="Maragogi"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                maxLength={60}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Clock className="mr-1 inline size-3" /> Fuso horário
              </label>
              <input
                className={input}
                placeholder="America/Maceio"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                maxLength={60}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <RefreshCw className="mr-1 inline size-3" /> Atualização (min)
              </label>
              <input
                type="number"
                min={1}
                max={1440}
                className={input}
                value={autoUpdate}
                onChange={(e) => setAutoUpdate(Number(e.target.value) || 15)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border-strong/40 bg-glass p-3">
            <div>
              <div className="text-sm font-semibold text-foreground">Clima ativo</div>
              <div className="text-xs text-muted-foreground">Inclui previsão no painel e no digest</div>
            </div>
            <button
              onClick={() => setClimateEnabled((v) => !v)}
              aria-label="Toggle clima"
              className={cn(
                "relative h-6 w-11 rounded-full border transition",
                climateEnabled ? "border-primary bg-primary/30" : "border-border bg-glass"
              )}
            >
              <span className={cn(
                "absolute top-0.5 size-5 rounded-full transition-all",
                climateEnabled ? "left-[22px] bg-primary" : "left-0.5 bg-muted-foreground"
              )} />
            </button>
          </div>
        </div>
      </GlassCard>

      {/* === Section 4: Briefing falado === */}
      <GlassCard className="mb-4">
        <div className="mb-3 flex items-center gap-2">
          <Mic className="size-5 text-primary" />
          <h2 className="hud-label text-primary">BRIEFING FALADO</h2>
        </div>

        <div className="space-y-2">
          <ToggleRow
            label="Digest automático"
            description="Gera uma vez por dia ao abrir o modo voz"
            value={spoken.autoDigest}
            onChange={(v) => setSpoken((p) => ({ ...p, autoDigest: v }))}
          />
          <ToggleRow
            label="Digest médio"
            description="Aproximadamente um minuto de leitura"
            value={spoken.mediumDigest}
            onChange={(v) => setSpoken((p) => ({ ...p, mediumDigest: v }))}
          />
          <ToggleRow
            label="Leitura no modo voz"
            description="Mantém o digest disponível para narração"
            value={spoken.voiceReading}
            onChange={(v) => setSpoken((p) => ({ ...p, voiceReading: v }))}
          />
          <ToggleRow
            label="Cards com prints"
            description="Captura matérias citadas para o HUD visual"
            value={spoken.cardsWithPrints}
            onChange={(v) => setSpoken((p) => ({ ...p, cardsWithPrints: v }))}
          />
        </div>

        {/* Módulos do bom dia */}
        <div className="mt-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Módulos do bom dia</div>
          <div className="flex flex-wrap gap-2">
            {(["agenda", "emails", "news", "climate", "insights"] as SpokenModule[]).map((m) => {
              const active = spoken.modules.includes(m);
              return (
                <button
                  key={m}
                  onClick={() => toggleModule(m)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition",
                    active
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border bg-glass text-muted-foreground hover:border-border-strong"
                  )}
                >
                  {m === "climate" ? "Clima" : m === "emails" ? "E-mails" : m === "news" ? "Notícias" : m === "agenda" ? "Agenda" : "Insights"}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notícias no briefing</label>
            <select
              className={input}
              value={spoken.newsCount}
              onChange={(e) => setSpoken((p) => ({ ...p, newsCount: Number(e.target.value) as NewsCount }))}
            >
              <option value={1}>1 principal</option>
              <option value={2}>2 principais</option>
              <option value={3}>3 principais</option>
              <option value={5}>5 principais</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Retenção dos prints</label>
            <select
              className={input}
              value={spoken.printRetentionDays}
              onChange={(e) => setSpoken((p) => ({ ...p, printRetentionDays: Number(e.target.value) as PrintRetentionDays }))}
            >
              <option value={1}>1 dia</option>
              <option value={3}>3 dias</option>
              <option value={7}>7 dias</option>
              <option value={30}>30 dias</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {/* === Footer actions === */}
      <div className="flex gap-2">
        <NeonButton variant="ghost" onClick={() => navigate({ to: "/briefing" })} className="min-h-[44px]">
          Cancelar
        </NeonButton>
        <NeonButton variant="solid" onClick={save} disabled={!hydrated} className="min-h-[44px] flex-1">
          {saved ? <><Check className="size-4" /> Salvo</> : "Salvar alterações"}
        </NeonButton>
      </div>
    </div>
  );
}

function ToggleRow({ label, description, value, onChange }: {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border-strong/40 bg-glass p-3">
      <div>
        <div className="text-sm font-semibold text-foreground">{label}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <button
        onClick={() => onChange(!value)}
        aria-label={`Toggle ${label}`}
        className={cn(
          "relative h-6 w-11 rounded-full border transition",
          value ? "border-primary bg-primary/30" : "border-border bg-glass"
        )}
      >
        <span className={cn(
          "absolute top-0.5 size-5 rounded-full transition-all",
          value ? "left-[22px] bg-primary" : "left-0.5 bg-muted-foreground"
        )} />
      </button>
    </div>
  );
}
