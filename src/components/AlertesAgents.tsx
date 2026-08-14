import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { BellRing, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/cbp";

type Alerte = {
  id: string;
  colis_id: string | null;
  ville: string;
  ville_origine: string | null;
  type: string;
  message: string;
  lu: boolean;
  created_at: string;
};

export function AlertesAgents() {
  const qc = useQueryClient();

  const { data: alertes = [] } = useQuery({
    queryKey: ["alertes-agents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alertes_agents")
        .select("id,colis_id,ville,ville_origine,type,message,lu,created_at")
        .eq("lu", false)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data ?? []) as Alerte[];
    },
    refetchInterval: 60_000,
  });

  async function marquerLu(id: string) {
    await supabase.from("alertes_agents").update({ lu: true }).eq("id", id);
    void qc.invalidateQueries({ queryKey: ["alertes-agents"] });
  }

  if (alertes.length === 0) return null;

  return (
    <section className="rounded-xl border bg-card p-5 shadow-card">
      <h2 className="flex items-center gap-2 font-semibold">
        <BellRing className="size-4 text-accent" /> Alertes points relais ({alertes.length})
      </h2>
      <ul className="mt-4 space-y-2">
        {alertes.map((a) => (
          <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-secondary p-3">
            <div className="min-w-56">
              <p className="text-sm">{a.message}</p>
              <p className="text-xs text-muted-foreground">
                {a.ville_origine ? `${a.ville_origine} → ${a.ville}` : a.ville} · {formatDate(a.created_at)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {a.colis_id && (
                <Button asChild variant="secondary" size="sm">
                  <Link to="/colis/$id" params={{ id: a.colis_id }}>
                    Ouvrir
                  </Link>
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => void marquerLu(a.id)}>
                <Check className="size-4" /> Vu
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
