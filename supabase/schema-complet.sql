-- ============================================================
-- CBP Express — schéma complet à exécuter dans le SQL Editor
-- de VOTRE projet Supabase (une seule fois, dans cet ordre).
-- ============================================================

-- Bucket photos de colis
INSERT INTO storage.buckets (id, name, public) VALUES ('colis-photos','colis-photos',false) ON CONFLICT (id) DO NOTHING;

-- ---------- 20260808232807_52fda7c0-2a93-4faa-88fd-9e40ea1b2a62.sql ----------
-- ENUMS
CREATE TYPE public.app_role AS ENUM ('admin','agent','comptable');
CREATE TYPE public.colis_statut AS ENUM ('en_attente_depot','depose','en_transit','arrive_point_relais','notifie_client','retire','retour_expediteur');
CREATE TYPE public.mode_paiement AS ENUM ('especes','mtn_momo','moov_money');
CREATE TYPE public.canal_notif AS ENUM ('whatsapp','sms');

-- POINTS RELAIS
CREATE TABLE public.points_relais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  ville text NOT NULL,
  adresse text NOT NULL,
  telephone text,
  latitude double precision,
  longitude double precision,
  actif boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.points_relais TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.points_relais TO authenticated;
GRANT ALL ON public.points_relais TO service_role;
ALTER TABLE public.points_relais ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  telephone text,
  point_relais_id uuid REFERENCES public.points_relais(id) ON DELETE SET NULL,
  ville text,
  actif boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- USER ROLES
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_actif(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND actif = true);
$$;

CREATE OR REPLACE FUNCTION public.my_ville(_user_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT ville FROM public.profiles WHERE id = _user_id;
$$;

-- TARIFS
CREATE TABLE public.tarifs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ville_depart text NOT NULL,
  ville_arrivee text NOT NULL,
  prix integer NOT NULL,
  UNIQUE (ville_depart, ville_arrivee)
);
GRANT SELECT ON public.tarifs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tarifs TO authenticated;
GRANT ALL ON public.tarifs TO service_role;
ALTER TABLE public.tarifs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tarifs publics" ON public.tarifs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin gere tarifs" ON public.tarifs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- COLIS
CREATE TABLE public.colis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_suivi text NOT NULL UNIQUE,
  exp_nom text NOT NULL,
  exp_prenom text,
  exp_tel text NOT NULL,
  exp_ville text NOT NULL,
  dest_nom text NOT NULL,
  dest_prenom text,
  dest_tel text NOT NULL,
  dest_ville text NOT NULL,
  contenu text,
  poids numeric,
  montant integer NOT NULL DEFAULT 0,
  frais_livraison integer NOT NULL DEFAULT 0,
  ville_depot text NOT NULL,
  ville_retrait text NOT NULL,
  point_relais_id uuid REFERENCES public.points_relais(id) ON DELETE SET NULL,
  statut public.colis_statut NOT NULL DEFAULT 'depose',
  mode_paiement public.mode_paiement,
  paye boolean NOT NULL DEFAULT false,
  reverse boolean NOT NULL DEFAULT false,
  photo_url text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'agent',
  arrive_at timestamptz,
  retire_at timestamptz,
  relance_envoyee boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX colis_statut_idx ON public.colis(statut);
CREATE INDEX colis_created_idx ON public.colis(created_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.colis TO authenticated;
GRANT ALL ON public.colis TO service_role;
ALTER TABLE public.colis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff lit colis" ON public.colis FOR SELECT TO authenticated
  USING (public.is_actif(auth.uid()) AND (
    public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'comptable')
    OR (public.has_role(auth.uid(),'agent') AND (ville_depot = public.my_ville(auth.uid()) OR ville_retrait = public.my_ville(auth.uid())))
  ));
CREATE POLICY "Staff cree colis" ON public.colis FOR INSERT TO authenticated
  WITH CHECK (public.is_actif(auth.uid()) AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'agent')));
CREATE POLICY "Staff modifie colis" ON public.colis FOR UPDATE TO authenticated
  USING (public.is_actif(auth.uid()) AND (
    public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'comptable')
    OR (public.has_role(auth.uid(),'agent') AND (ville_depot = public.my_ville(auth.uid()) OR ville_retrait = public.my_ville(auth.uid())))
  ));
CREATE POLICY "Admin supprime colis" ON public.colis FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- HISTORIQUE
CREATE TABLE public.colis_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colis_id uuid NOT NULL REFERENCES public.colis(id) ON DELETE CASCADE,
  statut public.colis_statut NOT NULL,
  commentaire text,
  auteur uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.colis_events TO authenticated;
