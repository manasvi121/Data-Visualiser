import { createFileRoute, Link } from "@tanstack/react-router";
import { NavBar } from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, Bot, FileDown, Sparkles, Upload } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "Data Visualiser — Clean, visualise and chat with your data" },
      {
        name: "description",
        content:
          "Upload CSV or Excel, get an automatically cleaned dataset, beautiful visualisations, AI-powered insights and a presentation-ready PDF.",
      },
    ],
  }),
});

function Home() {
  return (
    <div className="min-h-screen bg-gradient-hero">
      <NavBar />
      <main className="max-w-7xl mx-auto px-6">
        {/* Hero */}
        <section className="pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-foreground/80 mb-6">
            <Sparkles className="h-3.5 w-3.5 text-primary-glow" />
            AI-powered data analysis
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-semibold leading-[1.05] tracking-tight">
            Turn raw data into <br />
            <span className="text-gradient">decisions</span>, instantly.
          </h1>
          <p className="mt-6 mx-auto max-w-2xl text-lg text-muted-foreground">
            Drop in a CSV or Excel file. Data Visualiser cleans it, charts it, and lets
            you chat with an AI analyst — then exports the whole story as a
            presentation-ready PDF.
          </p>
          <div className="mt-10 flex justify-center gap-3">
            <Button asChild size="lg" variant="hero">
              <Link to="/workspace">
                Start analysing <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Features */}
        <section className="grid md:grid-cols-4 gap-4 pb-24">
          {[
            { icon: Upload, title: "Upload", body: "CSV or Excel — up to thousands of rows." },
            { icon: Sparkles, title: "Auto-clean", body: "Trim, dedupe, fill missing, coerce types." },
            { icon: BarChart3, title: "Visualise", body: "Four ready-made charts in one click." },
            { icon: Bot, title: "Chat", body: "Ask the AI anything about your data." },
          ].map((f) => (
            <div key={f.title} className="glass rounded-xl p-5 shadow-card">
              <f.icon className="h-5 w-5 text-primary-glow" />
              <h3 className="mt-4 font-display text-lg">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </section>

        <section className="pb-24 grid md:grid-cols-2 gap-6">
          <div className="glass rounded-2xl p-8 shadow-card">
            <FileDown className="h-6 w-6 text-primary-glow" />
            <h3 className="mt-4 font-display text-2xl">Presentation-ready PDF</h3>
            <p className="mt-2 text-muted-foreground">
              One click exports your dataset overview, charts and AI insights into a
              polished PDF — preview before you download.
            </p>
          </div>
          <div className="glass rounded-2xl p-8 shadow-card">
            <Bot className="h-6 w-6 text-primary-glow" />
            <h3 className="mt-4 font-display text-2xl">Insights you can trust</h3>
            <p className="mt-2 text-muted-foreground">
              The AI analyst is grounded in the dataset summary you uploaded — it
              answers from your numbers, not from guesses.
            </p>
          </div>
        </section>
      </main>
      <footer className="border-t border-border/40 py-8 text-center text-xs text-muted-foreground">
        Built with Lovable AI · Black · Purple · White
      </footer>
    </div>
  );
}
