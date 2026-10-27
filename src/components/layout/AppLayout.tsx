import { Suspense, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { LogOut, Menu, Moon, Sun, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { backend } from "@/data";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";
import { MOBILE_PRIMARY, NAV_GROUPS } from "./nav";

const allItems = NAV_GROUPS.flatMap((g) => g.items);

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="space-y-6">
      {NAV_GROUPS.map((g) => (
        <div key={g.title}>
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{g.title}</p>
          <div className="space-y-1">
            {g.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="rounded-xl bg-primary p-2 text-primary-foreground shadow-sm">
        <Wallet className="h-5 w-5" />
      </div>
      <div className="leading-tight">
        <p className="font-bold">Finanças da Casa</p>
        <p className="text-xs text-muted-foreground">{backend === "supabase" ? "Sincronizado na nuvem" : "Salvo neste dispositivo"}</p>
      </div>
    </div>
  );
}

export function AppLayout() {
  const { theme, toggle } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  const footer = (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={toggle} className="flex-1">
        {theme === "dark" ? <Sun /> : <Moon />}
        {theme === "dark" ? "Tema claro" : "Tema escuro"}
      </Button>
      {supabase && (
        <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => supabase!.auth.signOut()} aria-label="Sair">
          <LogOut />
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[260px_1fr]">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-dvh flex-col gap-8 border-r bg-card/60 p-5 backdrop-blur lg:flex">
        <Brand />
        <div className="flex-1 overflow-y-auto">
          <NavList />
        </div>
        {footer}
      </aside>

      {/* Topbar (mobile) */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/80 px-4 py-3 backdrop-blur lg:hidden">
        <Brand />
        <Button variant="ghost" size="icon" onClick={toggle} aria-label="Alternar tema">
          {theme === "dark" ? <Sun /> : <Moon />}
        </Button>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10">
        <Suspense fallback={<p className="py-20 text-center text-sm text-muted-foreground">Carregando…</p>}>
          <Outlet />
        </Suspense>
      </main>

      {/* Bottom nav (mobile) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {MOBILE_PRIMARY.map((to) => {
          const item = allItems.find((i) => i.to === to)!;
          return (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                cn("flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium", isActive ? "text-primary" : "text-muted-foreground")
              }
            >
              <item.icon className="h-5 w-5" />
              <span className="max-w-full truncate px-1">{item.short ?? item.label}</span>
            </NavLink>
          );
        })}
        <button
          onClick={() => setMenuOpen(true)}
          className={cn(
            "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
            MOBILE_PRIMARY.includes(pathname) ? "text-muted-foreground" : "text-primary",
          )}
        >
          <Menu className="h-5 w-5" />
          Mais
        </button>
      </nav>

      <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
        <DialogContent className="gap-6">
          <DialogTitle>Menu</DialogTitle>
          <NavList onNavigate={() => setMenuOpen(false)} />
          {footer}
        </DialogContent>
      </Dialog>
    </div>
  );
}
