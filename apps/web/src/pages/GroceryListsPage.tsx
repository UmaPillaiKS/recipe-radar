import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, Plus, ShoppingBasket } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { PageHeader } from "../components/PageHeader";
import { EmptyState } from "../components/EmptyState";
import { API_BASE } from "../lib/api";
import { getErrorMessage } from "../lib/errors";

type GroceryListRow = {
  id: string;
  name: string;
  createdAt: string;
  _count: { items: number };
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function GroceryListsPage() {
  const [lists, setLists] = useState<GroceryListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/grocery-lists`);
      if (!res.ok) throw new Error("Could not load your saved grocery lists.");
      setLists(await res.json());
    } catch (e: unknown) {
      setError(getErrorMessage(e, "Could not load your saved grocery lists."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Saved grocery lists"
        description="Pick up where you left off, check items while you shop, or create a fresh list for your next batch of recipes."
        actions={
          <Button asChild>
            <Link to="/grocery"><Plus /> New list</Link>
          </Button>
        }
      />

      {error && (
        <Card className="border-destructive/30 bg-destructive/5 p-4 shadow-none">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-destructive">{error}</div>
            <Button variant="outline" size="sm" onClick={load}>Try again</Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-40 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : lists.length === 0 ? (
        <EmptyState
          title="No saved lists yet"
          description="Build a grocery list from the recipes you want to cook and save it here for your next shop."
          action={
            <Button asChild>
              <Link to="/grocery">Create your first list</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lists.map((list) => (
            <Link key={list.id} to={`/grocery/lists/${list.id}`} className="group">
              <Card className="h-full p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                    <ShoppingBasket className="h-5 w-5" />
                  </div>
                  <Badge variant="secondary">{list._count.items} items</Badge>
                </div>

                <div className="mt-5">
                  <h2 className="truncate text-lg font-bold tracking-tight">{list.name}</h2>
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" /> Created {formatDate(list.createdAt)}
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-1 text-sm font-medium text-primary">
                  Open shopping list
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
