import { createFileRoute } from "@tanstack/react-router";
import { Newspaper, ExternalLink } from "lucide-react";
import { GlassCard, SectionHeader } from "@/components/jarvis";

export const Route = createFileRoute("/_dashboard/news")({
  head: () => ({ meta: [{ title: "Notícias — J.A.R.V.I.S." }] }),
  component: NewsPage,
});

const RECENT = [
  { title: "Apple envia um recibo de privacidade para usuários", source: "Brave News", time: "há 1h", cat: "tech" },
  { title: "Willow informa estatísticas do sono da última semana", source: "Brave News", time: "há 3h", cat: "tech" },
  { title: "OpenAI freia lançamento de novo modelo de IA diante de riscos de segurança", source: "tecmundo.com.br", time: "há 4h", cat: "ia" },
  { title: "Apple anuncia integração com modelos locais no iOS 19", source: "g1.globo.com", time: "há 6h", cat: "ia" },
  { title: "Novo marco regulatório de IA é aprovado no Senado", source: "g1.globo.com", time: "há 8h", cat: "politica" },
];

const POLITICA = [
  { title: "Após nova pesquisa Datafolha, analistas preveem cenário de segundo turno", source: "veja.com", time: "há 2h" },
  { title: "Cientista político vê possível interferência externa no processo eleitoral", source: "g1.globo.com", time: "há 5h" },
  { title: "STF julga ação sobre fiscalização eletrônica nas urnas", source: "uol.com.br", time: "há 12h" },
];

function NewsPage() {
  return (
    <div className="mx-auto max-w-4xl pb-16">
      <SectionHeader title="Notícias" subtitle="Brave News + fontes RSS filtradas por tópico" />

      <div className="grid gap-4 md:grid-cols-2">
        {/* Recentes */}
        <GlassCard className="p-5">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-60" />
          <h2 className="hud-label mb-4 text-primary">Recentes</h2>
          <div className="space-y-2">
            {RECENT.map((n, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border border-glass-border bg-glass p-2.5 transition hover:border-border">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary shadow-[0_0_4px_var(--primary)]" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{n.title}</p>
                  <p className="text-xs text-subtle">{n.source} · {n.time}</p>
                </div>
                <ExternalLink className="size-3 shrink-0 text-subtle" />
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Política */}
        <GlassCard className="p-5">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-60" />
          <h2 className="hud-label mb-4" style={{ color: "var(--warning)" }}>Política</h2>
          <div className="space-y-2">
            {POLITICA.map((n, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border border-glass-border bg-glass p-2.5 transition hover:border-border">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full" style={{ background: "var(--warning)" }} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{n.title}</p>
                  <p className="text-xs text-subtle">{n.source} · {n.time}</p>
                </div>
                <ExternalLink className="size-3 shrink-0 text-subtle" />
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {["IA", "Tecnologia", "Política", "Economia", "Ciência", "Startups"].map((cat) => (
          <button key={cat} className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary hover:text-primary">
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}
