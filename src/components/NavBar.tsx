import { Link, useLocation } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

export function NavBar() {
  const { pathname } = useLocation();
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
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-primary grid place-items-center shadow-glow">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">
            Data Visualiser
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          {link("/", "Home")}
          {link("/workspace", "Workspace")}
        </nav>
      </div>
    </header>
  );
}
