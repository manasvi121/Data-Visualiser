import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { NavBar } from "@/components/NavBar";
import { FileUpload } from "@/components/FileUpload";
import { Charts } from "@/components/Charts";
import { Chatbot } from "@/components/Chatbot";
import { PdfPreviewDialog } from "@/components/PdfPreviewDialog";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
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
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [pdfOpen, setPdfOpen] = useState(false);

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
          <Button
            variant="hero"
            disabled={!dataset}
            onClick={() => setPdfOpen(true)}
          >
            <FileDown className="h-4 w-4" /> Presentation-ready PDF
          </Button>
        </div>

        <FileUpload onLoaded={setDataset} />

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
