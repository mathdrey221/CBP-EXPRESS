import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Camera, PackagePlus, Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StatutBadge } from "@/components/StatutBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STATUTS, STATUT_LABEL, VILLES, formatDate, formatFCFA, type Statut } from "@/lib/cbp";
import { notifierChangementStatut } from "@/lib/notify";
import { alerterTransfert } from "@/lib/alertes";
import { uploadPhotosColis } from "@/lib/photos";

export const Route = createFileRoute("/_authenticated/colis/")({
  head: () => ({
    meta: [
      { title: "Colis — CBP Express" },
      { name: "description", content: "Liste, filtres et création des colis du réseau CBP Express." },
      { property: "og:title", content: "Colis — CBP Express" },
      { property: "og:description", content: "Gestion des colis déposés, en transit et retirés." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ColisListe,
});

type Row = {
  id: string;
  numero_suivi: string;
  statut: Statut;
  ville_depot: string;
  ville_retrait: string;
  montant: number;
  frais_livraison: number;
  exp_nom: string;
  exp_tel: string;
  dest_nom: string;
  dest_tel: string;
  created_at: string;
  archive: boolean;
};

const schema = z.object({
  exp_nom: z.string().trim().min(2).max(100),
  exp_tel: z.string().trim().min(8).max(20),
  dest_nom: z.string().trim().min(2).max(100),
  dest_tel: z.string().trim().min(8).max(20),
  ville_depot: z.string().min(1),
  ville_retrait: z.string().min(1),
  contenu: z.string().trim().max(300),
  poids: z.coerce.number().min(0).max(500),
  montant: z.coerce.number().min(0).max(5_000_000),
  frais_livraison: z.coerce.number().min(0).max(1_000_000),
});

const VIDE = {
  exp_nom: "",
  exp_tel: "",
  dest_nom: "",
  dest_tel: "",
  ville_depot: "Cotonou",
  ville_retrait: "Bohicon",
  contenu: "",
  poids: "0",
  montant: "0",
  frais_livraison: "1500",
};

function ColisListe() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [statut, setStatut] = useState<string>("tous");
  const [vue, setVue] = useState<"actifs" | "archives">("actifs");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(VIDE);
  const [photos, setPhotos] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof VIDE, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const { data: colis = [], isLoading } = useQuery({
    queryKey: ["colis"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("colis")
        .select(
          "id,numero_suivi,statut,ville_depot,ville_retrait,montant,frais_livraison,exp_nom,exp_tel,dest_nom,dest_tel,created_at,archive",
        )
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const filtres = colis.filter((c) => {
    const okVue = vue === "archives" ? c.archive : !c.archive;
    if (!okVue) return false;
    const okStatut = statut === "tous" || c.statut === statut;
    const t = q.trim().toLowerCase();
    const okQ =
      !t ||
      c.numero_suivi.toLowerCase().includes(t) ||
      c.dest_nom.toLowerCase().includes(t) ||
      c.exp_nom.toLowerCase().includes(t) ||
      c.dest_tel.includes(t);
    return okStatut && okQ;
  });

  async function creer(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Formulaire invalide");
      return;
    }
    if (photos.length === 0) {
      toast.error("Au moins une photo du colis est obligatoire");
      return;
    }
    setBusy(true);
    const v = parsed.data;
    const { data: numero, error: errNum } = await supabase.rpc("generer_numero_suivi");
    if (errNum || !numero) {
      setBusy(false);
      toast.error("Numéro de suivi indisponible : " + (errNum?.message ?? ""));
      return;
    }
    const { data: user } = await supabase.auth.getUser();
    const { data: inserted, error } = await supabase
      .from("colis")
      .insert({
        numero_suivi: numero as string,
        exp_nom: v.exp_nom,
        exp_tel: v.exp_tel,
        exp_ville: v.ville_depot,
        dest_nom: v.dest_nom,
        dest_tel: v.dest_tel,
        dest_ville: v.ville_retrait,
        ville_depot: v.ville_depot,
        ville_retrait: v.ville_retrait,
        contenu: v.contenu,
        poids: v.poids,
        montant: v.montant,
        frais_livraison: v.frais_livraison,
        statut: "depose",
        source: "agent",
        created_by: user.user?.id ?? null,
      })
      .select("id,numero_suivi,exp_nom,exp_tel,dest_nom,dest_tel,ville_depot,ville_retrait,montant")
      .single();
    if (error) {
      setBusy(false);
      toast.error("Création impossible : " + error.message);
      return;
    }
    try {
      await uploadPhotosColis(inserted.id, photos);
    } catch (err) {
      toast.error("Photos non enregistrées : " + (err instanceof Error ? err.message : ""));
    }
    setBusy(false);
    try {
      await notifierChangementStatut(inserted as never, "depose");
    } catch {
      /* la notification est optionnelle */
    }
    try {
      await alerterTransfert(inserted as never);
    } catch {
      /* alerte interne optionnelle */
    }
    toast.success(`Colis ${inserted.numero_suivi} créé`);
    setForm(VIDE);
    setPhotos([]);
    setOpen(false);
    void qc.invalidateQueries({ queryKey: ["colis"] });
    void qc.invalidateQueries({ queryKey: ["colis-dashboard"] });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Colis</h1>
          <p className="text-sm text-muted-foreground">{filtres.length} colis affichés</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <PackagePlus className="size-4" /> Nouveau colis
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Bordereau de dépôt</DialogTitle>
            </DialogHeader>
            <form onSubmit={creer} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="c_exp_nom">Expéditeur</Label>
                  <Input id="c_exp_nom" value={form.exp_nom} onChange={(e) => set("exp_nom", e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="c_exp_tel">Téléphone expéditeur</Label>
                  <Input id="c_exp_tel" value={form.exp_tel} onChange={(e) => set("exp_tel", e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="c_dest_nom">Destinataire</Label>
                  <Input
                    id="c_dest_nom"
                    value={form.dest_nom}
                    onChange={(e) => set("dest_nom", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="c_dest_tel">Téléphone destinataire</Label>
                  <Input
                    id="c_dest_tel"
                    value={form.dest_tel}
                    onChange={(e) => set("dest_tel", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>Ville de dépôt</Label>
                  <Select value={form.ville_depot} onValueChange={(v) => set("ville_depot", v)}>
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
                <div>
                  <Label>Ville de retrait</Label>
                  <Select value={form.ville_retrait} onValueChange={(v) => set("ville_retrait", v)}>
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
                <div>
                  <Label htmlFor="c_poids">Poids (kg)</Label>
                  <Input
                    id="c_poids"
                    type="number"
                    step="0.1"
                    min={0}
                    value={form.poids}
                    onChange={(e) => set("poids", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="c_frais">Frais de livraison (FCFA)</Label>
                  <Input
                    id="c_frais"
                    type="number"
                    min={0}
                    value={form.frais_livraison}
                    onChange={(e) => set("frais_livraison", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="c_montant">Montant à encaisser (FCFA)</Label>
                  <Input
                    id="c_montant"
                    type="number"
                    min={0}
                    value={form.montant}
                    onChange={(e) => set("montant", e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="c_contenu">Contenu</Label>
                  <Textarea id="c_contenu" value={form.contenu} onChange={(e) => set("contenu", e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="c_photos">Photos du colis (obligatoire)</Label>
                  <div className="mt-1 flex items-center gap-3">
                    <input
                      id="c_photos"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      multiple
                      className="text-sm"
                      onChange={(e) => setPhotos((prev) => [...prev, ...Array.from(e.target.files ?? [])])}
                    />
                    <Camera className="size-4 text-muted-foreground" />
                  </div>
                  {photos.length === 0 ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Prenez au moins une photo du colis avant validation.
                    </p>
                  ) : (
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {photos.map((f, i) => (
                        <li
                          key={`${f.name}-${i}`}
                          className="flex items-center gap-2 rounded-lg bg-secondary px-2 py-1 text-xs"
                        >
                          {f.name}
                          <button
                            type="button"
                            aria-label={`Retirer ${f.name}`}
                            onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                          >
                            <X className="size-3" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Création…" : "Créer le colis"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Numéro, nom ou téléphone…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Select value={statut} onValueChange={setStatut}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Tous les statuts</SelectItem>
            {STATUTS.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUT_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={vue} onValueChange={(v) => setVue(v as "actifs" | "archives")}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="actifs">Colis actifs</SelectItem>
            <SelectItem value="archives">Colis archivés</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-card">
        {isLoading && <p className="p-5 text-sm text-muted-foreground">Chargement…</p>}
        {!isLoading && filtres.length === 0 && (
          <p className="p-5 text-sm text-muted-foreground">Aucun colis ne correspond à ces critères.</p>
        )}
        <div className="divide-y">
          {filtres.map((c) => (
            <Link
              key={c.id}
              to="/colis/$id"
              params={{ id: c.id }}
              className="flex flex-wrap items-center justify-between gap-3 p-4 transition-colors hover:bg-muted/50"
            >
              <div className="min-w-48">
                <p className="font-mono text-sm font-semibold">{c.numero_suivi}</p>
                <p className="text-xs text-muted-foreground">
                  {c.exp_nom} → {c.dest_nom} · {c.dest_tel}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                {c.ville_depot} → {c.ville_retrait} · {formatDate(c.created_at)}
              </p>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold">{formatFCFA(c.frais_livraison)}</span>
                <StatutBadge statut={c.statut} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
