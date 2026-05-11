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
  const q = (p: number) => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
  const variance = vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length;
  const stddev = Math.sqrt(variance);
  const r = (n: number) => Math.round(n * 1000) / 1000;
  const nulls = ds.rows.length - vals.length;
  return {
    column,
    count: vals.length,
    missing: nulls,
    min: r(sorted[0]),
    max: r(sorted[sorted.length - 1]),
    mean: r(mean),
    median: r(median),
    stddev: r(stddev),
    q1: r(q(0.25)),
    q3: r(q(0.75)),
    sum: r(sum),
  };
}

export function pearsonCorrelation(ds: Dataset, a: string, b: string): number | null {
  const pairs = ds.rows
    .map((r) => [r[a], r[b]])
    .filter(([x, y]) => typeof x === "number" && typeof y === "number") as [number, number][];
  if (pairs.length < 3) return null;
  const n = pairs.length;
  const mx = pairs.reduce((s, [x]) => s + x, 0) / n;
  const my = pairs.reduce((s, [, y]) => s + y, 0) / n;
  let num = 0, dx = 0, dy = 0;
  for (const [x, y] of pairs) {
    num += (x - mx) * (y - my);
    dx += (x - mx) ** 2;
    dy += (y - my) ** 2;
  }
  const den = Math.sqrt(dx * dy);
  if (!den) return null;
  return Math.round((num / den) * 1000) / 1000;
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
  lines.push(`# Dataset Profile`);
  lines.push(`File: ${ds.fileName}`);
  lines.push(`Total rows: ${ds.rows.length}`);
  lines.push(`Total columns: ${ds.columns.length}`);
  lines.push(`All columns (in order): ${ds.columns.join(" | ")}`);
  lines.push(`Numeric columns (${ds.numericColumns.length}): ${ds.numericColumns.join(", ") || "none"}`);
  lines.push(`Categorical columns (${ds.categoricalColumns.length}): ${ds.categoricalColumns.join(", ") || "none"}`);
  lines.push(`Cleaning report: ${ds.cleaningReport.duplicatesRemoved} duplicates removed, ${ds.cleaningReport.missingFilled} missing values filled, ${ds.cleaningReport.numericCoerced} numeric coercions.`);
  lines.push("");

  lines.push("## Numeric column statistics");
  for (const c of ds.numericColumns) {
    const s = numericSummary(ds, c);
    if (s)
      lines.push(
        `- ${c}: count=${s.count}, missing=${s.missing}, min=${s.min}, q1=${s.q1}, median=${s.median}, q3=${s.q3}, max=${s.max}, mean=${s.mean}, stddev=${s.stddev}, sum=${s.sum}`,
      );
  }
  lines.push("");

  lines.push("## Categorical value distributions");
  for (const c of ds.categoricalColumns) {
    const top = topCategoryCounts(ds, c, 12);
    const uniq = new Set(ds.rows.map((r) => String(r[c] ?? "Unknown"))).size;
    lines.push(
      `- ${c} (unique=${uniq}): ${top.map((t) => `"${t.name}"=${t.value}`).join(", ")}${uniq > top.length ? ` …+${uniq - top.length} more` : ""}`,
    );
  }
  lines.push("");

  if (ds.numericColumns.length >= 2) {
    lines.push("## Pairwise correlations (Pearson r)");
    const pairs: { a: string; b: string; r: number }[] = [];
    for (let i = 0; i < ds.numericColumns.length; i++) {
      for (let j = i + 1; j < ds.numericColumns.length; j++) {
        const r = pearsonCorrelation(ds, ds.numericColumns[i], ds.numericColumns[j]);
        if (r !== null) pairs.push({ a: ds.numericColumns[i], b: ds.numericColumns[j], r });
      }
    }
    pairs.sort((x, y) => Math.abs(y.r) - Math.abs(x.r));
    for (const p of pairs.slice(0, 15)) lines.push(`- ${p.a} vs ${p.b}: r=${p.r}`);
    lines.push("");
  }

  const sampleSize = Math.min(20, ds.rows.length);
  lines.push(`## Sample rows (first ${sampleSize} of ${ds.rows.length}, JSON)`);
  lines.push(JSON.stringify(ds.rows.slice(0, sampleSize)));

  if (ds.rows.length > sampleSize) {
    const lastN = Math.min(5, ds.rows.length - sampleSize);
    lines.push(`## Last ${lastN} rows (JSON)`);
    lines.push(JSON.stringify(ds.rows.slice(-lastN)));
  }

  return lines.join("\n");
}
