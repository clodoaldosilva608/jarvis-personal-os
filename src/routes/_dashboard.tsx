import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { Sun, MessageSquare, Database, Activity, Wallet, ScrollText, Settings, PanelLeft, Hexagon } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_dashboard")({ component: DashboardLayout });

const items = [
  { to: "/briefing", label: "Briefing", icon: Sun },
  { to: "/chat", label: "Chat", icon: MessageSquare },
  { to: "/sources", label: "Fontes", icon: Database },
  { to: "/monitoring", label: "Monitoramento", icon: Activity },
  { to: "/finance", label: "Finanças", icon: Wallet },
  { to: "/logs", label: "Logs", icon: ScrollText },
  { to: "/settings", label: "Configurações", icon: Settings },
] as const;

function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="relative flex min-h-screen w-full bg-background">
      <div className="hud-grid pointer-events-none fixed inset-0" />
      <aside className={cn("glass relative z-10 flex shrink-0 flex-col border-y-0 border-l-0 transition-all duration-300", collapsed ? "w-14" : "w-56")}>
        <div className="flex h-14 items-center gap-2 px-3">
          <button onClick={() => setCollapsed((c) => !c)} aria-label="Alternar menu" className="rounded-md p-1.5 text-muted-foreground hover:text-primary"><PanelLeft className="size-5" /></button>
          {!collapsed && <span className="hud-label text-primary text-glow">J.A.R.V.I.S.</span>}
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-2">
          <Link to="/" className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition hover:bg-glass hover:text-primary">
            <Hexagon className="size-4 shrink-0" />{!collapsed && "HUD"}
          </Link>
          {items.map(({ to, label, icon: Icon }) => {
            const active = path === to;
            return (
              <Link key={to} to={to} className={cn("flex items-center gap-3 rounded-lg border border-transparent px-2.5 py-2 text-sm transition", active ? "border-border-strong bg-primary/10 text-primary neon-glow" : "text-muted-foreground hover:bg-glass hover:text-foreground")}>
                <Icon className="size-4 shrink-0" />{!collapsed && label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="relative z-10 flex-1 overflow-x-hidden p-5 md:p-8"><Outlet /></main>
    </div>
  );
}
