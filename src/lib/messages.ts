import { formatDate, formatFCFA, trackingUrl } from "./cbp";

export type TemplateKey =
  | "depot_confirme"
  | "arrivee_point_relais"
  | "relance_j2"
  | "retrait_effectue"
  | "reversement"
  | "retour_expediteur";

export type ColisLike = {
  numero_suivi: string;
  exp_nom: string;
  dest_nom: string;
  ville_retrait: string;
  ville_depot: string;
  montant: number;
  retire_at?: string | null;
};

export type PointLike = { nom?: string | null; adresse?: string | null } | null;

/** Construit le texte exact du message automatique à envoyer au client. */
export function buildMessage(
  key: TemplateKey,
  colis: ColisLike,
  point?: PointLike,
  extra?: {
    marchand?: string;
    montantReverse?: number;
    moyen?: string;
    debut?: string;
    fin?: string;
    nbColis?: number;
    fraisRetour?: number;
  },
): string {
  const n = colis.numero_suivi;
  const pNom = point?.nom ?? "Point relais CBP";
  const pAdresse = point?.adresse ?? "Adresse communiquée par nos équipes";

  switch (key) {
    case "depot_confirme":
      return `CBP EXPRESS ✅ Dépôt Confirmé

Bonjour ${colis.exp_nom},
Votre colis a bien été pris en charge.
N° Suivi: ${n}
Pour: ${colis.dest_nom} à ${colis.ville_retrait}
Montant à récupérer: ${formatFCFA(colis.montant)}
Suivez-le ici: ${trackingUrl(n)}
Merci pour votre confiance.
CBP Express - 24h Chrono`;

    case "arrivee_point_relais":
      return `CBP EXPRESS 📍 Colis Arrivé

Bonjour ${colis.dest_nom},
Votre colis N°${n} est arrivé.
Point de retrait: ${pNom}
Adresse: ${pAdresse}
Horaires: Lun-Sam 8h-18h
À payer: ${formatFCFA(colis.montant)}
Pièce: Carte d'identité obligatoire
Conservation: 3 jours gratuits.
CBP Express`;

    case "relance_j2":
      return `CBP EXPRESS ⏰ Rappel Important

Bonjour ${colis.dest_nom},
Votre colis N°${n} vous attend toujours à ${colis.ville_retrait}.
⚠️ Il reste 1 jour avant retour à l'expéditeur.
Adresse: ${pAdresse}
Passez le récupérer aujourd'hui.
CBP Express`;

    case "retrait_effectue":
      return `CBP EXPRESS ✅ Livraison Réussie

Bonjour ${colis.exp_nom},
Votre colis N°${n} a été RETIRÉ.
Par: ${colis.dest_nom}
Le: ${formatDate(colis.retire_at ?? new Date().toISOString())}
Montant récupéré: ${formatFCFA(colis.montant)}
Reversement prévu sous 24h.
Merci CBP Express`;

    case "reversement":
      return `CBP EXPRESS 💰 Reversement Effectué

Bonjour ${extra?.marchand ?? colis.exp_nom},
Nous venons de vous reverser ${formatFCFA(extra?.montantReverse ?? colis.montant)} sur ${extra?.moyen ?? "MTN MoMo"}.
Période: Du ${extra?.debut ?? "—"} au ${extra?.fin ?? "—"}
Nb de colis payés: ${extra?.nbColis ?? 0}
Détails: cbpexpress.bj/comptes
Merci pour votre confiance.
CBP Express`;

    case "retour_expediteur":
      return `CBP EXPRESS ↩️ Retour Colis

Bonjour ${colis.exp_nom},
Le colis N°${n} n'a pas été récupéré.
Il est de retour à ${colis.ville_depot} au point ${pNom}.
Frais de retour: ${formatFCFA(extra?.fraisRetour ?? 500)}
Contactez-nous pour re-programmer la livraison.
CBP Express`;
  }
}

/** Quel message part automatiquement pour chaque statut, et à qui. */
export const STATUT_TEMPLATE: Record<string, { key: TemplateKey; dest: "exp" | "dest" } | undefined> = {
  depose: { key: "depot_confirme", dest: "exp" },
  arrive_point_relais: { key: "arrivee_point_relais", dest: "dest" },
  notifie_client: { key: "arrivee_point_relais", dest: "dest" },
  retire: { key: "retrait_effectue", dest: "exp" },
  retour_expediteur: { key: "retour_expediteur", dest: "exp" },
};

export const MENU_BIENVENUE = `Bienvenue chez CBP EXPRESS 📦

Bonjour ! Je suis l'assistant virtuel de CBP Express.
Votre réseau de livraison Cotonou - Bohicon - Parakou.
Je peux vous aider 24h/24.
Choisissez une option ci-dessous 👇

1. Suivre un colis  |  2. Nos Tarifs  |  3. Parler à un agent`;
