import { supabase } from "@/integrations/supabase/client";

/** Crée une alerte interne destinée aux agents d'un point relais. */
export async function creerAlerteAgent(params: {
  colisId: string | null;
  ville: string;
  villeOrigine?: string | null;
  type?: string;
  message: string;
}) {
  const { data: user } = await supabase.auth.getUser();
  const { error } = await supabase.from("alertes_agents").insert({
    colis_id: params.colisId,
    ville: params.ville,
    ville_origine: params.villeOrigine ?? null,
    type: params.type ?? "transfert",
    message: params.message,
    created_by: user.user?.id ?? null,
  });
  if (error) throw error;
}

/** Alerte le point relais d'arrivée quand un colis part vers une autre ville. */
export async function alerterTransfert(colis: {
  id: string;
  numero_suivi: string;
  ville_depot: string;
  ville_retrait: string;
  dest_nom: string;
  dest_tel: string;
}) {
  if (colis.ville_depot === colis.ville_retrait) return;
  await creerAlerteAgent({
    colisId: colis.id,
    ville: colis.ville_retrait,
    villeOrigine: colis.ville_depot,
    type: "transfert_entrant",
    message: `Colis ${colis.numero_suivi} envoyé depuis ${colis.ville_depot} vers ${colis.ville_retrait} · Destinataire : ${colis.dest_nom} (${colis.dest_tel}).`,
  });
}

/** Informe le point relais d'origine d'un événement survenu à l'arrivée. */
export async function alerterOrigine(
  colis: { id: string; numero_suivi: string; ville_depot: string; ville_retrait: string },
  evenement: string,
) {
  if (colis.ville_depot === colis.ville_retrait) return;
  await creerAlerteAgent({
    colisId: colis.id,
    ville: colis.ville_depot,
    villeOrigine: colis.ville_retrait,
    type: "retour_info",
    message: `Colis ${colis.numero_suivi} (${colis.ville_depot} → ${colis.ville_retrait}) : ${evenement}.`,
  });
}
