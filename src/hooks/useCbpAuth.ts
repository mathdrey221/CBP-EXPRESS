import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Role = "admin" | "agent" | "comptable";

export type CbpProfile = {
  id: string;
  full_name: string;
  telephone: string | null;
  ville: string | null;
  point_relais_id: string | null;
  actif: boolean;
};

export type CbpSession = {
  loading: boolean;
  userId: string | null;
  email: string | null;
  profile: CbpProfile | null;
  roles: Role[];
  isAdmin: boolean;
  isComptable: boolean;
  isAgent: boolean;
  refresh: () => Promise<void>;
};

export function useCbpAuth(): CbpSession {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<CbpProfile | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);

  const load = async () => {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) {
      setUserId(null);
      setProfile(null);
      setRoles([]);
      setLoading(false);
      return;
    }
    setUserId(user.id);
    setEmail(user.email ?? null);
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", user.id),
    ]);
    setProfile((p as CbpProfile | null) ?? null);
    setRoles(((r ?? []) as { role: Role }[]).map((x) => x.role));
    setLoading(false);
  };

  useEffect(() => {
    void load();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") void load();
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return {
    loading,
    userId,
    email,
    profile,
    roles,
    isAdmin: roles.includes("admin"),
    isComptable: roles.includes("comptable"),
    isAgent: roles.includes("agent"),
    refresh: load,
  };
}
