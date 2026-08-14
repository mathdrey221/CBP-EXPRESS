import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CbpLogo } from "@/components/CbpLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/definir-mot-de-passe")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Définir mon mot de passe — CBP Express" },
      { name: "description", content: "Activez votre compte agent CBP Express en choisissant votre mot de passe." },
      { property: "og:title", content: "Définir mon mot de passe — CBP Express" },
      { property: "og:description", content: "Activation du compte professionnel CBP Express." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DefinirMotDePasse,
});

function DefinirMotDePasse() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setReady(Boolean(data.session)));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setReady(Boolean(session)));
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("8 caractères minimum");
      return;
    }
    if (password !== confirm) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Mot de passe défini. Bienvenue !");
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <CbpLogo />
        <h1 className="mt-6 text-2xl font-bold">Définir mon mot de passe</h1>
        {!ready ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Ouvrez le lien reçu par email depuis cet appareil pour activer votre compte.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="p1">Nouveau mot de passe</Label>
              <Input id="p1" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="p2">Confirmer</Label>
              <Input id="p2" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              Activer mon compte
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
