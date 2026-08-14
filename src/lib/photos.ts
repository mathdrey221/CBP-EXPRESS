import { supabase } from "@/integrations/supabase/client";

/** Envoie une ou plusieurs photos dans le bucket privé et les rattache au colis. */
export async function uploadPhotosColis(colisId: string, files: File[]): Promise<string[]> {
  const paths: string[] = [];
  for (const file of files) {
    const safe = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
    const path = `${colisId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`;
    const { error } = await supabase.storage.from("colis-photos").upload(path, file, { upsert: true });
    if (error) throw new Error(error.message);
    paths.push(path);
  }
  if (paths.length === 0) return paths;

  const { data: user } = await supabase.auth.getUser();
  const { error: insErr } = await supabase
    .from("colis_photos")
    .insert(paths.map((path) => ({ colis_id: colisId, path, created_by: user.user?.id ?? null })));
  if (insErr) throw new Error(insErr.message);

  const { data: existant } = await supabase.from("colis").select("photo_url").eq("id", colisId).maybeSingle();
  if (!existant?.photo_url) {
    await supabase.from("colis").update({ photo_url: paths[0] ?? null }).eq("id", colisId);
  }
  return paths;
}

/** URLs signées (bucket privé) pour afficher les photos. */
export async function signedUrls(paths: string[]): Promise<string[]> {
  if (paths.length === 0) return [];
  const { data, error } = await supabase.storage.from("colis-photos").createSignedUrls(paths, 3600);
  if (error) throw new Error(error.message);
  return (data ?? []).map((d) => d.signedUrl).filter((u): u is string => Boolean(u));
}
