import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2, Eye, History as HistoryIcon, FileSpreadsheet } from "lucide-react";
import { NavBar } from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { deleteVisualisation, listVisualisations, loadVisualisation } from "@/lib/history";
import { datasetStore } from "@/lib/dataset-store";

export const Route = createFileRoute("/history")({
  component: HistoryPage,
  head: () => ({
    meta: [
      { title: "History — Data Visualiser" },
      { name: "description", content: "Revisit your past dataset visualisations and AI insights." },
    ],
  }),
});

function HistoryPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [opening, setOpening] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  const { data: items, isLoading } = useQuery({
    queryKey: ["visualisations", user?.id],
    queryFn: () => listVisualisations(user!.id),
    enabled: !!user,
  });

  const del = useMutation({
    mutationFn: (v: { id: string; path: string }) => deleteVisualisation(v.id, v.path),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["visualisations"] }),
  });

  const open = async (id: string, path: string, name: string) => {
    setOpening(id);
    try {
      const ds = await loadVisualisation(path, name);
      datasetStore.set(ds);
      navigate({ to: "/workspace" });
    } finally {
      setOpening(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <NavBar />
      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-primary grid place-items-center shadow-glow">
            <HistoryIcon className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-4xl">History</h1>
            <p className="text-sm text-muted-foreground">
              Past datasets you saved are listed here. Re-open one to chat and chart again.
            </p>
          </div>
        </div>

        <div className="mt-10">
          {(loading || isLoading) && (
            <div className="grid place-items-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-primary-glow" />
            </div>
          )}

          {!isLoading && items && items.length === 0 && (
            <div className="glass rounded-2xl p-10 text-center shadow-card">
              <p className="text-muted-foreground">No saved visualisations yet.</p>
              <Button asChild variant="hero" className="mt-5">
                <Link to="/workspace">Upload your first dataset</Link>
              </Button>
            </div>
          )}

          {items && items.length > 0 && (
            <div className="grid gap-3">
              {items.map((v) => (
                <div key={v.id} className="glass rounded-xl p-5 shadow-card flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/15 grid place-items-center">
                    <FileSpreadsheet className="h-5 w-5 text-primary-glow" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{v.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(v.created_at).toLocaleString()} · {v.row_count} rows · {v.column_count} cols
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => open(v.id, v.storage_path, v.name)}
                    disabled={opening === v.id}
                  >
                    {opening === v.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                    Open
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm(`Delete "${v.name}"?`)) {
                        del.mutate({ id: v.id, path: v.storage_path });
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
