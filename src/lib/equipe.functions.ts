import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type InviteInput = {
  email: string;
  full_name: string;
  telephone: string;
  ville: string;
  role: "admin" | "agent" | "comptable";
  redirectTo: string;
};

export const inviterMembre = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: InviteInput) => {
    const email = String(input.email ?? "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Email invalide");
    if (String(input.full_name ?? "").trim().length < 2) throw new Error("Nom complet requis");
    if (!["admin", "agent", "comptable"].includes(input.role)) throw new Error("Rôle invalide");
    return {
      email,
      full_name: String(input.full_name).trim().slice(0, 100),
      telephone: String(input.telephone ?? "").trim().slice(0, 20),
      ville: String(input.ville ?? "").trim().slice(0, 60),
      role: input.role,
      redirectTo: String(input.redirectTo ?? ""),
    } satisfies InviteInput;
  })
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleError) throw new Error(roleError.message);
    if (!isAdmin) throw new Error("Réservé à l'administrateur");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: invited, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(data.email, {
      redirectTo: data.redirectTo,
      data: { full_name: data.full_name, telephone: data.telephone, ville: data.ville },
    });
    if (error) throw new Error(error.message);
    const userId = invited.user?.id;
    if (!userId) throw new Error("Invitation impossible");

    await supabaseAdmin.from("profiles").upsert(
      {
        id: userId,
        full_name: data.full_name,
        telephone: data.telephone || null,
        ville: data.ville || null,
        actif: true,
      },
      { onConflict: "id" },
    );
    await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
    const { error: rErr } = await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: data.role });
    if (rErr) throw new Error(rErr.message);

    return { ok: true, userId };
  });

type CreateInput = {
  email: string;
  password: string;
  nom: string;
  prenom: string;
  telephone: string;
  ville: string;
  role: "admin" | "agent" | "comptable";
};

export const creerMembre = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: CreateInput) => {
    const email = String(input.email ?? "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Email invalide");
    const password = String(input.password ?? "");
    if (password.length < 8) throw new Error("Le mot de passe doit contenir au moins 8 caractères");
    const nom = String(input.nom ?? "").trim();
    if (nom.length < 2) throw new Error("Nom requis");
    if (!["admin", "agent", "comptable"].includes(input.role)) throw new Error("Rôle invalide");
    return {
      email,
      password,
      nom: nom.slice(0, 60),
      prenom: String(input.prenom ?? "").trim().slice(0, 60),
      telephone: String(input.telephone ?? "").trim().slice(0, 20),
      ville: String(input.ville ?? "").trim().slice(0, 60),
      role: input.role,
    } satisfies CreateInput;
  })
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleError) throw new Error(roleError.message);
    if (!isAdmin) throw new Error("Réservé à l'administrateur");

    const fullName = [data.prenom, data.nom].filter(Boolean).join(" ");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: fullName, telephone: data.telephone, ville: data.ville },
    });
    if (error) {
      if (/already been registered|already exists/i.test(error.message)) {
        throw new Error(
          "Un compte existe déjà avec cet email. Utilisez la liste ci-dessous pour lui attribuer un rôle et l'activer.",
        );
      }
      throw new Error(error.message);
    }
    const userId = created.user?.id;
    if (!userId) throw new Error("Création impossible");

    await supabaseAdmin.from("profiles").upsert(
      {
        id: userId,
        full_name: fullName,
        telephone: data.telephone || null,
        ville: data.ville || null,
        actif: true,
      },
      { onConflict: "id" },
    );
    await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
    const { error: rErr } = await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: data.role });
    if (rErr) throw new Error(rErr.message);

    return { ok: true, userId };
  });
