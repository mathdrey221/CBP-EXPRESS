import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MapPin, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { VILLES } from "@/lib/cbp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/points-relais")({
  head: () => ({
    meta: [
      { title: "Points relais — CBP Express" },
      { name: "description", content: "Création et gestion des points relais CBP Express : adresse, téléphone, ville." },
      { property: "og:title", content: "Points relais — CBP Express" },
      { property: "og:description", content: "Administration du réseau de points relais CBP Express." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PointsRelais,
});

const VIDE = {
  nom: "",
  ville: VILLES[0] as string,
  adresse: "",
  telephone: "",
  email: "",
  latitude: "",
  longitude: "",
};

function PointsRelais() {
  const qc = useQueryClient();
  const [form, setForm] = useState(VIDE);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof VIDE, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const { data: points = [], isLoading } = useQuery({
    queryKey: ["points-relais"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("points_relais")
        .select("id,nom,ville,adresse,telephone,email,latitude,longitude,actif")
        .order("ville")
        .order("nom");
      if (error) throw error;
      return data ?? [];
    },
  });

  async function creer(e: React.FormEvent) {
    e.preventDefault();
    if (form.nom.trim().length < 2 || form.adresse.trim().length < 3) {
      toast.error("Nom et adresse requis");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("points_relais").insert({
      nom: form.nom.trim(),
      ville: form.ville,
      adresse: form.adresse.trim(),
      telephone: form.telephone.trim() || null,
      email: form.email.trim() || null,
      latitude: form.latitude ? Number(form.latitude) : null,
      longitude: form.longitude ? Number(form.longitude) : null,
      actif: true,
    });
    setBusy(false);
    if (error) {
      toast.error("Création impossible : " + error.message);
      return;
    }
    toast.success("Point relais ajouté");
    setForm(VIDE);
    void qc.invalidateQueries({ queryKey: ["points-relais"] });
  }

  async function basculer(id: string, actif: boolean) {
    const { error } = await supabase.from("points_relais").update({ actif }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    void qc.invalidateQueries({ queryKey: ["points-relais"] });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Points relais</h1>
        <p className="text-sm text-muted-foreground">
          Ajoutez vos points relais et leurs coordonnées : ils apparaissent dans le suivi client.
        </p>
      </div>

      <form onSubmit={creer} className="grid gap-4 rounded-xl border bg-card p-5 shadow-card sm:grid-cols-2">
        <div>
          <Label htmlFor="pr_nom">Nom du point relais</Label>
          <Input id="pr_nom" value={form.nom} onChange={(e) => set("nom", e.target.value)} required />
        </div>
        <div>
          <Label>Ville</Label>
          <Select value={form.ville} onValueChange={(v) => set("ville", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VILLES.map((v) => (
                <SelectItem key={v} value={v}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="pr_adresse">Adresse complète</Label>
          <Input id="pr_adresse" value={form.adresse} onChange={(e) => set("adresse", e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="pr_tel">Téléphone</Label>
          <Input id="pr_tel" value={form.telephone} onChange={(e) => set("telephone", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="pr_mail">Email</Label>
          <Input id="pr_mail" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="pr_lat">Latitude (optionnel)</Label>
          <Input id="pr_lat" value={form.latitude} onChange={(e) => set("latitude", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="pr_lng">Longitude (optionnel)</Label>
          <Input id="pr_lng" value={form.longitude} onChange={(e) => set("longitude", e.target.value)} />
        </div>
        <div className="flex items-end sm:col-span-2">
          <Button type="submit" disabled={busy} className="w-full sm:w-auto">
            <Plus className="size-4" /> {busy ? "Ajout…" : "Ajouter le point relais"}
          </Button>
        </div>
      </form>

      <div className="overflow-hidden rounded-xl border bg-card shadow-card">
        {isLoading && <p className="p-5 text-sm text-muted-foreground">Chargement…</p>}
        {!isLoading && points.length === 0 && (
          <p className="p-5 text-sm text-muted-foreground">Aucun point relais enregistré.</p>
        )}
        <div className="divide-y">
          {points.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-56">
                <p className="flex items-center gap-2 font-semibold">
                  <MapPin className="size-4 text-accent" /> {p.nom}
                </p>
                <p className="text-xs text-muted-foreground">
                  {p.ville} · {p.adresse}
                </p>
                <p className="text-xs text-muted-foreground">
                  {p.telephone ?? "—"} · {p.email ?? "—"}
                </p>
              </div>
              <Button variant={p.actif ? "secondary" : "default"} onClick={() => void basculer(p.id, !p.actif)}>
                {p.actif ? "Désactiver" : "Activer"}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
