import { useEffect, useRef, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { numericSummary, topCategoryCounts, type Dataset } from "@/lib/dataset";

export function PdfPreviewDialog({
  open,
  onOpenChange,
  dataset,
  chartsSelector,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  dataset: Dataset;
  chartsSelector: string;
}) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [chartImg, setChartImg] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const el = document.querySelector(chartsSelector) as HTMLElement | null;
    if (!el) return;
    html2canvas(el, {
      backgroundColor: "#0a0612",
      scale: 1.5,
      useCORS: true,
    }).then((canvas) => setChartImg(canvas.toDataURL("image/png")));
  }, [open, chartsSelector]);

  const downloadPdf = async () => {
    if (!reportRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: "#0a0612",
        scale: 2,
      });
      const pdf = new jsPDF("p", "mm", "a4");
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgW = pageW;
      const imgH = (canvas.height * imgW) / canvas.width;
      const imgData = canvas.toDataURL("image/png");

      let heightLeft = imgH;
      let position = 0;
      pdf.addImage(imgData, "PNG", 0, position, imgW, imgH);
      heightLeft -= pageH;
      while (heightLeft > 0) {
        position = heightLeft - imgH;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgW, imgH);
        heightLeft -= pageH;
      }
      pdf.save(`${dataset.fileName.replace(/\.[^.]+$/, "")}-report.pdf`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display">Presentation-ready PDF preview</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto rounded-lg border border-border/50">
          <div
            ref={reportRef}
            className="bg-background p-10 mx-auto"
            style={{ width: 794 }}
          >
            <ReportContent dataset={dataset} chartImg={chartImg} />
          </div>
        </div>
        <div className="flex justify-end pt-3">
          <Button variant="hero" onClick={downloadPdf} disabled={downloading}>
            {downloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Generating…
              </>
            ) : (
              <>
                <Download className="h-4 w-4" /> Download PDF
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ReportContent({
  dataset,
  chartImg,
}: {
  dataset: Dataset;
  chartImg: string | null;
}) {
  const r = dataset.cleaningReport;
  return (
    <div className="text-foreground space-y-8">
      {/* Header */}
      <div className="border-b border-border/60 pb-6">
        <p className="text-xs uppercase tracking-widest text-primary-glow">
          Data Visualiser Report
        </p>
        <h1 className="font-display text-4xl mt-2">{dataset.fileName}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {dataset.rows.length} rows · {dataset.columns.length} columns ·
          generated {new Date().toLocaleDateString()}
        </p>
      </div>

      {/* Overview */}
      <section>
        <h2 className="font-display text-2xl mb-3">Dataset overview</h2>
        <div className="grid grid-cols-4 gap-3">
          <Stat label="Rows" v={dataset.rows.length} />
          <Stat label="Columns" v={dataset.columns.length} />
          <Stat label="Numeric" v={dataset.numericColumns.length} />
          <Stat label="Categorical" v={dataset.categoricalColumns.length} />
        </div>
        <div className="mt-4 text-sm">
          <p>
            <span className="text-muted-foreground">Numeric columns:</span>{" "}
            {dataset.numericColumns.join(", ") || "—"}
          </p>
          <p className="mt-1">
            <span className="text-muted-foreground">Categorical columns:</span>{" "}
            {dataset.categoricalColumns.join(", ") || "—"}
          </p>
        </div>
      </section>

      {/* Cleaning */}
      <section>
        <h2 className="font-display text-2xl mb-3">Cleaning report</h2>
        <div className="grid grid-cols-4 gap-3">
          <Stat label="Original rows" v={r.originalRows} />
          <Stat label="Cleaned rows" v={r.cleanedRows} />
          <Stat label="Duplicates removed" v={r.duplicatesRemoved} />
          <Stat label="Missing filled" v={r.missingFilled} />
        </div>
      </section>

      {/* Charts */}
      <section>
        <h2 className="font-display text-2xl mb-3">Visualisations</h2>
        {chartImg ? (
          <img
            src={chartImg}
            alt="Charts"
            className="w-full rounded-lg border border-border/60"
          />
        ) : (
          <p className="text-sm text-muted-foreground">Rendering charts…</p>
        )}
      </section>

      {/* Summaries */}
      <section>
        <h2 className="font-display text-2xl mb-3">Numeric summaries</h2>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left text-muted-foreground border-b border-border/60">
              <th className="py-2">Column</th>
              <th>Min</th>
              <th>Max</th>
              <th>Mean</th>
              <th>Median</th>
              <th>Count</th>
            </tr>
          </thead>
          <tbody>
            {dataset.numericColumns.slice(0, 8).map((c) => {
              const s = numericSummary(dataset, c);
              if (!s) return null;
              return (
                <tr key={c} className="border-b border-border/30">
                  <td className="py-2 font-medium">{c}</td>
                  <td>{s.min}</td>
                  <td>{s.max}</td>
                  <td>{s.mean}</td>
                  <td>{s.median}</td>
                  <td>{s.count}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="font-display text-2xl mb-3">Top categories</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {dataset.categoricalColumns.slice(0, 4).map((c) => {
            const top = topCategoryCounts(dataset, c, 5);
            return (
              <div key={c} className="rounded-lg border border-border/60 p-3">
                <p className="text-muted-foreground text-xs mb-2">{c}</p>
                {top.map((t) => (
                  <div key={t.name} className="flex justify-between py-0.5">
                    <span>{t.name}</span>
                    <span className="text-primary-glow">{t.value}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl mb-3">Sample rows</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border/60">
                {dataset.columns.slice(0, 6).map((c) => (
                  <th key={c} className="py-1 pr-3">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataset.rows.slice(0, 8).map((row, i) => (
                <tr key={i} className="border-b border-border/30">
                  {dataset.columns.slice(0, 6).map((c) => (
                    <td key={c} className="py-1 pr-3">
                      {String(row[c] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-center text-xs text-muted-foreground pt-6 border-t border-border/40">
        Generated by Data Visualiser · AI-powered insights
      </p>
    </div>
  );
}

function Stat({ label, v }: { label: string; v: number }) {
  return (
    <div className="rounded-lg bg-secondary/40 p-3">
      <p className="font-display text-2xl">{v}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
