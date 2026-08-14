ALTER TABLE public.colis
  ADD COLUMN IF NOT EXISTS archive boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS archive_at timestamp with time zone;

CREATE TABLE public.alertes_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colis_id uuid REFERENCES public.colis(id) ON DELETE CASCADE,
  ville text NOT NULL,
  ville_origine text,
  type text NOT NULL DEFAULT 'transfert',
  message text NOT NULL,
  lu boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.alertes_agents TO authenticated;
GRANT ALL ON public.alertes_agents TO service_role;

ALTER TABLE public.alertes_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff cree alertes" ON public.alertes_agents
  FOR INSERT TO authenticated
  WITH CHECK (is_actif(auth.uid()));

CREATE POLICY "Staff lit alertes" ON public.alertes_agents
  FOR SELECT TO authenticated
  USING (
    is_actif(auth.uid()) AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'comptable'::app_role)
      OR ville = my_ville(auth.uid())
      OR ville_origine = my_ville(auth.uid())
    )
  );

CREATE POLICY "Staff marque alertes lues" ON public.alertes_agents
  FOR UPDATE TO authenticated
  USING (
    is_actif(auth.uid()) AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR ville = my_ville(auth.uid())
      OR ville_origine = my_ville(auth.uid())
    )
  )
  WITH CHECK (
    is_actif(auth.uid()) AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR ville = my_ville(auth.uid())
      OR ville_origine = my_ville(auth.uid())
    )
  );

CREATE INDEX idx_alertes_agents_ville ON public.alertes_agents(ville, lu);