import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { creerMembre } from "@/lib/equipe.functions";
import { VILLES } from "@/lib/cbp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/equipe")({
  head: () => ({
    meta: [
      { title: "Équipe — CBP Express" },
      { name: "description", content: "Création des comptes agents et attribution des rôles par l'administrateur." },
      { property: "og:title", content: "Équipe — CBP Express" },
      { property: "og:description", content: "Administration des utilisateurs CBP Express." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Equipe,
});

type Role = "admin" | "agent" | "comptable";

function Equipe() {
  const qc = useQueryClient();
  const creer = useServerFn(creerMembre);
  const [busy, setBusy] = useState(false);
  const VIDE = {
    email: "",
    nom: "",
    prenom: "",
    telephone: "",
    password: "",
    ville: VILLES[0] as string,
    role: "agent" as Role,
  };
  const [form, setForm] = useState(VIDE);

  function genererMotDePasse() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    const bytes = crypto.getRandomValues(new Uint32Array(12));
    const pwd = Array.from(bytes, (b) => chars[b % chars.length]).join("");
    setForm((f) => ({ ...f, password: pwd }));
  }

  const { data: membres = [] } = useQuery({
    queryKey: ["equipe"],
    queryFn: async () => {
      const [{ data: profils, error }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("id,full_name,telephone,ville,actif").order("full_name"),
        supabase.from("user_roles").select("user_id,role"),
      ]);
      if (error) throw error;
      return (profils ?? []).map((p) => ({
        ...p,
        roles: (roles ?? []).filter((r) => r.user_id === p.id).map((r) => r.role as Role),
      }));
    },
  });

  async function creerCompte(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await creer({ data: form });
      toast.success(`Compte créé pour ${form.email} — communiquez-lui son mot de passe`);
      setForm(VIDE);
      void qc.invalidateQueries({ queryKey: ["equipe"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Création impossible");
    } finally {
      setBusy(false);
    }
  }

  async function setRole(userId: string, role: Role) {
    await supabase.from("user_roles").delete().eq("user_id", userId);
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Rôle mis à jour");
    void qc.invalidateQueries({ queryKey: ["equipe"] });
  }

  async function toggleActif(userId: string, actif: boolean) {
    const { error } = await supabase.from("profiles").update({ actif }).eq("id", userId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(actif ? "Compte activé" : "Compte désactivé");
    void qc.invalidateQueries({ queryKey: ["equipe"] });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Équipe</h1>
        <p className="text-sm text-muted-foreground">
          Créez les comptes de vos collaborateurs et définissez leur mot de passe : ils pourront le changer eux-mêmes
          depuis « Mot de passe oublié ».
        </p>
      </div>

      <form onSubmit={creerCompte} className="grid gap-4 rounded-xl border bg-card p-5 shadow-card sm:grid-cols-2">
        <div>
          <Label htmlFor="nom">Nom</Label>
          <Input id="nom" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required />
        </div>
        <div>
          <Label htmlFor="prenom">Prénom</Label>
          <Input id="prenom" value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="pwd">Mot de passe (8 caractères min.)</Label>
          <div className="flex gap-2">
            <Input
              id="pwd"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              minLength={8}
              required
            />
            <Button type="button" variant="secondary" onClick={genererMotDePasse}>
              Générer
            </Button>
          </div>
        </div>
        <div>
          <Label htmlFor="mail">Email</Label>
          <Input
            id="mail"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="tel">Téléphone</Label>
          <Input id="tel" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
        </div>
        <div>
          <Label>Ville</Label>
          <Select value={form.ville} onValueChange={(v) => setForm({ ...form, ville: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VILLES.map((v) => (
                <SelectItem key={v} value={v}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Rôle</Label>
          <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as Role })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="agent">Agent point relais</SelectItem>
              <SelectItem value="comptable">Comptable</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Envoi…" : "Créer le compte et inviter"}
          </Button>
        </div>
      </form>

      <div className="overflow-hidden rounded-xl border bg-card shadow-card">
        <div className="divide-y">
          {membres.length === 0 && <p className="p-5 text-sm text-muted-foreground">Aucun membre.</p>}
          {membres.map((m) => (
            <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-semibold">{m.full_name}</p>
                <p className="text-xs text-muted-foreground">
                  {m.ville ?? "—"} · {m.telephone ?? "—"} · {m.roles.join(", ") || "aucun rôle"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Select value={m.roles[0] ?? ""} onValueChange={(v) => void setRole(m.id, v as Role)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Attribuer un rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="agent">Agent point relais</SelectItem>
                    <SelectItem value="comptable">Comptable</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant={m.actif ? "secondary" : "default"} onClick={() => void toggleActif(m.id, !m.actif)}>
                  {m.actif ? "Désactiver" : "Activer"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
