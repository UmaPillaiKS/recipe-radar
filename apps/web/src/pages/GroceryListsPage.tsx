import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { PageHeader } from "../components/PageHeader";
import { EmptyState } from "../components/EmptyState";
const API = import.meta.env.VITE_API_URL;
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

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/grocery-lists`);
      const data = await res.json();
      setLists(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Saved grocery lists"
        description="Reusable shopping lists generated from your recipes and pantry."
        actions={
          <Button asChild>
            <Link to="/grocery">+ New list</Link>
          </Button>
        }
      />

      {loading ? (
        <div className="space-y-3">
          <div className="h-20 rounded-lg bg-muted/40" />
          <div className="h-20 rounded-lg bg-muted/40" />
          <div className="h-20 rounded-lg bg-muted/40" />
        </div>
      ) : lists.length === 0 ? (
        <EmptyState
          title="No saved grocery lists"
          description="Generate a grocery list from your recipes and save it for later."
          action={
            <Button asChild>
              <Link to="/grocery">Create your first list</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lists.map((l) => (
            <Link
              key={l.id}
              to={`/grocery/lists/${l.id}`}
              className="group"
            >
              <Card className="p-5 transition hover:bg-accent/20">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{l.name}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Created {formatDate(l.createdAt)}
                    </div>
                  </div>

                  <Badge variant="secondary">
                    {l._count.items} items
                  </Badge>
                </div>

                <Separator className="my-4" />

                <div className="text-sm text-muted-foreground">
                  Open list →
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
