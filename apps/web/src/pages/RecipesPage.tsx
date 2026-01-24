import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { PageHeader } from "../components/PageHeader";
import { EmptyState } from "../components/EmptyState";
import { API_BASE } from "../lib/api";

type Recipe = {
  id: string;
  title: string;
  // if your API later returns counts, you can add them here
  // ingredients?: any[];
  // steps?: any[];
};

function normalize(s: string) {
  return s.trim().toLowerCase();
}


export function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/recipes`);
        const data = await res.json();
        setRecipes(data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    const query = normalize(q);
    if (!query) return recipes;
    return recipes.filter((r) => normalize(r.title).includes(query));
  }, [recipes, q]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recipes"
        description="Browse your recipe library, add new dishes, or jump into cooking and grocery planning."
        actions={
          <div className="flex gap-2">
            <Button asChild variant="secondary">
              <Link to="/cook">Cook</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to="/grocery">Grocery</Link>
            </Button>
            <Button asChild>
              <Link to="/recipes/new">+ Add recipe</Link>
            </Button>
          </div>
        }
      />

      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground">Total</div>
            <Badge variant="secondary">{recipes.length}</Badge>
          </div>

          <div className="w-full sm:w-80">
            <Input
              placeholder="Search recipes…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        <Separator className="my-4" />

        {loading ? (
          <div className="space-y-3">
            <div className="h-12 rounded-md bg-muted/40" />
            <div className="h-12 rounded-md bg-muted/40" />
            <div className="h-12 rounded-md bg-muted/40" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={q ? "No matching recipes" : "No recipes yet"}
            description={
              q
                ? "Try a different search term."
                : "Add your first recipe to get started."
            }
            action={
              <Button asChild>
                <Link to="/recipes/new">+ Add recipe</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-3">
            {filtered.map((r) => (
              <Link key={r.id} to={`/recipes/${r.id}`} className="group">
                <Card className="p-4 transition hover:bg-accent/20">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{r.title}</div>
                      <div className="text-sm text-muted-foreground">
                        Open recipe →
                      </div>
                    </div>

                    <Button variant="secondary" className="shrink-0">
                      View
                    </Button>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
