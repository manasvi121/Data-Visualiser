import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Sign in — Data Visualiser" },
      { name: "description", content: "Sign in to save your visualisations and access History." },
    ],
  }),
});

function LoginPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/history" });
  }, [user, loading, navigate]);

  const signInGoogle = async () => {
    setBusy(true);
    setErr(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setErr(result.error.message ?? "Sign in failed");
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/history" });
  };

  return (
    <div className="min-h-screen bg-gradient-hero grid place-items-center px-6">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
        <div className="glass rounded-2xl p-8 shadow-card text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-gradient-primary grid place-items-center shadow-glow">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl mt-5">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Sign in to save and revisit your past visualisations.
          </p>

          <div className="mt-8 space-y-3">
            <Button onClick={signInGoogle} disabled={busy} variant="hero" className="w-full" size="lg">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />} Continue with Google
            </Button>
            <Button disabled variant="outline" className="w-full opacity-60 cursor-not-allowed" size="lg" title="GitHub requires direct Supabase configuration">
              <GitHubIcon /> Continue with GitHub (coming soon)
            </Button>
          </div>

          {err && <p className="mt-4 text-sm text-destructive">{err}</p>}

          <p className="mt-8 text-xs text-muted-foreground">
            You can also{" "}
            <Link to="/workspace" className="text-primary-glow hover:underline">
              use the app without signing in
            </Link>
            . History is only available when signed in.
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path fill="#fff" d="M21.6 12.227c0-.708-.064-1.39-.182-2.045H12v3.868h5.382a4.6 4.6 0 0 1-1.996 3.018v2.51h3.227c1.887-1.738 2.987-4.298 2.987-7.35z"/>
      <path fill="#fff" opacity=".7" d="M12 22c2.7 0 4.964-.895 6.618-2.422l-3.227-2.51c-.895.6-2.04.955-3.391.955-2.604 0-4.81-1.76-5.595-4.123H3.064v2.59A9.996 9.996 0 0 0 12 22z"/>
      <path fill="#fff" opacity=".5" d="M6.405 13.9a6 6 0 0 1 0-3.8V7.51H3.064a10 10 0 0 0 0 8.98l3.341-2.59z"/>
      <path fill="#fff" opacity=".85" d="M12 5.977c1.468 0 2.786.505 3.823 1.495l2.866-2.866C16.96 2.99 14.696 2 12 2A9.996 9.996 0 0 0 3.064 7.51l3.341 2.59C7.19 7.736 9.396 5.977 12 5.977z"/>
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2.17c-3.2.7-3.87-1.36-3.87-1.36-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.25 3.34.96.1-.74.4-1.25.73-1.54-2.55-.29-5.23-1.27-5.23-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.17.91-.25 1.89-.38 2.86-.38.97 0 1.95.13 2.86.38 2.19-1.48 3.15-1.17 3.15-1.17.62 1.58.23 2.75.11 3.04.74.8 1.18 1.82 1.18 3.07 0 4.4-2.69 5.36-5.25 5.65.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.55C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z"/>
    </svg>
  );
}
