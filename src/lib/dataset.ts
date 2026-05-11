import Papa from "papaparse";
import * as XLSX from "xlsx";

export type Row = Record<string, string | number | null>;

export type Dataset = {
  fileName: string;
  columns: string[];
  rows: Row[];
  numericColumns: string[];
  categoricalColumns: string[];
  cleaningReport: CleaningReport;
};

export type CleaningReport = {
  originalRows: number;
  cleanedRows: number;
  duplicatesRemoved: number;
  missingFilled: number;
  trimmedCells: number;
  numericCoerced: number;
};

export async function parseFile(file: File): Promise<Row[]> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "csv" || ext === "txt") {
    return new Promise((resolve, reject) => {
      Papa.parse<Row>(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
        complete: (res) => resolve(res.data as Row[]),
        error: reject,
      });
    });
  }
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json<Row>(ws, { defval: "" });
}

export function cleanDataset(rawRows: Row[], fileName: string): Dataset {
  const report: CleaningReport = {
    originalRows: rawRows.length,
    cleanedRows: 0,
    duplicatesRemoved: 0,
    missingFilled: 0,
    trimmedCells: 0,
    numericCoerced: 0,
  };

  if (rawRows.length === 0) {
    return {
      fileName,
      columns: [],
      rows: [],
      numericColumns: [],
      categoricalColumns: [],
      cleaningReport: report,
    };
  }

  const columns = Object.keys(rawRows[0]);

  // Trim & normalize
  let rows: Row[] = rawRows.map((r) => {
    const out: Row = {};
    for (const c of columns) {
      let v: any = r[c];
      if (typeof v === "string") {
        const t = v.trim();
        if (t !== v) report.trimmedCells++;
        v = t === "" ? null : t;
      }
      out[c] = v ?? null;
    }
    return out;
  });

  // Detect numeric columns
  const numericColumns: string[] = [];
  for (const c of columns) {
    const sample = rows.slice(0, 50).map((r) => r[c]).filter((v) => v !== null && v !== "");
    if (sample.length === 0) continue;
    const nums = sample.filter((v) => !isNaN(Number(v)));
    if (nums.length / sample.length > 0.7) numericColumns.push(c);
  }

  // Coerce numerics
  for (const c of numericColumns) {
    rows = rows.map((r) => {
      if (r[c] !== null && typeof r[c] === "string") {
        const n = Number((r[c] as string).replace(/,/g, ""));
        if (!isNaN(n)) {
          report.numericCoerced++;
          return { ...r, [c]: n };
        }
      }
      return r;
    });
  }

  // Fill missing: numeric → mean, categorical → "Unknown"
  for (const c of columns) {
    const isNum = numericColumns.includes(c);
    if (isNum) {
      const vals = rows.map((r) => r[c]).filter((v) => typeof v === "number") as number[];
      const mean = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      rows = rows.map((r) => {
        if (r[c] === null) {
          report.missingFilled++;
          return { ...r, [c]: Math.round(mean * 100) / 100 };
        }
        return r;
      });
    } else {
      rows = rows.map((r) => {
        if (r[c] === null) {
          report.missingFilled++;
          return { ...r, [c]: "Unknown" };
        }
        return r;
      });
    }
  }

  // Dedup
  const seen = new Set<string>();
  const deduped: Row[] = [];
  for (const r of rows) {
    const key = JSON.stringify(r);
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(r);
    } else {
      report.duplicatesRemoved++;
    }
  }
  rows = deduped;

  report.cleanedRows = rows.length;
  const categoricalColumns = columns.filter((c) => !numericColumns.includes(c));

  return { fileName, columns, rows, numericColumns, categoricalColumns, cleaningReport: report };
}

export function downloadCleanedCSV(ds: Dataset) {
  const csv = Papa.unparse(ds.rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cleaned_${ds.fileName.replace(/\.[^.]+$/, "")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ------- Aggregations for charts -------

export function topCategoryCounts(ds: Dataset, column: string, limit = 8) {
  const counts = new Map<string, number>();
  for (const r of ds.rows) {
    const k = String(r[column] ?? "Unknown");
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, value]) => ({ name, value }));
}

export function numericSummary(ds: Dataset, column: string) {
  const vals = ds.rows.map((r) => r[column]).filter((v) => typeof v === "number") as number[];
  if (!vals.length) return null;
  const sorted = [...vals].sort((a, b) => a - b);
  const sum = vals.reduce((a, b) => a + b, 0);
  const mean = sum / vals.length;
  const median = sorted[Math.floor(sorted.length / 2)];
  return {
    column,
    count: vals.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    mean: Math.round(mean * 100) / 100,
    median,
    sum: Math.round(sum * 100) / 100,
  };
}

export function histogramBins(ds: Dataset, column: string, bins = 10) {
  const vals = ds.rows.map((r) => r[column]).filter((v) => typeof v === "number") as number[];
  if (!vals.length) return [];
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  if (min === max) return [{ name: String(min), value: vals.length }];
  const step = (max - min) / bins;
  const buckets = Array.from({ length: bins }, (_, i) => ({
    name: `${(min + i * step).toFixed(1)}`,
    value: 0,
  }));
  for (const v of vals) {
    let idx = Math.floor((v - min) / step);
    if (idx >= bins) idx = bins - 1;
    buckets[idx].value++;
  }
  return buckets;
}

export function scatterData(ds: Dataset, x: string, y: string) {
  return ds.rows
    .map((r) => ({ x: r[x], y: r[y] }))
    .filter((p) => typeof p.x === "number" && typeof p.y === "number")
    .slice(0, 500);
}

export function buildDatasetSummary(ds: Dataset): string {
  const lines: string[] = [];
  lines.push(`Dataset: ${ds.fileName}`);
  lines.push(`Rows: ${ds.rows.length}, Columns: ${ds.columns.length}`);
  lines.push(`Columns: ${ds.columns.join(", ")}`);
  lines.push(`Numeric: ${ds.numericColumns.join(", ") || "none"}`);
  lines.push(`Categorical: ${ds.categoricalColumns.join(", ") || "none"}`);
  lines.push("");
  lines.push("Numeric summaries:");
  for (const c of ds.numericColumns.slice(0, 8)) {
    const s = numericSummary(ds, c);
    if (s)
      lines.push(
        `- ${c}: min=${s.min}, max=${s.max}, mean=${s.mean}, median=${s.median}, count=${s.count}`,
      );
  }
  lines.push("");
  lines.push("Top categories:");
  for (const c of ds.categoricalColumns.slice(0, 5)) {
    const top = topCategoryCounts(ds, c, 5);
    lines.push(`- ${c}: ${top.map((t) => `${t.name}(${t.value})`).join(", ")}`);
  }
  lines.push("");
  lines.push("First 5 rows (JSON):");
  lines.push(JSON.stringify(ds.rows.slice(0, 5)));
  return lines.join("\n");
}
