import type { ComponentType } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import {
  BookOpen,
  ChefHat,
  ListChecks,
  Radar,
  ShoppingBasket,
} from "lucide-react";

const navItems = [
  { to: "/recipes", label: "Recipes", icon: BookOpen },
  { to: "/cook", label: "Cook", icon: ChefHat },
  { to: "/grocery", label: "Grocery", icon: ShoppingBasket },
  { to: "/grocery/lists", label: "Saved", icon: ListChecks },
];

function NavItem({
  to,
  label,
  icon: Icon,
  mobile = false,
}: {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  mobile?: boolean;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        mobile
          ? [
              "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            ].join(" ")
          : [
              "flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            ].join(" ")
      }
    >
      <Icon className={mobile ? "h-5 w-5" : "h-4 w-4"} />
      <span className={mobile ? "truncate" : ""}>{label}</span>
    </NavLink>
  );
}

export function AppShell() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/recipes" className="group flex items-center gap-3" aria-label="Recipe Radar home">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform group-hover:-rotate-3">
              <Radar className="h-5 w-5" />
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-bold tracking-tight sm:text-base">Recipe Radar</span>
              <span className="hidden text-[11px] text-muted-foreground sm:block">Cook smarter. Waste less.</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 rounded-full border bg-card/80 p-1 shadow-sm md:flex" aria-label="Primary navigation">
            {navItems.map((item) => (
              <NavItem key={item.to} {...item} />
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 pb-28 sm:px-6 sm:py-8 md:pb-10">
        <Outlet />
      </main>

      <nav
        className="fixed inset-x-3 bottom-3 z-40 flex items-center gap-1 rounded-2xl border bg-background/95 p-1.5 shadow-lg backdrop-blur-xl md:hidden"
        aria-label="Mobile navigation"
      >
        {navItems.map((item) => (
          <NavItem key={item.to} {...item} mobile />
        ))}
      </nav>
    </div>
  );
}
