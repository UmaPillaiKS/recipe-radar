import { Link, NavLink, Outlet } from "react-router-dom";

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "text-sm px-3 py-2 rounded-md transition",
          isActive
            ? "bg-secondary text-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
        ].join(" ")
      }
    >
      {label}
    </NavLink>
  );
}

export function AppShell() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-4">
          <Link to="/recipes" className="flex items-center gap-2">
            <span className="text-xl">🍳</span>
            <span className="font-semibold tracking-tight">Recipe Radar</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <NavItem to="/recipes" label="Recipes" />
            <NavItem to="/cook" label="What to Cook" />
            <NavItem to="/grocery" label="Grocery List Builder" />
            <NavItem to="/grocery/lists" label="Saved Lists" />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
