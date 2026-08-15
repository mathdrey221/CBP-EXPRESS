import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  Package,
  ScanLine,
  Wallet,
  MessageCircle,
  Users,
  MapPin,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { CbpLogo } from "./CbpLogo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useCbpAuth } from "@/hooks/useCbpAuth";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard, roles: ["admin", "agent", "comptable"] },
  { to: "/colis", label: "Colis", icon: Package, roles: ["admin", "agent", "comptable"] },
  { to: "/scan", label: "Scanner QR", icon: ScanLine, roles: ["admin", "agent"] },
  { to: "/compta", label: "Comptabilité", icon: Wallet, roles: ["admin", "comptable"] },
  { to: "/whatsapp", label: "WhatsApp IA", icon: MessageCircle, roles: ["admin"] },
  { to: "/points-relais", label: "Points relais", icon: MapPin, roles: ["admin"] },
  { to: "/equipe", label: "Équipe", icon: Users, roles: ["admin"] },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { roles, profile, email } = useCbpAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  const visible = NAV.filter((n) => roles.some((r) => (n.roles as readonly string[]).includes(r)));

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const nav = (
    <nav className="flex flex-col gap-1">
      {visible.map((item) => {
        const active = pathname === item.to || pathname.startsWith(item.to + "/");
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background lg:flex">
      <aside className="hidden w-64 shrink-0 flex-col justify-between bg-sidebar p-4 lg:flex">
        <div>
          <CbpLogo variant="light" className="mb-8 px-1" />
          {nav}
        </div>
        <div className="rounded-xl bg-sidebar-accent/60 p-3">
          <p className="truncate text-sm font-semibold text-sidebar-foreground">{profile?.full_name || email}</p>
          <p className="text-xs text-sidebar-foreground/70">{roles.join(", ") || "sans rôle"}</p>
          <Button variant="secondary" size="sm" className="mt-3 w-full" onClick={signOut}>
            <LogOut className="size-4" /> Déconnexion
          </Button>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between bg-sidebar px-4 py-3 lg:hidden">
        <CbpLogo variant="light" />
        <Button variant="ghost" size="icon" className="text-sidebar-foreground" onClick={() => setOpen((v) => !v)}>
          {open ? <X /> : <Menu />}
        </Button>
      </header>
      {open && (
        <div className="sticky top-[60px] z-30 bg-sidebar px-4 pb-4 lg:hidden">
          {nav}
          <Button variant="secondary" size="sm" className="mt-3 w-full" onClick={signOut}>
            <LogOut className="size-4" /> Déconnexion
          </Button>
        </div>
      )}

      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        {profile && !profile.actif && (
          <div className="mb-6 rounded-xl border border-border bg-muted p-4">
            <p className="text-sm font-semibold text-foreground">Compte en attente d'activation</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Votre inscription est enregistrée. Un administrateur doit activer votre compte et vous
              attribuer un rôle avant que les données ne s'affichent.
            </p>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
