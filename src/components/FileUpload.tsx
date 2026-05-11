import { useRef, useState } from "react";
import { Upload, FileSpreadsheet, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cleanDataset, downloadCleanedCSV, parseFile, type Dataset } from "@/lib/dataset";

export function FileUpload({
  onLoaded,
}: {
  onLoaded: (ds: Dataset) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [ds, setDs] = useState<Dataset | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const raw = await parseFile(file);
      const cleaned = cleanDataset(raw, file.name);
      setDs(cleaned);
      onLoaded(cleaned);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to parse file");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f) handleFile(f);
        }}
        className="cursor-pointer glass rounded-2xl border-2 border-dashed border-primary/30 p-12 text-center hover:border-primary/60 transition-colors"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls,.txt"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-primary grid place-items-center shadow-glow">
          {loading ? (
            <Loader2 className="h-6 w-6 text-primary-foreground animate-spin" />
          ) : (
            <Upload className="h-6 w-6 text-primary-foreground" />
          )}
        </div>
        <h3 className="mt-5 font-display text-xl">
          {loading ? "Cleaning your data…" : "Drop your CSV or Excel file"}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          .csv, .xlsx, .xls — we automatically clean, dedupe, and type-coerce.
        </p>
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      </div>

      {ds && (
        <div className="glass rounded-2xl p-6 shadow-card">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/15 grid place-items-center">
              <FileSpreadsheet className="h-5 w-5 text-primary-glow" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{ds.fileName}</p>
              <p className="text-xs text-muted-foreground">
                {ds.rows.length} rows · {ds.columns.length} columns
              </p>
            </div>
            <CheckCircle2 className="h-5 w-5 text-primary-glow" />
          </div>

          <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <Stat label="Cleaned rows" value={ds.cleaningReport.cleanedRows} />
            <Stat label="Duplicates removed" value={ds.cleaningReport.duplicatesRemoved} />
            <Stat label="Missing filled" value={ds.cleaningReport.missingFilled} />
            <Stat label="Cells trimmed" value={ds.cleaningReport.trimmedCells} />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => downloadCleanedCSV(ds)}>
              Download cleaned CSV
            </Button>
            <Button
              variant="hero"
              onClick={() => {
                document
                  .getElementById("visualisation")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Visualise the dataset
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-secondary/40 py-3">
      <p className="font-display text-2xl">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
