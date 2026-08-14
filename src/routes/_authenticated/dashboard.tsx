import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Package, Truck, Wallet, Users, ArrowUpRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCbpAuth } from "@/hooks/useCbpAuth";
import { CarteBenin } from "@/components/CarteBenin";
import { AlertesAgents } from "@/components/AlertesAgents";
import { StatutBadge } from "@/components/StatutBadge";
import { Button } from "@/components/ui/button";
import { formatDate, formatFCFA, VILLES, type Statut } from "@/lib/cbp";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Tableau de bord — CBP Express" },
      { name: "description", content: "KPI colis, chiffre d'affaires et activité par ville du réseau CBP Express." },
      { property: "og:title", content: "Tableau de bord — CBP Express" },
      { property: "og:description", content: "Pilotage des colis et des encaissements CBP Express." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

type ColisRow = {
  id: string;
  numero_suivi: string;
  statut: Statut;
  ville_depot: string;
  ville_retrait: string;
  montant: number;
  frais_livraison: number;
  dest_nom: string;
  created_at: string;
};

function Kpi({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Package;
  label: string;
  value: string;
  hint?: string | undefined;
}) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className="size-4 text-accent" />
      </div>
      <p className="mt-2 text-3xl font-extrabold text-primary">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Dashboard() {
  const { profile, isAdmin, isComptable, roles } = useCbpAuth();

  const { data: colis = [], isLoading } = useQuery({
    queryKey: ["colis-dashboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("colis")
        .select("id,numero_suivi,statut,ville_depot,ville_retrait,montant,frais_livraison,dest_nom,created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as ColisRow[];
    },
  });

  const enTransit = colis.filter((c) => c.statut === "en_transit").length;
  const aRetirer = colis.filter((c) => c.statut === "arrive_point_relais" || c.statut === "notifie_client").length;
  const retires = colis.filter((c) => c.statut === "retire");
  const ca = retires.reduce((s, c) => s + Number(c.frais_livraison ?? 0), 0);
  const encaisse = retires.reduce((s, c) => s + Number(c.montant ?? 0), 0);

  const parVille: Record<string, number> = {};
  for (const v of VILLES) parVille[v] = 0;
  for (const c of colis) parVille[c.ville_retrait] = (parVille[c.ville_retrait] ?? 0) + 1;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Bonjour {profile?.full_name?.split(" ")[0] ?? ""} 👋</h1>
          <p className="text-sm text-muted-foreground">
            {roles.length ? `Profil : ${roles.join(", ")}` : "Votre compte attend la validation d'un administrateur."}
          </p>
        </div>
        <Button asChild>
          <Link to="/colis">
            Voir les colis <ArrowUpRight className="size-4" />
          </Link>
        </Button>
      </div>

      <AlertesAgents />


      {!roles.length && (
        <div className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">
          Votre compte est créé mais aucun rôle ne vous a encore été attribué. Un administrateur doit valider votre
          accès depuis la page Équipe.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={Package} label="Colis total" value={String(colis.length)} hint="500 derniers enregistrements" />
        <Kpi icon={Truck} label="En transit" value={String(enTransit)} />
        <Kpi icon={Users} label="À retirer" value={String(aRetirer)} hint="Arrivés en point relais" />
        <Kpi
          icon={Wallet}
          label={isComptable || isAdmin ? "CA livraisons" : "Colis retirés"}
          value={isComptable || isAdmin ? formatFCFA(ca) : String(retires.length)}
          hint={isComptable || isAdmin ? `${formatFCFA(encaisse)} encaissés pour les expéditeurs` : undefined}
        />
      </div>

      <section className="rounded-xl border bg-card p-5 shadow-card">
        <h2 className="text-lg font-bold">Activité par ville</h2>
        <p className="text-sm text-muted-foreground">Répartition des colis par ville de retrait.</p>
        <div className="mt-5">
          <CarteBenin data={parVille} />
        </div>
      </section>

      <section className="rounded-xl border bg-card shadow-card">
        <div className="flex items-center justify-between p-5">
          <h2 className="text-lg font-bold">Derniers colis</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/colis">Tout voir</Link>
          </Button>
        </div>
        <div className="divide-y border-t">
          {isLoading && <p className="p-5 text-sm text-muted-foreground">Chargement…</p>}
          {!isLoading && colis.length === 0 && (
            <p className="p-5 text-sm text-muted-foreground">Aucun colis pour l'instant.</p>
          )}
          {colis.slice(0, 8).map((c) => (
            <Link
              key={c.id}
              to="/colis/$id"
              params={{ id: c.id }}
              className="flex flex-wrap items-center justify-between gap-3 p-4 transition-colors hover:bg-muted/50"
            >
              <div>
                <p className="font-mono text-sm font-semibold">{c.numero_suivi}</p>
                <p className="text-xs text-muted-foreground">
                  {c.dest_nom} · {c.ville_depot} → {c.ville_retrait} · {formatDate(c.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold">{formatFCFA(c.frais_livraison)}</span>
                <StatutBadge statut={c.statut} />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
