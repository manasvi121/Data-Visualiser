import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { LogIn, LogOut, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export function NavBar() {
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const link = (to: string, label: string) => (
    <Link
      to={to}
      className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
        pathname === to
          ? "bg-primary/15 text-foreground"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 glass">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4 gap-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-primary grid place-items-center shadow-glow">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">
            Data Visualiser
          </span>
        </Link>
        <nav className="flex items-center gap-1 flex-wrap">
          {link("/", "Home")}
          {link("/workspace", "Workspace")}
          {link("/compare", "Compare")}
          {user && link("/history", "History")}
          {user ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await signOut();
                navigate({ to: "/" });
              }}
              className="ml-1"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">{user.email?.split("@")[0] ?? "Sign out"}</span>
            </Button>
          ) : (
            <Button asChild variant="hero" size="sm" className="ml-1">
              <Link to="/login">
                <LogIn className="h-4 w-4" /> Sign in
              </Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
