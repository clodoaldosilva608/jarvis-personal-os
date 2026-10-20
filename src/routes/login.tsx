import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { Scan, ShieldCheck, Camera, Fingerprint } from "lucide-react";
import { GlassCard } from "@/components/jarvis";
import { useJarvis } from "@/stores/jarvis";

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
  // Easter egg: 5 quick clicks on background → unlock demo mode (no UI clutter)
  const [bgClickCount, setBgClickCount] = useState(0);
  const bgClickTimerRef = useRef<number | null>(null);

  // Check if face embeddings exist
  useEffect(() => {
    try {
      const raw = localStorage.getItem("jarvis-face-embeddings");
      setHasStored(!!raw && JSON.parse(raw).length > 0);
    } catch { setHasStored(false); }
  }, []);

  const handleBackgroundClick = () => {
    setBgClickCount((c) => c + 1);
    if (bgClickTimerRef.current) window.clearTimeout(bgClickTimerRef.current);
    bgClickTimerRef.current = window.setTimeout(() => setBgClickCount(0), 2000);
    if (bgClickCount + 1 >= 5) {
      setUnlocked(true);
      localStorage.setItem("jarvis-unlocked", "true");
      navigate({ to: "/" });
    }
  };

  const handleGoogleLogin = () => {
    setUnlocked(true);
    localStorage.setItem("jarvis-unlocked", "true");
    navigate({ to: "/" });
  };

  const handleFaceId = () => {
    setMode("scanning");
    setOrbState("identifying");
    setTimeout(() => {
      const success = Math.random() > 0.2;
      if (success) {
        setMode("success");
        setOrbState("success");
        setUnlocked(true);
        localStorage.setItem("jarvis-unlocked", "true");
        setTimeout(() => navigate({ to: "/" }), 800);
      } else {
        setMode("error");
        setOrbState("error");
        setTimeout(() => { setMode("idle"); setOrbState("idle"); }, 2000);
      }
    }, 2500);
  };

  return (
    <main onClick={handleBackgroundClick} className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#020617] cursor-default">
      {/* Subtle background — only the HUD grid + vignette (matches Lovable) */}
      <div className="hud-grid absolute inset-0 opacity-50" />
      <div className="hud-vignette absolute inset-0" />
      {/* Subtle radial glow at center — no orb visible */}
      <div className="absolute inset-0 flex items-center justify-center" style={{
        background: "radial-gradient(circle at center, rgba(0,229,255,0.08) 0%, transparent 60%)",
      }} />

      {/* Login card — matches Lovable layout */}
      <div className="relative z-10 w-full max-w-md px-6" onClick={(e) => e.stopPropagation()}>
        <GlassCard className="border-cyan-500/30 bg-white/[0.04] p-8 backdrop-blur-xl">
          <div className="mb-6 text-center">
            {/* JARVIS branding inside the card (like Lovable) */}
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
              {/* Google Login — SOLID cyan button, NO Google G icon (matches Lovable exactly) */}
              <button
                onClick={handleGoogleLogin}
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-cyan-300"
              >
                Entrar com Google
              </button>

              {/* Face ID — only visible if user has stored embeddings (hidden from new users, like Lovable) */}
              {hasStored && (
                <button
                  onClick={handleFaceId}
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-cyan-500/30 bg-white/[0.03] px-4 py-3 text-sm font-medium text-foreground transition hover:bg-cyan-500/10"
                >
                  <Scan className="size-5 text-primary" />
                  Entrar com Face ID
                </button>
              )}
            </div>
          )}

          {mode === "scanning" && (
            <div className="py-8 text-center">
              <div className="relative mx-auto h-32 w-32">
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
