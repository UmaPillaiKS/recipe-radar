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

type MealDbResult = { id: string; title: string; thumb: string | null };


function normalize(s: string) {
  return s.trim().toLowerCase();
}


export function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const [importQuery, setImportQuery] = useState("");
  const [importResults, setImportResults] = useState<MealDbResult[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importErr, setImportErr] = useState<string | null>(null);

  const [suggestions, setSuggestions] = useState<MealDbResult[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsErr, setSuggestionsErr] = useState<string | null>(null);


  async function loadRecipes() {
    const res = await fetch(`${API_BASE}/recipes`);
    const data = await res.json();
    setRecipes(data);
  }
  async function loadSuggestions() {
    setSuggestionsErr(null);
    setSuggestionsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/external/meals/suggestions?count=3`);
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setSuggestions(json.results ?? []);
    } catch (e: any) {
      setSuggestionsErr(e.message ?? "Failed to load suggestions");
    } finally {
      setSuggestionsLoading(false);
    }
  }


  useEffect(() => {
    (async () => {
      try {
        await loadRecipes();
        await loadSuggestions();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function searchMealDb() {
    setImportErr(null);
    const q = importQuery.trim();
    if (!q) {
      setImportErr("Type something to search (e.g. chicken)");
      return;
    }



    setImportLoading(true);
    try {
      const res = await fetch(`${API_BASE}/external/meals/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setImportResults(json.results ?? []);
    } catch (e: any) {
      setImportErr(e.message ?? "Failed to search TheMealDB");
    } finally {
      setImportLoading(false);
    }
  }

  async function importMeal(mealId: string) {
    setImportErr(null);
    setImportLoading(true);
    try {
      const res = await fetch(`${API_BASE}/external/meals/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mealId }),
      });
      if (!res.ok) throw new Error(await res.text());

      // refresh recipes list
      await loadRecipes();

      // optional: clear results after successful import
      setImportResults([]);
      setImportQuery("");
    } catch (e: any) {
      setImportErr(e.message ?? "Failed to import meal");
    } finally {
      setImportLoading(false);
    }
  }


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
      <div style={{ marginTop: 16, padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <h2 style={{ margin: 0 }}>Suggested right now</h2>
          <button onClick={loadSuggestions} disabled={suggestionsLoading}>
            {suggestionsLoading ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {suggestionsErr && <div style={{ marginTop: 8 }}>{suggestionsErr}</div>}

        {suggestionsLoading && suggestions.length === 0 ? (
          <div style={{ marginTop: 10, opacity: 0.7 }}>Loading suggestions…</div>
        ) : suggestions.length === 0 ? (
          <div style={{ marginTop: 10, opacity: 0.7 }}>No suggestions right now.</div>
        ) : (
          <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
            {suggestions.map((m) => (
              <div key={m.id} style={{ border: "1px solid #eee", borderRadius: 10, overflow: "hidden" }}>
                {m.thumb ? (
                  <img src={m.thumb} alt={m.title} style={{ width: "100%", height: 140, objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: 140, background: "#eee" }} />
                )}

                <div style={{ padding: 10 }}>
                  <div style={{ fontWeight: 600 }}>{m.title}</div>
                  <button onClick={() => importMeal(m.id)} disabled={importLoading} style={{ marginTop: 8 }}>
                    Import
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: 16, padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
        <h2 style={{ marginTop: 0 }}>Find a new recipe</h2>

        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={importQuery}
            onChange={(e) => setImportQuery(e.target.value)}
            placeholder="Search meals… (e.g. chicken)"
            style={{ flex: 1, padding: 8 }}
          />
          <button onClick={searchMealDb} disabled={importLoading}>
            {importLoading ? "Searching…" : "Search"}
          </button>
        </div>

        {importErr && <div style={{ marginTop: 8 }}>{importErr}</div>}

        {importResults.length > 0 && (
          <ul style={{ marginTop: 10 }}>
            {importResults.map((m) => (
              <li key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                {m.thumb ? (
                  <img src={m.thumb} alt={m.title} width={48} height={48} style={{ borderRadius: 6 }} />
                ) : (
                  <div style={{ width: 48, height: 48, background: "#eee", borderRadius: 6 }} />
                )}

                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{m.title}</div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>MealDB ID: {m.id}</div>
                </div>

                <button onClick={() => importMeal(m.id)} disabled={importLoading}>
                  Import
                </button>
              </li>
            ))}
          </ul>
        )}

      </div>

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
