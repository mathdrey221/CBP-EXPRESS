import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, formatFCFA } from "@/lib/cbp";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export const Route = createFileRoute("/_authenticated/compta")({
  head: () => ({
    meta: [
      { title: "Comptabilité — CBP Express" },
      { name: "description", content: "Encaissements, chiffre d'affaires et export des colis retirés." },
      { property: "og:title", content: "Comptabilité — CBP Express" },
      { property: "og:description", content: "Suivi des paiements et reversements CBP Express." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Compta,
});

function Compta() {
  const { data: rows = [] } = useQuery({
    queryKey: ["compta"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("colis")
        .select("id,numero_suivi,exp_nom,dest_nom,montant,frais_livraison,mode_paiement,paye,retire_at,ville_retrait")
        .eq("statut", "retire")
        .order("retire_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });

  const ca = rows.reduce((s, r) => s + Number(r.frais_livraison ?? 0), 0);
  const aReverser = rows.filter((r) => r.paye).reduce((s, r) => s + Number(r.montant ?? 0), 0);

  function exportCsv() {
    const head = ["Numero", "Expediteur", "Destinataire", "Ville", "Frais", "Montant", "Paiement", "Retire le"];
    const lines = rows.map((r) =>
      [
        r.numero_suivi,
        r.exp_nom,
        r.dest_nom,
        r.ville_retrait,
        r.frais_livraison,
        r.montant,
        r.mode_paiement ?? "",
        r.retire_at ?? "",
      ].join(";"),
    );
    const blob = new Blob(["\uFEFF" + [head.join(";"), ...lines].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cbp-compta-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Comptabilité</h1>
          <p className="text-sm text-muted-foreground">{rows.length} colis retirés</p>
        </div>
        <Button onClick={exportCsv} variant="secondary">
          <Download className="size-4" /> Export Excel (CSV)
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border bg-card p-5 shadow-card">
          <p className="text-sm text-muted-foreground">Chiffre d'affaires livraisons</p>
          <p className="mt-2 text-3xl font-extrabold text-primary">{formatFCFA(ca)}</p>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-card">
          <p className="text-sm text-muted-foreground">À reverser aux expéditeurs</p>
          <p className="mt-2 text-3xl font-extrabold text-accent">{formatFCFA(aReverser)}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-card">
        <div className="divide-y">
          {rows.length === 0 && <p className="p-5 text-sm text-muted-foreground">Aucun colis retiré pour l'instant.</p>}
          {rows.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-mono text-sm font-semibold">{r.numero_suivi}</p>
                <p className="text-xs text-muted-foreground">
                  {r.exp_nom} → {r.dest_nom} · {r.ville_retrait} · {formatDate(r.retire_at)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{formatFCFA(r.frais_livraison)}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFCFA(r.montant)} · {r.mode_paiement ?? "paiement non précisé"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
