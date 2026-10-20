import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Scan, ShieldCheck, Camera, Fingerprint } from "lucide-react";
import { GlassCard } from "@/components/jarvis";
import { Particles } from "@/components/jarvis/Particles";
import { useJarvis } from "@/stores/jarvis";
import { useFaceID } from "@/hooks/use-face-id";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "Identificação — J.A.R.V.I.S." }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { setOrbState, setUnlocked } = useJarvis();
  const [mode, setMode] = useState<"idle" | "scanning" | "enrolling" | "success" | "error">("idle");
  const [hasStored, setHasStored] = useState(false);

  // Check if face embeddings exist
  useEffect(() => {
    try {
      const raw = localStorage.getItem("jarvis-face-embeddings");
      setHasStored(!!raw && JSON.parse(raw).length > 0);
    } catch { setHasStored(false); }
  }, []);

  const handleGoogleLogin = () => {
    // Simula login Google — em produção usaria Supabase/Auth
    setUnlocked(true);
    navigate({ to: "/" });
  };

  const handleFaceId = () => {
    setMode("scanning");
    setOrbState("identifying");

    // Simula verificação facial (2.5s)
    setTimeout(() => {
      const success = Math.random() > 0.2; // 80% sucesso simulado
      if (success) {
        setMode("success");
        setOrbState("success");
        setUnlocked(true);
        setTimeout(() => navigate({ to: "/" }), 800);
      } else {
        setMode("error");
        setOrbState("error");
        setTimeout(() => { setMode("idle"); setOrbState("idle"); }, 2000);
      }
    }, 2500);
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
      <div className="hud-grid absolute inset-0" />
      <div className="hud-vignette absolute inset-0" />
      <Particles />

      {/* Subtle radial glow at center (matches Lovable) — no orb on login, just glow */}
      <div className="absolute inset-0 flex items-center justify-center" style={{
        background: 'radial-gradient(circle at center, rgba(0,229,255,0.10) 0%, rgba(0,229,255,0.03) 40%, transparent 70%)',
      }} />

      {/* Card de login — JARVIS branding moved INSIDE card (like Lovable) */}
      <div className="relative z-10 w-full max-w-md px-6">
        <GlassCard className="border-cyan-500/30 bg-white/[0.04] p-8 backdrop-blur-xl">
          <div className="mb-6 text-center">
            {/* JARVIS branding inside the card */}
            <div className="hud-label text-primary text-glow mb-4 tracking-[0.4em]">J.A.R.V.I.S.</div>
            <h1 className="text-xl font-semibold text-foreground mb-1">Identificação necessária</h1>
            <p className="text-sm text-muted-foreground">
              {mode === "scanning" ? "Escaneando rosto..." :
               mode === "success" ? "Acesso liberado!" :
               mode === "error" ? "Não foi possível identificar. Tente novamente." :
               "Acesso restrito ao dono deste sistema."}
            </p>
          </div>

          {mode === "idle" && (
            <div className="space-y-3">
              {/* Google Login — SOLID cyan button (like Lovable) */}
              <button
                onClick={handleGoogleLogin}
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-cyan-300"
              >
                <svg className="size-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.64 0 3.31.56 4.55 1.64l3.31-3.31C17.46 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
                Entrar com Google
              </button>

              {/* Face ID — outline style (secondary) */}
              <button
                onClick={handleFaceId}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-cyan-500/30 bg-white/[0.03] px-4 py-3 text-sm font-medium text-foreground transition hover:bg-cyan-500/10"
              >
                <Scan className="size-5 text-primary" />
                {hasStored ? "Entrar com Face ID" : "Cadastrar Face ID"}
              </button>

              {/* Demo bypass — minimal subtle link (like Lovable) */}
              <button
                onClick={() => { setUnlocked(true); navigate({ to: "/" }); }}
                className="w-full text-center text-xs text-subtle transition hover:text-muted-foreground pt-1"
              >
                Entrar sem identificação (demo)
              </button>
            </div>
          )}

          {mode === "scanning" && (
            <div className="py-8 text-center">
              <div className="relative mx-auto h-32 w-32">
                {/* Scan rings */}
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="absolute inset-0 rounded-full border border-primary/30"
                    style={{
                      animation: `pulse-ring 1.5s ease-out ${i * 0.5}s infinite`,
                      borderColor: "var(--color-primary)",
                    }}
                  />
                ))}
                <Camera className="absolute inset-0 m-auto size-8 text-primary" />
              </div>
              <p className="mt-4 text-sm text-muted-foreground">Posicione seu rosto na câmera</p>
            </div>
          )}

          {mode === "success" && (
            <div className="py-8 text-center">
              <ShieldCheck className="mx-auto size-12 text-success" />
              <p className="mt-2 text-sm font-medium text-success">Bem-vindo de volta, Lucas.</p>
            </div>
          )}

          {mode === "error" && (
            <div className="py-8 text-center">
              <Fingerprint className="mx-auto size-12 text-destructive" />
              <p className="mt-2 text-sm font-medium text-destructive">Rosto não reconhecido</p>
            </div>
          )}
        </GlassCard>
      </div>
    </main>
  );
}
