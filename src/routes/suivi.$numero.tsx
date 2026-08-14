import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Phone, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CbpLogo } from "@/components/CbpLogo";
import { StatutBadge } from "@/components/StatutBadge";
import { Button } from "@/components/ui/button";
import { STATUTS, STATUT_LABEL, formatDate, formatFCFA, type Statut } from "@/lib/cbp";

export const Route = createFileRoute("/suivi/$numero")({
  head: ({ params }) => ({
    meta: [
      { title: `Suivi ${params.numero} — CBP Express` },
      { name: "description", content: `Statut en temps réel du colis ${params.numero} chez CBP Express.` },
      { property: "og:title", content: `Suivi ${params.numero} — CBP Express` },
      { property: "og:description", content: "Suivez votre colis CBP Express entre Cotonou, Bohicon et Parakou." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Suivi,
});

const ETAPES: Statut[] = ["depose", "en_transit", "arrive_point_relais", "retire"];

function Suivi() {
  const { numero } = Route.useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["suivi", numero],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("suivi_public", { _numero: numero });
      if (error) throw error;
      return (data as unknown[])[0] as Record<string, never> | undefined;
    },
  });

  const colis = data as
    | {
        numero_suivi: string;
        statut: Statut;
        ville_depot: string;
        ville_retrait: string;
        montant: number;
        dest_nom: string;
        exp_nom: string;
        created_at: string;
        arrive_at: string | null;
        retire_at: string | null;
        point_nom: string | null;
        point_adresse: string | null;
        point_ville: string | null;
        point_tel: string | null;
      }
    | undefined;

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5">
        <Link to="/">
          <CbpLogo />
        </Link>
        <Button asChild variant="ghost" size="sm">
          <Link to="/">
            <ArrowLeft className="size-4" /> Accueil
          </Link>
        </Button>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-16">
        <h1 className="text-2xl font-bold">Suivi du colis</h1>
        <p className="font-mono text-sm text-muted-foreground">{numero}</p>

        {isLoading && <p className="mt-8 text-muted-foreground">Recherche en cours…</p>}

        {!isLoading && !colis && (
          <div className="mt-8 rounded-xl border bg-card p-6 shadow-card">
            <p className="font-semibold">Aucun colis trouvé avec ce numéro.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Vérifiez le format : CBP-AAAAMMJJ-XXX. En cas de doute, contactez votre point relais.
            </p>
            <Button asChild className="mt-4">
              <Link to="/">Nouvelle recherche</Link>
            </Button>
          </div>
        )}

        {colis && (
          <div className="mt-6 space-y-6">
            <div className="rounded-xl border bg-card p-6 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <StatutBadge statut={colis.statut} className="text-sm" />
                <span className="text-sm text-muted-foreground">Déposé le {formatDate(colis.created_at)}</span>
              </div>

              <ol className="mt-6 space-y-4">
                {ETAPES.map((e) => {
                  const idx = STATUTS.indexOf(colis.statut);
                  const done = STATUTS.indexOf(e) <= idx;
                  return (
                    <li key={e} className="flex items-start gap-3">
                      <span
                        className={`mt-1 size-3 shrink-0 rounded-full ${done ? "bg-accent" : "bg-muted-foreground/30"}`}
                      />
                      <div>
                        <p className={`text-sm font-medium ${done ? "" : "text-muted-foreground"}`}>
                          {STATUT_LABEL[e]}
                        </p>
                        {e === "arrive_point_relais" && colis.arrive_at && (
                          <p className="text-xs text-muted-foreground">{formatDate(colis.arrive_at)}</p>
                        )}
                        {e === "retire" && colis.retire_at && (
                          <p className="text-xs text-muted-foreground">{formatDate(colis.retire_at)}</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border bg-card p-5 shadow-card">
                <h2 className="font-semibold">Trajet</h2>
                <p className="mt-2 text-sm">
                  {colis.ville_depot} → <span className="font-semibold">{colis.ville_retrait}</span>
                </p>
                <p className="mt-3 text-sm text-muted-foreground">Montant à payer au retrait</p>
                <p className="text-2xl font-extrabold text-primary">{formatFCFA(colis.montant)}</p>
              </div>

              <div className="rounded-xl border bg-card p-5 shadow-card">
                <h2 className="font-semibold">Point de retrait</h2>
                <p className="mt-2 text-sm font-medium">{colis.point_nom ?? "À confirmer"}</p>
                {colis.point_adresse && (
                  <p className="mt-1 flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-accent" /> {colis.point_adresse}
                  </p>
                )}
                {colis.point_tel && (
                  <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="size-4 text-accent" /> {colis.point_tel}
                  </p>
                )}
                <p className="mt-3 text-xs text-muted-foreground">
                  Horaires : Lun-Sam 8h-18h · Carte d'identité obligatoire
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
