import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Truck, ShieldCheck, Clock, MapPin } from "lucide-react";
import { CbpLogo } from "@/components/CbpLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VILLES, formatFCFA } from "@/lib/cbp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CBP Express — Livraison de colis au Bénin en 24h" },
      {
        name: "description",
        content:
          "CBP Express livre vos colis entre Cotonou, Bohicon et Parakou en 24h. Suivez votre colis.",
      },
      { property: "og:title", content: "CBP Express — Livraison de colis au Bénin en 24h" },
      {
        property: "og:description",
        content: "Réseau de points relais Cotonou · Bohicon · Parakou. Suivi de colis en temps réel.",
      },
    ],
  }),
  component: Accueil,
});

const TARIFS = [
  { trajet: "Cotonou → Cotonou", prix: 1000 },
  { trajet: "Cotonou → Bohicon", prix: 1500 },
  { trajet: "Cotonou → Parakou", prix: 2000 },
];

function Accueil() {
  const [numero, setNumero] = useState("");

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <CbpLogo />
        <div className="flex items-center gap-2">
          <Button asChild size="sm">
            <Link to="/auth">Espace pro</Link>
          </Button>
        </div>
      </header>

      <section className="bg-gradient-cbp text-primary-foreground">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-accent/20 px-3 py-1 text-xs font-semibold text-accent-foreground ring-1 ring-white/20">
              <Clock className="size-3.5" /> 24h chrono · Cotonou · Bohicon · Parakou
            </span>
            <h1 className="mt-4 text-4xl leading-tight font-extrabold sm:text-5xl">
              Vos colis livrés partout au Bénin, sans stress.
            </h1>
            <p className="mt-4 max-w-lg text-primary-foreground/80">
              Dépôt en point relais, transport sécurisé, notification automatique du destinataire dès l'arrivée.
            </p>
            <p className="mt-8 text-sm text-primary-foreground/70">
              Les dépôts s'effectuent auprès de nos agents en point relais.
            </p>
          </div>

          <div className="rounded-2xl bg-card p-6 text-card-foreground shadow-card">
            <h2 className="text-lg font-bold">Suivre mon colis</h2>
            <p className="mt-1 text-sm text-muted-foreground">Entrez votre numéro de suivi (ex : CBP-20260808-001).</p>
            <form
              className="mt-4 flex flex-col gap-3 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                const n = numero.trim().toUpperCase();
                if (n) window.location.assign(`/suivi/${encodeURIComponent(n)}`);
              }}
            >
              <Input
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                placeholder="CBP-AAAAMMJJ-XXX"
                aria-label="Numéro de suivi"
                maxLength={40}
              />
              <Button type="submit">
                <Search className="size-4" /> Suivre
              </Button>
            </form>
            <div className="mt-6 grid grid-cols-3 gap-2 text-center">
              {VILLES.map((v) => (
                <div key={v} className="rounded-lg bg-secondary p-3">
                  <MapPin className="mx-auto size-4 text-accent" />
                  <p className="mt-1 text-sm font-semibold">{v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-2xl font-bold">Nos tarifs</h2>
        <p className="mt-1 text-muted-foreground">Délai 24h. Paiement à la livraison +2%. Assurance +500 FCFA.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {TARIFS.map((t) => (
            <div key={t.trajet} className="rounded-xl border bg-card p-5 shadow-card">
              <p className="text-sm text-muted-foreground">{t.trajet}</p>
              <p className="mt-2 text-3xl font-extrabold text-primary">{formatFCFA(t.prix)}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {[
            { icon: Truck, t: "Réseau dédié", d: "Départs quotidiens entre nos trois villes." },
            { icon: ShieldCheck, t: "Colis sécurisé", d: "Photo à la prise en charge, pièce d'identité au retrait." },
            { icon: Clock, t: "Notifications auto", d: "Dépôt, arrivée, retrait : le client est prévenu." },
          ].map((f) => (
            <div key={f.t} className="rounded-xl border bg-card p-5 shadow-card">
              <f.icon className="size-5 text-accent" />
              <h3 className="mt-3 font-semibold">{f.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        CBP Express — Cotonou · Bohicon · Parakou · Lun-Sam 8h-18h
      </footer>
    </div>
  );
}
