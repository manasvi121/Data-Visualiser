import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { FileText, Loader2, Plus, Upload, X } from "lucide-react";
import { NavBar } from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Charts } from "@/components/Charts";
import { PdfPreviewDialog } from "@/components/PdfPreviewDialog";
import { cleanDataset, parseFile, type Dataset } from "@/lib/dataset";

const MAX = 3;

export const Route = createFileRoute("/compare")({
  component: ComparePage,
  head: () => ({
    meta: [
      { title: "Compare — Side-by-side visualisations" },
      { name: "description", content: "Upload up to 3 datasets and compare their visualisations side by side." },
    ],
  }),
});

function ComparePage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFiles = async (files: FileList | null) => {
    if (!files) return;
    setLoading(true);
    try {
      const slots = MAX - datasets.length;
      const incoming = Array.from(files).slice(0, slots);
      const parsed = await Promise.all(
        incoming.map(async (f) => cleanDataset(await parseFile(f), f.name)),
      );
      setDatasets((prev) => [...prev, ...parsed].slice(0, MAX));
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = (i: number) =>
    setDatasets((prev) => prev.filter((_, idx) => idx !== i));

  const cols =
    datasets.length === 1 ? "grid-cols-1" : datasets.length === 2 ? "lg:grid-cols-2" : "xl:grid-cols-3";

  return (
    <div className="min-h-screen bg-gradient-hero">
      <NavBar />
      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        <div>
          <p className="text-xs uppercase tracking-widest text-primary-glow">Compare</p>
          <h1 className="font-display text-4xl md:text-5xl mt-2">Side-by-side visualisations</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Drop up to {MAX} CSV or Excel files and see their charts laid out next to each other.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,.xls,.txt"
            multiple
            className="hidden"
            onChange={(e) => onFiles(e.target.files)}
          />
          <Button
            variant="hero"
            onClick={() => inputRef.current?.click()}
            disabled={loading || datasets.length >= MAX}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add file{datasets.length > 0 ? "s" : ""}
          </Button>
          <p className="text-sm text-muted-foreground">
            {datasets.length}/{MAX} files loaded
          </p>
          {datasets.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setDatasets([])}>
              Clear all
            </Button>
          )}
        </div>

        {datasets.length === 0 && (
          <div
            onClick={() => inputRef.current?.click()}
            className="cursor-pointer glass rounded-2xl border-2 border-dashed border-primary/30 p-16 text-center hover:border-primary/60"
          >
            <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-primary grid place-items-center shadow-glow">
              <Upload className="h-6 w-6 text-primary-foreground" />
            </div>
            <h3 className="mt-5 font-display text-xl">Drop multiple files</h3>
            <p className="mt-1 text-sm text-muted-foreground">Up to {MAX} at once.</p>
          </div>
        )}

        {datasets.length > 0 && (
          <div className={`grid gap-6 ${cols}`}>
            {datasets.map((ds, i) => (
              <div key={i} className="space-y-4">
                <div className="glass rounded-xl p-4 flex items-center gap-3 shadow-card">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{ds.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {ds.rows.length} rows · {ds.columns.length} cols
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => remove(i)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="[&_.grid]:grid-cols-1">
                  <Charts dataset={ds} />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
