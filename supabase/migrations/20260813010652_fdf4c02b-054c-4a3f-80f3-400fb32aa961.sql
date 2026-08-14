CREATE TABLE public.colis_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colis_id uuid NOT NULL REFERENCES public.colis(id) ON DELETE CASCADE,
  path text NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.colis_photos TO authenticated;
GRANT ALL ON public.colis_photos TO service_role;

ALTER TABLE public.colis_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff lit photos" ON public.colis_photos
  FOR SELECT TO authenticated USING (is_actif(auth.uid()));
CREATE POLICY "Staff ajoute photos" ON public.colis_photos
  FOR INSERT TO authenticated WITH CHECK (is_actif(auth.uid()));
CREATE POLICY "Admin supprime photos" ON public.colis_photos
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX colis_photos_colis_id_idx ON public.colis_photos(colis_id);

ALTER TABLE public.points_relais ADD COLUMN IF NOT EXISTS email text;