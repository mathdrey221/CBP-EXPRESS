import { supabase } from "@/integrations/supabase/client";
import { buildMessage, STATUT_TEMPLATE, type ColisLike, type PointLike, type TemplateKey } from "./messages";

/**
 * Enregistre une notification sortante.
 * Tant que les clés WhatsApp Cloud API / SMS ne sont pas configurées,
 * le message est généré et journalisé avec le statut "simule".
 */
export async function enregistrerNotification(params: {
  colisId: string | null;
  tel: string;
  template: TemplateKey;
  message: string;
  canal?: "whatsapp" | "sms";
}) {
  const { error } = await supabase.from("notifications").insert({
    colis_id: params.colisId,
    destinataire_tel: params.tel,
    canal: params.canal ?? "whatsapp",
    template: params.template,
    message: params.message,
    statut: "simule",
  });
  if (error) throw error;
}

type ColisRow = ColisLike & { id: string; exp_tel: string; dest_tel: string };

/** Génère et journalise le message automatique lié à un changement de statut. */
export async function notifierChangementStatut(
  colis: ColisRow,
  statut: string,
  point?: PointLike,
): Promise<string | null> {
  const cfg = STATUT_TEMPLATE[statut];
  if (!cfg) return null;
  const message = buildMessage(cfg.key, colis, point);
  const tel = cfg.dest === "exp" ? colis.exp_tel : colis.dest_tel;
  await enregistrerNotification({ colisId: colis.id, tel, template: cfg.key, message });
  return message;
}
