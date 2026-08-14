import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/cbp";
import { MENU_BIENVENUE } from "@/lib/messages";

export const Route = createFileRoute("/_authenticated/whatsapp")({
  head: () => ({
    meta: [
      { title: "Assistant WhatsApp — CBP Express" },
      { name: "description", content: "Journal des messages automatiques et menu de l'assistant WhatsApp CBP." },
      { property: "og:title", content: "Assistant WhatsApp — CBP Express" },
      { property: "og:description", content: "Notifications clients et assistant conversationnel." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WhatsappPage,
});

function WhatsappPage() {
  const { data: notifs = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id,template,message,destinataire_tel,canal,statut,created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Assistant WhatsApp</h1>
        <p className="text-sm text-muted-foreground">
          Les messages sont générés automatiquement et journalisés. L'envoi réel s'activera dès la connexion du compte
          WhatsApp Business.
        </p>
      </div>

      <section className="rounded-xl border bg-card p-5 shadow-card">
        <h2 className="font-semibold">Menu du bot</h2>
        <pre className="mt-3 rounded-lg bg-secondary p-4 text-xs whitespace-pre-wrap">{MENU_BIENVENUE}</pre>
      </section>

      <section className="rounded-xl border bg-card shadow-card">
        <h2 className="p-5 font-semibold">Messages générés</h2>
        <div className="divide-y border-t">
          {notifs.length === 0 && <p className="p-5 text-sm text-muted-foreground">Aucun message pour l'instant.</p>}
          {notifs.map((n) => (
            <div key={n.id} className="p-4">
              <p className="text-xs font-semibold">
                {n.template} · {n.canal} → {n.destinataire_tel} · {n.statut} · {formatDate(n.created_at)}
              </p>
              <pre className="mt-1 text-xs whitespace-pre-wrap">{n.message}</pre>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
