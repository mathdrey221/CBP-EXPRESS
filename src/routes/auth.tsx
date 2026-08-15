import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CbpLogo } from "@/components/CbpLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Espace pro — CBP Express" },
      { name: "description", content: "Connexion des agents, comptables et administrateurs CBP Express." },
      { property: "og:title", content: "Espace pro — CBP Express" },
      { property: "og:description", content: "Accès au tableau de bord logistique CBP Express." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"connexion" | "inscription">("connexion");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [telephone, setTelephone] = useState("");
  const [ville, setVille] = useState("");

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate({ to: "/dashboard", replace: true });
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    if (fullName.trim().length < 2) {
      toast.error("Indiquez votre nom complet");
      return;
    }
    if (password.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          full_name: fullName.trim(),
          telephone: telephone.trim(),
          ville: ville.trim(),
        },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.session) {
      toast.success("Compte créé. En attente d'activation par un administrateur.");
      navigate({ to: "/dashboard", replace: true });
      return;
    }
    toast.success("Compte créé. Vérifiez votre email pour confirmer votre adresse.");
    setMode("connexion");
  }

  async function reset() {
    if (!email.trim()) {
      toast.error("Entrez votre email d'abord");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/definir-mot-de-passe`,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Email de réinitialisation envoyé");
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-gradient-cbp p-10 text-primary-foreground lg:flex">
        <CbpLogo variant="light" />
        <div>
          <h1 className="text-4xl font-extrabold">Le poste de pilotage de vos livraisons.</h1>
          <p className="mt-3 max-w-md text-primary-foreground/80">
            Colis, points relais, encaissements et notifications clients — le tout au même endroit.
          </p>
        </div>
        <p className="text-sm text-primary-foreground/70">Cotonou · Bohicon · Parakou</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden">
            <CbpLogo />
          </div>
          <h2 className="mt-6 text-2xl font-bold">Espace professionnel</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "connexion"
              ? "Réservé aux équipes CBP Express."
              : "Créez votre compte agent. Un administrateur l'activera ensuite."}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
            <button
              type="button"
              onClick={() => setMode("connexion")}
              className={
                "rounded-md px-3 py-2 text-sm font-medium transition-colors " +
                (mode === "connexion" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")
              }
            >
              Connexion
            </button>
            <button
              type="button"
              onClick={() => setMode("inscription")}
              className={
                "rounded-md px-3 py-2 text-sm font-medium transition-colors " +
                (mode === "inscription" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")
              }
            >
              Créer un compte
            </button>
          </div>

          <form onSubmit={mode === "connexion" ? signIn : signUp} className="mt-6 space-y-4">
            {mode === "inscription" && (
              <>
                <div>
                  <Label htmlFor="nom">Nom complet</Label>
                  <Input id="nom" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="tel">Téléphone</Label>
                  <Input id="tel" type="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="ville">Ville</Label>
                  <Input id="ville" value={ville} onChange={(e) => setVille(e.target.value)} />
                </div>
              </>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="pwd">Mot de passe</Label>
              <Input
                id="pwd"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "connexion" ? "current-password" : "new-password"}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {mode === "connexion" ? "Se connecter" : "Créer mon compte"}
            </Button>
          </form>

          {mode === "connexion" && (
            <Button variant="link" className="mt-2 w-full" onClick={() => void reset()}>
              Mot de passe oublié ?
            </Button>
          )}

          <Button asChild variant="ghost" className="mt-4 w-full">
            <Link to="/">Retour au site public</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
