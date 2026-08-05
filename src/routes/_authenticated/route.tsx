import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, LogOut, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/cfg-logo.png.asset.json";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <img src={logo.url} alt="CFG logo" className="h-10 w-10" />
          <p className="mr-auto text-sm font-extrabold text-primary">CFG Camp Admin</p>
          <nav className="flex items-center gap-1">
            <Link
              to="/admin"
              activeProps={{ className: "bg-secondary text-primary" }}
              className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-foreground/70"
            >
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </Link>
            <Link
              to="/admin/settings"
              activeProps={{ className: "bg-secondary text-primary" }}
              className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-foreground/70"
            >
              <Settings className="h-4 w-4" /> Settings
            </Link>
            <button
              onClick={signOut}
              className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-destructive"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </nav>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
