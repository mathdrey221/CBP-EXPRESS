import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ScanLine } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/scan")({
  head: () => ({
    meta: [
      { title: "Scanner — CBP Express" },
      { name: "description", content: "Scannez ou saisissez un numéro de suivi pour ouvrir la fiche colis." },
      { property: "og:title", content: "Scanner — CBP Express" },
      { property: "og:description", content: "Recherche rapide de colis par QR code ou numéro." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Scan,
});

function Scan() {
  const navigate = useNavigate();
  const [numero, setNumero] = useState("");
  const [busy, setBusy] = useState(false);

  async function ouvrir(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase
      .from("colis")
      .select("id")
      .eq("numero_suivi", numero.trim().toUpperCase())
      .maybeSingle();
    setBusy(false);
    if (error || !data) {
      toast.error("Colis introuvable");
      return;
    }
    navigate({ to: "/colis/$id", params: { id: data.id } });
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Scanner un colis</h1>
        <p className="text-sm text-muted-foreground">
          Scannez le QR code avec la caméra de votre téléphone, ou saisissez le numéro pour ouvrir la fiche.
        </p>
      </div>
      <form onSubmit={ouvrir} className="rounded-xl border bg-card p-5 shadow-card">
        <Label htmlFor="num">Numéro de suivi</Label>
        <Input
          id="num"
          autoFocus
          value={numero}
          onChange={(e) => setNumero(e.target.value)}
          placeholder="CBP-AAAAMMJJ-XXX"
          className="mt-1 font-mono"
        />
        <Button type="submit" className="mt-4 w-full" disabled={busy}>
          <ScanLine className="size-4" /> Ouvrir la fiche colis
        </Button>
      </form>
    </div>
  );
}
