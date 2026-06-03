"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  BarChart2,
  PiggyBank,
  Wallet,
  CalendarDays,
  CreditCard,
  Award,
  Settings,
  TrendingUp,
  Calculator,
  Building,
} from "lucide-react";
import { UserMenu } from "@/components/user-menu";

const navItems = [
  { href: "/analisis", label: "Inicio", icon: Home },
  { href: "/patrimonio", label: "Patrimonio", icon: Building },
  { href: "/prestamos", label: "Préstamos", icon: Home },
  { href: "/jubilacion", label: "Jubilación", icon: PiggyBank },
  { href: "/presupuesto", label: "Presupuesto", icon: Wallet },
  { href: "/flujo", label: "Flujo Anual", icon: CalendarDays },
  { href: "/flujo-mensual", label: "Flujo Mensual", icon: CreditCard },
  { href: "/simuladores", label: "Simuladores", icon: Calculator },
  { href: "/puntos", label: "Puntos", icon: Award },
  { href: "/configuracion", label: "Configuración", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-56 min-h-screen border-r border-border bg-card shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <TrendingUp className="h-4.5 w-4.5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold">Dashboard</p>
          <p className="text-xs text-muted-foreground">Finanzas Personales</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User Menu */}
      <UserMenu />

      {/* Footer */}
      <div className="px-5 py-4 border-t border-border">
        <p className="text-xs text-muted-foreground">Dashboard Financiero</p>
        <p className="text-xs text-muted-foreground/60">2026</p>
      </div>
    </aside>
  );
}

// Mobile bottom nav
export function BottomNav() {
  const pathname = usePathname();
  const mobileItems = navItems.slice(0, 6);

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
      <div className="flex">
        {mobileItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="hidden sm:block text-[10px]">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
