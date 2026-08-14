import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Archive, ArchiveRestore, ArrowLeft, Camera, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StatutBadge } from "@/components/StatutBadge";
import { QrCode } from "@/components/QrCode";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MODES_PAIEMENT, STATUTS, STATUT_LABEL, formatDate, formatFCFA, trackingUrl, type Statut } from "@/lib/cbp";
import { notifierChangementStatut } from "@/lib/notify";
import { alerterOrigine, alerterTransfert } from "@/lib/alertes";
import { uploadPhotosColis, signedUrls } from "@/lib/photos";
import { CbpLogo } from "@/components/CbpLogo";

export const Route = createFileRoute("/_authenticated/colis/$id")({
  head: () => ({
    meta: [
      { title: "Détail colis — CBP Express" },
      { name: "description", content: "Fiche colis : QR code, historique des statuts, photo et encaissement." },
      { property: "og:title", content: "Détail colis — CBP Express" },
      { property: "og:description", content: "Suivi interne détaillé d'un colis CBP Express." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ColisDetail,
});

function ColisDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [apercu, setApercu] = useState<string | null>(null);

  const { data: colis, isLoading } = useQuery({
    queryKey: ["colis", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("colis").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: events = [] } = useQuery({
    queryKey: ["colis-events", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("colis_events")
        .select("id,statut,commentaire,created_at")
        .eq("colis_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: photos = [] } = useQuery({
    queryKey: ["colis-photos", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("colis_photos")
        .select("id,path,created_at")
        .eq("colis_id", id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      const urls = await signedUrls((data ?? []).map((p) => p.path));
      return (data ?? []).map((p, i) => ({ ...p, url: urls[i] ?? "" }));
    },
  });

  const { data: notifs = [] } = useQuery({
    queryKey: ["colis-notifs", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id,template,message,destinataire_tel,statut,created_at")
        .eq("colis_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  async function changerStatut(statut: Statut) {
    if (!colis) return;
    setBusy(true);
    const now = new Date().toISOString();
    const patch = {
      statut,
      ...(statut === "arrive_point_relais" ? { arrive_at: now } : {}),
      ...(statut === "retire" ? { retire_at: now, paye: true } : {}),
    };
    const { error } = await supabase.from("colis").update(patch).eq("id", id);
    if (!error) {
      const { data: user } = await supabase.auth.getUser();
      const uid = user.user?.id;
      await supabase.from("colis_events").insert({
        colis_id: id,
        statut,
        commentaire: `Statut mis à jour : ${STATUT_LABEL[statut]}`,
        ...(uid ? { auteur: uid } : {}),
      });

      let point: { nom: string; adresse: string; telephone: string | null } | undefined;
      if (colis.point_relais_id) {
        const { data: p } = await supabase
          .from("points_relais")
          .select("nom,adresse,telephone")
          .eq("id", colis.point_relais_id)
          .maybeSingle();
        point = p ?? undefined;
      }
      const msg = await notifierChangementStatut({ ...colis, statut } as never, statut, point as never);
      if (msg) setApercu(msg);

      try {
        if (statut === "en_transit") {
          await alerterTransfert(colis as never);
        } else if (statut === "arrive_point_relais") {
          await alerterOrigine(colis as never, "arrivé au point relais de destination");
        } else if (statut === "retire") {
          await alerterOrigine(colis as never, "retiré par le destinataire");
        } else if (statut === "retour_expediteur") {
          await alerterOrigine(colis as never, "retour vers l'expéditeur enclenché");
        }
      } catch {
        /* alerte interne optionnelle */
      }
    }
    setBusy(false);
    if (error) {
      toast.error("Mise à jour impossible : " + error.message);
      return;
    }
    toast.success("Statut mis à jour");
    void qc.invalidateQueries({ queryKey: ["colis", id] });
    void qc.invalidateQueries({ queryKey: ["colis-events", id] });
    void qc.invalidateQueries({ queryKey: ["colis-notifs", id] });
    void qc.invalidateQueries({ queryKey: ["colis"] });
  }

  async function majPaiement(mode: string) {
    const { error } = await supabase.from("colis").update({ mode_paiement: mode as never, paye: true }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Paiement enregistré");
    void qc.invalidateQueries({ queryKey: ["colis", id] });
  }

  async function ajouterPhotos(files: File[]) {
    if (files.length === 0) return;
    setBusy(true);
    try {
      await uploadPhotosColis(id, files);
      toast.success(files.length > 1 ? "Photos enregistrées" : "Photo enregistrée");
      void qc.invalidateQueries({ queryKey: ["colis-photos", id] });
      void qc.invalidateQueries({ queryKey: ["colis", id] });
    } catch (err) {
      toast.error("Upload impossible : " + (err instanceof Error ? err.message : ""));
    } finally {
      setBusy(false);
    }
  }

  async function basculerArchive(archive: boolean) {
    setBusy(true);
    const { error } = await supabase
      .from("colis")
      .update({ archive, archive_at: archive ? new Date().toISOString() : null })
      .eq("id", id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(archive ? "Colis archivé" : "Colis désarchivé");
    void qc.invalidateQueries({ queryKey: ["colis", id] });
    void qc.invalidateQueries({ queryKey: ["colis"] });
  }

  if (isLoading) return <p className="text-muted-foreground">Chargement…</p>;
  if (!colis) return <p className="text-muted-foreground">Colis introuvable.</p>;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link to="/colis">
          <ArrowLeft className="size-4" /> Retour aux colis
        </Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-mono text-2xl font-bold">{colis.numero_suivi}</h1>
          <p className="text-sm text-muted-foreground">Créé le {formatDate(colis.created_at)}</p>
        </div>
        <div className="flex items-center gap-3">
          {colis.archive && (
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">Archivé</span>
          )}
          <StatutBadge statut={colis.statut} className="text-sm" />
          <Button variant="secondary" size="sm" disabled={busy} onClick={() => void basculerArchive(!colis.archive)}>
            {colis.archive ? (
              <>
                <ArchiveRestore className="size-4" /> Désarchiver
              </>
            ) : (
              <>
                <Archive className="size-4" /> Archiver
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="grid gap-4 rounded-xl border bg-card p-5 shadow-card sm:grid-cols-2">
            <div>
              <h2 className="font-semibold">Expéditeur</h2>
              <p className="mt-1 text-sm">{colis.exp_nom}</p>
              <p className="text-sm text-muted-foreground">{colis.exp_tel}</p>
              <p className="text-sm text-muted-foreground">Dépôt : {colis.ville_depot}</p>
            </div>
            <div>
              <h2 className="font-semibold">Destinataire</h2>
              <p className="mt-1 text-sm">{colis.dest_nom}</p>
              <p className="text-sm text-muted-foreground">{colis.dest_tel}</p>
              <p className="text-sm text-muted-foreground">Retrait : {colis.ville_retrait}</p>
            </div>
            <div>
              <h2 className="font-semibold">Colis</h2>
              <p className="mt-1 text-sm">{colis.contenu || "Contenu non précisé"}</p>
              <p className="text-sm text-muted-foreground">{colis.poids ? `${colis.poids} kg` : "Poids non précisé"}</p>
            </div>
            <div>
              <h2 className="font-semibold">Montants</h2>
              <p className="mt-1 text-sm">Livraison : {formatFCFA(colis.frais_livraison)}</p>
              <p className="text-sm">À encaisser : {formatFCFA(colis.montant)}</p>
              <p className="text-sm text-muted-foreground">{colis.paye ? "Payé" : "Non payé"}</p>
            </div>
          </section>

          <section className="rounded-xl border bg-card p-5 shadow-card">
            <h2 className="font-semibold">Actions</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Changer le statut</Label>
                <Select value={colis.statut} onValueChange={(v) => void changerStatut(v as Statut)} disabled={busy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUTS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUT_LABEL[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Mode de paiement</Label>
                <Select value={colis.mode_paiement ?? ""} onValueChange={(v) => void majPaiement(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Non défini" />
                  </SelectTrigger>
                  <SelectContent>
                    {MODES_PAIEMENT.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="photo">Photos du colis</Label>
                <div className="mt-1 flex items-center gap-3">
                  <input
                    id="photo"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    className="text-sm"
                    disabled={busy}
                    onChange={(e) => {
                      void ajouterPhotos(Array.from(e.target.files ?? []));
                      e.target.value = "";
                    }}
                  />
                  <Camera className="size-4 text-muted-foreground" />
                </div>
                {photos.length === 0 ? (
                  <p className="mt-2 text-xs text-muted-foreground">Aucune photo enregistrée.</p>
                ) : (
                  <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {photos.map((p) => (
                      <a key={p.id} href={p.url} target="_blank" rel="noreferrer">
                        <img
                          src={p.url}
                          alt={`Photo du colis ${colis.numero_suivi}`}
                          className="aspect-square w-full rounded-lg border object-cover"
                          loading="lazy"
                        />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {apercu && (
            <section className="rounded-xl border bg-card p-5 shadow-card">
              <h2 className="flex items-center gap-2 font-semibold">
                <Send className="size-4 text-accent" /> Message client généré
              </h2>
              <pre className="mt-3 rounded-lg bg-secondary p-4 text-xs whitespace-pre-wrap">{apercu}</pre>
            </section>
          )}

          <section className="rounded-xl border bg-card p-5 shadow-card">
            <h2 className="font-semibold">Historique</h2>
            <ol className="mt-4 space-y-3">
              {events.length === 0 && <p className="text-sm text-muted-foreground">Aucun événement enregistré.</p>}
              {events.map((e) => (
                <li key={e.id} className="flex items-start gap-3">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-accent" />
                  <div>
                    <p className="text-sm font-medium">{STATUT_LABEL[e.statut as Statut] ?? e.statut}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(e.created_at)} {e.commentaire ? `· ${e.commentaire}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-xl border bg-card p-5 shadow-card">
            <h2 className="font-semibold">Notifications envoyées</h2>
            <div className="mt-4 space-y-3">
              {notifs.length === 0 && <p className="text-sm text-muted-foreground">Aucune notification.</p>}
              {notifs.map((n) => (
                <div key={n.id} className="rounded-lg bg-secondary p-3">
                  <p className="text-xs font-semibold">
                    {n.template} → {n.destinataire_tel} · {n.statut}
                  </p>
                  <pre className="mt-1 text-xs whitespace-pre-wrap">{n.message}</pre>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <div className="rounded-xl border bg-card p-5 text-center shadow-card">
            <CbpLogo className="justify-center" />
            <h2 className="mt-4 font-semibold">Étiquette colis</h2>
            <p className="font-mono text-sm font-bold">{colis.numero_suivi}</p>
            <div className="mt-4 flex justify-center">
              <QrCode value={colis.numero_suivi} size={180} />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {colis.ville_depot} → {colis.ville_retrait}
            </p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{trackingUrl(colis.numero_suivi)}</p>
            <Button variant="secondary" className="mt-4 w-full" onClick={() => window.print()}>
              Imprimer l'étiquette
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
