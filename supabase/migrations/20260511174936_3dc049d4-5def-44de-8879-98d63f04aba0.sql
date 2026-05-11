-- visualisations table
CREATE TABLE public.visualisations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  row_count INTEGER NOT NULL DEFAULT 0,
  column_count INTEGER NOT NULL DEFAULT 0,
  summary TEXT,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.visualisations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own visualisations"
  ON public.visualisations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own visualisations"
  ON public.visualisations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own visualisations"
  ON public.visualisations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own visualisations"
  ON public.visualisations FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_visualisations_user_created ON public.visualisations(user_id, created_at DESC);

-- datasets storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('datasets', 'datasets', false);

CREATE POLICY "Users read own dataset files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'datasets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload own dataset files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'datasets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own dataset files"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'datasets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own dataset files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'datasets' AND auth.uid()::text = (storage.foldername(name))[1]);