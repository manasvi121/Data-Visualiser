import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Bookmark, FileDown, Loader2 } from "lucide-react";
import { NavBar } from "@/components/NavBar";
import { FileUpload } from "@/components/FileUpload";
import { Charts } from "@/components/Charts";
import { Chatbot } from "@/components/Chatbot";
import { PdfPreviewDialog } from "@/components/PdfPreviewDialog";
import { Button } from "@/components/ui/button";
import { datasetStore, useDataset } from "@/lib/dataset-store";
import { useAuth } from "@/hooks/use-auth";
import { saveVisualisation } from "@/lib/history";
import type { Dataset } from "@/lib/dataset";

export const Route = createFileRoute("/workspace")({
  component: Workspace,
  head: () => ({
    meta: [
      { title: "Workspace — Data Visualiser" },
      {
        name: "description",
        content:
          "Upload your CSV or Excel file, clean and visualise it, chat with the AI analyst, and export a presentation-ready PDF.",
      },
    ],
  }),
});

function Workspace() {
  const stored = useDataset();
  const [dataset, setDataset] = useState<Dataset | null>(stored);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (stored && stored !== dataset) setDataset(stored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stored]);

  const onLoaded = (ds: Dataset) => {
    setDataset(ds);
    datasetStore.set(ds);
  };

  const save = async () => {
    if (!dataset || !user) return;
    setSaving(true);
    try {
      await saveVisualisation(user.id, dataset);
      toast.success("Saved to History");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <NavBar />
      <main className="max-w-7xl mx-auto px-6 py-10 space-y-12">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-widest text-primary-glow">
              Workspace
            </p>
            <h1 className="font-display text-4xl md:text-5xl mt-2">
              Upload &amp; analyse your dataset
            </h1>
            <p className="text-muted-foreground mt-2 max-w-xl">
              We'll automatically clean it, draw the most useful charts, and let
              the AI analyst answer your questions.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {user && (
              <Button variant="outline" disabled={!dataset || saving} onClick={save}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bookmark className="h-4 w-4" />}
                Save to History
              </Button>
            )}
            <Button variant="hero" disabled={!dataset} onClick={() => setPdfOpen(true)}>
              <FileDown className="h-4 w-4" /> Presentation-ready PDF
            </Button>
          </div>
        </div>

        <FileUpload onLoaded={onLoaded} />

        {dataset && (
          <>
            <section id="visualisation" className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-3xl">Visualisations</h2>
                <p className="text-sm text-muted-foreground">
                  {dataset.rows.length} rows analysed
                </p>
              </div>
              <Charts dataset={dataset} />
            </section>

            <section className="space-y-5">
              <h2 className="font-display text-3xl">AI insights &amp; chat</h2>
              <Chatbot dataset={dataset} />
            </section>
          </>
        )}

        {dataset && (
          <PdfPreviewDialog
            open={pdfOpen}
            onOpenChange={setPdfOpen}
            dataset={dataset}
            chartsSelector="#charts-area"
          />
        )}
      </main>
    </div>
  );
}
