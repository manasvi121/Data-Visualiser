import { supabase } from "@/integrations/supabase/client";
import { buildDatasetSummary, cleanDataset, parseFile, type Dataset } from "./dataset";
import Papa from "papaparse";

const BUCKET = "datasets";

export async function saveVisualisation(userId: string, ds: Dataset): Promise<string> {
  const csv = Papa.unparse(ds.rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const path = `${userId}/${crypto.randomUUID()}_${ds.fileName.replace(/[^a-z0-9.\-_]/gi, "_")}.csv`;

  const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: "text/csv",
    upsert: false,
  });
  if (upErr) throw upErr;

  const { data, error } = await supabase
    .from("visualisations")
    .insert({
      user_id: userId,
      name: ds.fileName,
      original_filename: ds.fileName,
      row_count: ds.rows.length,
      column_count: ds.columns.length,
      summary: buildDatasetSummary(ds).slice(0, 4000),
      storage_path: path,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function listVisualisations(userId: string) {
  const { data, error } = await supabase
    .from("visualisations")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function deleteVisualisation(id: string, storagePath: string) {
  await supabase.storage.from(BUCKET).remove([storagePath]);
  const { error } = await supabase.from("visualisations").delete().eq("id", id);
  if (error) throw error;
}

export async function loadVisualisation(storagePath: string, displayName: string): Promise<Dataset> {
  const { data, error } = await supabase.storage.from(BUCKET).download(storagePath);
  if (error || !data) throw error ?? new Error("Could not load file");
  const file = new File([data], displayName, { type: "text/csv" });
  const raw = await parseFile(file);
  return cleanDataset(raw, displayName);
}
