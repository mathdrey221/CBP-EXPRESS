export const VILLES = ["Cotonou", "Bohicon", "Parakou"] as const;
export type Ville = (typeof VILLES)[number];

export const STATUTS = [
  "en_attente_depot",
  "depose",
  "en_transit",
  "arrive_point_relais",
  "notifie_client",
  "retire",
  "retour_expediteur",
] as const;
export type Statut = (typeof STATUTS)[number];

export const STATUT_LABEL: Record<Statut, string> = {
  en_attente_depot: "En attente de dépôt",
  depose: "Déposé",
  en_transit: "En transit",
  arrive_point_relais: "Arrivé au point relais",
  notifie_client: "Notifié client",
  retire: "Retiré",
  retour_expediteur: "Retour expéditeur",
};

export const STATUT_CLASS: Record<Statut, string> = {
  en_attente_depot: "bg-muted text-muted-foreground",
  depose: "bg-primary/10 text-primary",
  en_transit: "bg-warning/20 text-warning-foreground",
  arrive_point_relais: "bg-accent/15 text-accent",
  notifie_client: "bg-accent/25 text-accent",
  retire: "bg-success/15 text-success",
  retour_expediteur: "bg-destructive/10 text-destructive",
};

export const MODES_PAIEMENT = [
  { value: "especes", label: "Espèces" },
  { value: "mtn_momo", label: "MTN MoMo" },
  { value: "moov_money", label: "Moov Money" },
] as const;

export function formatFCFA(v: number | null | undefined): string {
  return `${Math.round(v ?? 0).toLocaleString("fr-FR")} FCFA`;
}

export function formatDate(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function trackingUrl(numero: string): string {
  return `cbpexpress.bj/suivi/${numero}`;
}

/** Coordonnées approximatives pour la carte du Bénin (viewBox 0 0 100 160). */
export const VILLE_POS: Record<Ville, { x: number; y: number }> = {
  Cotonou: { x: 56, y: 140 },
  Bohicon: { x: 47, y: 112 },
  Parakou: { x: 58, y: 55 },
};
