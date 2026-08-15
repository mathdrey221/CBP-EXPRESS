import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
            Réservé aux équipes CBP Express. Les comptes sont créés par l'administrateur.
          </p>

          <form onSubmit={signIn} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="pwd">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="pwd"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              Se connecter
            </Button>
          </form>

          <Button variant="link" className="mt-2 w-full" onClick={() => void reset()}>
            Mot de passe oublié ?
          </Button>

          <Button asChild variant="ghost" className="mt-4 w-full">
            <Link to="/">Retour au site public</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
