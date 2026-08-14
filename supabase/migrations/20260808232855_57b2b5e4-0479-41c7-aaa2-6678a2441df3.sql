CREATE POLICY "Staff lit photos colis" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'colis-photos' AND public.is_actif(auth.uid()));
CREATE POLICY "Staff upload photos colis" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'colis-photos' AND public.is_actif(auth.uid()));
CREATE POLICY "Staff maj photos colis" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'colis-photos' AND public.is_actif(auth.uid()));