GRANT ALL ON public.colis_events TO service_role;
ALTER TABLE public.colis_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff lit events" ON public.colis_events FOR SELECT TO authenticated USING (public.is_actif(auth.uid()));
CREATE POLICY "Staff cree events" ON public.colis_events FOR INSERT TO authenticated WITH CHECK (public.is_actif(auth.uid()));

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colis_id uuid REFERENCES public.colis(id) ON DELETE CASCADE,
  destinataire_tel text NOT NULL,
  canal public.canal_notif NOT NULL DEFAULT 'whatsapp',
  template text NOT NULL,
  message text NOT NULL,
  statut text NOT NULL DEFAULT 'simule',
  erreur text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff lit notifs" ON public.notifications FOR SELECT TO authenticated USING (public.is_actif(auth.uid()));
CREATE POLICY "Staff cree notifs" ON public.notifications FOR INSERT TO authenticated WITH CHECK (public.is_actif(auth.uid()));

-- REVERSEMENTS
CREATE TABLE public.reversements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  marchand_nom text NOT NULL,
  marchand_tel text NOT NULL,
  montant integer NOT NULL,
  moyen text NOT NULL DEFAULT 'MTN MoMo',
  periode_debut date NOT NULL,
  periode_fin date NOT NULL,
  nb_colis integer NOT NULL DEFAULT 0,
  effectue boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reversements TO authenticated;
GRANT ALL ON public.reversements TO service_role;
ALTER TABLE public.reversements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Compta gere reversements" ON public.reversements FOR ALL TO authenticated
  USING (public.is_actif(auth.uid()) AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'comptable')))
  WITH CHECK (public.is_actif(auth.uid()) AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'comptable')));

-- WHATSAPP
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telephone text NOT NULL UNIQUE,
  nom text,
  mode text NOT NULL DEFAULT 'ia',
  dernier_message text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff gere conversations" ON public.conversations FOR ALL TO authenticated
  USING (public.is_actif(auth.uid())) WITH CHECK (public.is_actif(auth.uid()));

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff gere messages" ON public.messages FOR ALL TO authenticated
  USING (public.is_actif(auth.uid())) WITH CHECK (public.is_actif(auth.uid()));

CREATE TABLE public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE SET NULL,
  telephone text NOT NULL,
  sujet text NOT NULL,
  priorite text NOT NULL DEFAULT 'urgent',
  statut text NOT NULL DEFAULT 'ouvert',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.tickets TO authenticated;
GRANT ALL ON public.tickets TO service_role;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff gere tickets" ON public.tickets FOR ALL TO authenticated
  USING (public.is_actif(auth.uid())) WITH CHECK (public.is_actif(auth.uid()));

-- POLICIES PROFILES / ROLES / POINTS
CREATE POLICY "Voir son profil" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Creer son profil" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Maj profil" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Voir ses roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Points relais publics" ON public.points_relais FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin gere points" ON public.points_relais FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- TRIGGERS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, telephone, ville)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name',''), NEW.raw_user_meta_data->>'telephone', NEW.raw_user_meta_data->>'ville')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER colis_touch BEFORE UPDATE ON public.colis
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- NUMERO DE SUIVI
CREATE OR REPLACE FUNCTION public.generer_numero_suivi()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE d text; n integer; BEGIN
  d := to_char(now() AT TIME ZONE 'UTC', 'YYYYMMDD');
  SELECT COUNT(*) + 1 INTO n FROM public.colis WHERE numero_suivi LIKE 'CBP-' || d || '-%';
  RETURN 'CBP-' || d || '-' || lpad(n::text, 3, '0');
END; $$;
GRANT EXECUTE ON FUNCTION public.generer_numero_suivi() TO anon, authenticated;

