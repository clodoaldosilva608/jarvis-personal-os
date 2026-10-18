# J.A.R.V.I.S. OS — Fase 1: Design System + Orb + HUD

## Adaptação importante
Este projeto roda numa base fixa (React + TanStack Start, Tailwind v4, funções de servidor). Não é possível usar Next.js, FastAPI, Turborepo/pnpm monorepo nem Python. A estrutura equivalente:
- `apps/web` → `src/` (rotas em `src/routes`)
- `packages/ui` → `src/components/ui-jarvis/` + tokens em `src/styles.css` (fonte única de verdade visual)
- `packages/shared/types` → `src/types/jarvis.ts`
- FastAPI/serviços → funções de servidor + Lovable Cloud (fases futuras)

## Fase 1 (esta entrega)
1. **Tokens visuais**: todas as cores do briefing convertidas em variáveis no `styles.css` (fundo #05070A, cyan #00E5FF, roxo #7C3AED, glass, bordas neon), fonte Inter, utilitários `glass`, `neon-glow`, grade de fundo sutil.
2. **Orb** (`<Orb state intensity userImage size />`): Canvas 2D + requestAnimationFrame, ~40 linhas de energia ciano entrelaçadas em anel (ruído senoidal por linha, blending aditivo, trails), nós brilhantes orbitando, core glow interno — fiel ao print enviado. 7 estados: idle (rotação lenta/pulso), listening (expande, mais rápido), speaking (ondas saindo do centro), thinking (rápido + glow forte), identifying (foto no centro + anel de scan), success (flash + contração), error (vermelho momentâneo). Alvo 60fps, respeita devicePixelRatio.
3. **Componentes base**: GlassCard, NeonButton, StatusBadge, MicButton, Waveform, MetricCard, SectionHeader, SidebarItem (variantes glow/active/disabled).
4. **HUD em `/`**: fundo profundo + grade + partículas flutuantes, status no topo ("EM ESPERA" / "OUVINDO" / "FALANDO" / "IDENTIFICANDO"), orb central, mic no rodapé. Toque no mic alterna estados; seletor discreto de estados para demonstração. Cards flutuantes de clima/agenda (dados de exemplo) ao redor do orb. Layout adaptado ao celular.
5. **Esqueleto do Dashboard**: layout com sidebar colapsável e páginas vazias estilizadas: Briefing, Chat, Fontes, Monitoramento, Finanças, Logs, Configurações.
6. **Estado global** com Zustand (orbState, isUnlocked, currentBriefing) e tipos do item 6 do briefing.
7. README com identidade visual.

## Próximas fases (depois)
Tela de Briefing + "Gerar agora", painel de configuração, voz (wake word "Jarvis" + TTS no navegador), Face ID local (MediaPipe), clima/agenda/e-mail/notícias via Lovable Cloud, MCP, multi-monitor.

## Detalhes técnicos
- Deps: `zustand`, `framer-motion`. Sem three.js nesta fase (Canvas 2D é mais leve e reproduz bem o visual das linhas).
- Rotas: `/` (HUD), `/_dashboard` layout pathless com `/briefing`, `/chat`, `/sources`, `/monitoring`, `/finance`, `/logs`, `/settings`.
- Orb isolado em `src/components/orb/` (Orb.tsx, renderer.ts), animação só no cliente.
