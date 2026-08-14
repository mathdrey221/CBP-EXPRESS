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