-- SUIVI PUBLIC
CREATE OR REPLACE FUNCTION public.suivi_public(_numero text)
RETURNS TABLE (
  numero_suivi text, statut public.colis_statut, ville_depot text, ville_retrait text,
  montant integer, dest_nom text, exp_nom text, created_at timestamptz, arrive_at timestamptz, retire_at timestamptz,
  point_nom text, point_adresse text, point_ville text, point_tel text, point_lat double precision, point_lng double precision
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.numero_suivi, c.statut, c.ville_depot, c.ville_retrait, c.montant,
         c.dest_nom, c.exp_nom, c.created_at, c.arrive_at, c.retire_at,
         p.nom, p.adresse, p.ville, p.telephone, p.latitude, p.longitude
  FROM public.colis c LEFT JOIN public.points_relais p ON p.id = c.point_relais_id
  WHERE upper(c.numero_suivi) = upper(trim(_numero));
$$;
GRANT EXECUTE ON FUNCTION public.suivi_public(text) TO anon, authenticated;

-- CREATION ENVOI PUBLIC
CREATE OR REPLACE FUNCTION public.creer_envoi_public(
  _exp_nom text, _exp_tel text, _exp_ville text,
  _dest_nom text, _dest_tel text, _dest_ville text,
  _contenu text, _montant integer
) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE num text; BEGIN
  IF length(trim(_exp_nom)) = 0 OR length(trim(_exp_tel)) < 8 OR length(trim(_dest_nom)) = 0 OR length(trim(_dest_tel)) < 8 THEN
    RAISE EXCEPTION 'Informations invalides';
  END IF;
  num := public.generer_numero_suivi();
  INSERT INTO public.colis (numero_suivi, exp_nom, exp_tel, exp_ville, dest_nom, dest_tel, dest_ville,
    contenu, montant, ville_depot, ville_retrait, statut, source)
  VALUES (num, left(trim(_exp_nom),100), left(trim(_exp_tel),20), _exp_ville, left(trim(_dest_nom),100), left(trim(_dest_tel),20), _dest_ville,
    left(coalesce(_contenu,''),300), greatest(coalesce(_montant,0),0), _exp_ville, _dest_ville, 'en_attente_depot', 'client');
  RETURN num;
END; $$;
GRANT EXECUTE ON FUNCTION public.creer_envoi_public(text,text,text,text,text,text,text,integer) TO anon, authenticated;

-- SEED
INSERT INTO public.points_relais (nom, ville, adresse, telephone, latitude, longitude) VALUES
 ('CBP Cotonou Centre','Cotonou','Carrefour Saint Michel, Cotonou','+229 01 97 00 00 01', 6.3703, 2.3912),
 ('CBP Cotonou Godomey','Cotonou','Carrefour Godomey, Abomey-Calavi','+229 01 97 00 00 02', 6.3833, 2.3333),
 ('CBP Bohicon Gare','Bohicon','Quartier Gare, Bohicon','+229 01 97 00 00 03', 7.1783, 2.0667),
 ('CBP Parakou Arzeke','Parakou','Marché Arzèkè, Parakou','+229 01 97 00 00 04', 9.3372, 2.6303);

INSERT INTO public.tarifs (ville_depart, ville_arrivee, prix) VALUES
 ('Cotonou','Cotonou',1000),('Cotonou','Bohicon',1500),('Cotonou','Parakou',2000),
 ('Bohicon','Cotonou',1500),('Bohicon','Parakou',1500),('Bohicon','Bohicon',1000),
 ('Parakou','Cotonou',2000),('Parakou','Bohicon',1500),('Parakou','Parakou',1000);

-- ---------- 20260808232855_57b2b5e4-0479-41c7-aaa2-6678a2441df3.sql ----------
CREATE POLICY "Staff lit photos colis" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'colis-photos' AND public.is_actif(auth.uid()));
CREATE POLICY "Staff upload photos colis" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'colis-photos' AND public.is_actif(auth.uid()));
CREATE POLICY "Staff maj photos colis" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'colis-photos' AND public.is_actif(auth.uid()));

-- ---------- 20260809005408_07dd4a38-4b3b-4b6f-a271-733d34f30d4e.sql ----------
DROP FUNCTION IF EXISTS public.creer_envoi_public(text,text,text,text,text,text,text,integer);

-- Admin principal auto-provisionné
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, telephone, ville, actif)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name',''),
    NEW.raw_user_meta_data->>'telephone',
    NEW.raw_user_meta_data->>'ville',
    lower(NEW.email) = 'mathdrey221@gmail.com'
  )
  ON CONFLICT (id) DO NOTHING;

  IF lower(NEW.email) = 'mathdrey221@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;

-- Les admins gèrent les rôles
CREATE POLICY "Admin gere roles" ON public.user_roles
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;

-- ---------- 20260812192710_11dd42d0-21fc-4bb8-8754-2786c736a431.sql ----------
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

-- ---------- 20260813010652_fdf4c02b-054c-4a3f-80f3-400fb32aa961.sql ----------
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

