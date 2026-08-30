import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ChefHat,
  Compass,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { PageHeader } from "../components/PageHeader";
import { EmptyState } from "../components/EmptyState";
import { API_BASE } from "../lib/api";
import { getErrorMessage } from "../lib/errors";

type Recipe = {
  id: string;
  title: string;
};

type MealDbResult = { id: string; title: string; thumb: string | null };

function normalize(s: string) {
  return s.trim().toLowerCase();
}

function ErrorNotice({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">
      {message}
    </div>
  );
}

export function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [recipesErr, setRecipesErr] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const [importQuery, setImportQuery] = useState("");
  const [importResults, setImportResults] = useState<MealDbResult[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importErr, setImportErr] = useState<string | null>(null);

  const [suggestions, setSuggestions] = useState<MealDbResult[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsErr, setSuggestionsErr] = useState<string | null>(null);

  async function loadRecipes() {
    setRecipesErr(null);
    try {
      const res = await fetch(`${API_BASE}/recipes`);
      if (!res.ok) throw new Error("Could not load your recipe library.");
      const data = await res.json();
      setRecipes(data);
    } catch (e: unknown) {
      setRecipesErr(getErrorMessage(e, "Could not load your recipe library."));
    }
  }

  async function loadSuggestions() {
    setSuggestionsErr(null);
    setSuggestionsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/external/meals/suggestions?count=3`);
      if (!res.ok) throw new Error("Could not load recipe inspiration right now.");
      const json = await res.json();
      setSuggestions(json.results ?? []);
    } catch (e: unknown) {
      setSuggestionsErr(getErrorMessage(e, "Could not load recipe inspiration right now."));
    } finally {
      setSuggestionsLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      await Promise.all([loadRecipes(), loadSuggestions()]);
      setLoading(false);
    })();
  }, []);

  async function searchMealDb() {
    setImportErr(null);
    const query = importQuery.trim();
    if (!query) {
      setImportErr("Enter a dish or ingredient to search.");
      return;
    }

    setImportLoading(true);
    try {
      const res = await fetch(`${API_BASE}/external/meals/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Recipe search is unavailable right now.");
      const json = await res.json();
      setImportResults(json.results ?? []);
      if ((json.results ?? []).length === 0) {
        setImportErr(`No recipes found for “${query}”. Try another search.`);
      }
    } catch (e: unknown) {
      setImportErr(getErrorMessage(e, "Recipe search is unavailable right now."));
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
      if (!res.ok) throw new Error("Could not save that recipe.");

      await loadRecipes();
      setImportResults([]);
      setImportQuery("");
    } catch (e: unknown) {
      setImportErr(getErrorMessage(e, "Could not save that recipe."));
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
    <div className="space-y-8">
      <PageHeader
        title="Your recipes"
        description="Keep your go-to dishes in one place, discover something new, or start with the ingredients already in your kitchen."
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/cook">
                <ChefHat /> Cook from pantry
              </Link>
            </Button>
            <Button asChild>
              <Link to="/recipes/new">
                <Plus /> Add recipe
              </Link>
            </Button>
          </>
        }
      />

      <Card className="overflow-hidden border-primary/10 bg-gradient-to-br from-card via-card to-secondary/60 shadow-sm">
        <div className="grid gap-6 p-6 sm:p-7 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="max-w-xl">
            <Badge className="mb-4 gap-1.5" variant="secondary">
              <Sparkles className="h-3.5 w-3.5" /> Kitchen shortcut
            </Badge>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Start with what you already have.
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              Add your pantry ingredients and Recipe Radar will show dishes you can make now and the ones that are only a few ingredients away.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button asChild>
                <Link to="/cook">
                  Find something to cook <ArrowRight />
                </Link>
              </Button>
              <Button asChild variant="ghost">
                <Link to="/grocery">Build a grocery list</Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {["Pantry", "Match", "Cook"].map((label, index) => (
              <div key={label} className="rounded-2xl border bg-background/75 p-3 text-center shadow-sm sm:p-4">
                <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {index + 1}
                </div>
                <div className="text-xs font-semibold sm:text-sm">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <section className="space-y-4" aria-labelledby="inspiration-heading">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Compass className="h-5 w-5 text-primary" />
              <h2 id="inspiration-heading" className="text-xl font-bold tracking-tight">Need inspiration?</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">A few ideas from TheMealDB that you can save to your own library.</p>
          </div>
          <Button variant="ghost" size="sm" onClick={loadSuggestions} disabled={suggestionsLoading}>
            <RefreshCw className={suggestionsLoading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>

        {suggestionsErr && <ErrorNotice message={suggestionsErr} />}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {suggestionsLoading && suggestions.length === 0
            ? Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className="overflow-hidden shadow-sm">
                  <div className="h-44 animate-pulse bg-muted" />
                  <div className="space-y-3 p-4">
                    <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
                    <div className="h-9 w-24 animate-pulse rounded bg-muted" />
                  </div>
                </Card>
              ))
            : suggestions.map((meal) => (
                <Card key={meal.id} className="group overflow-hidden shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="aspect-[16/9] overflow-hidden bg-muted">
                    {meal.thumb ? (
                      <img
                        src={meal.thumb}
                        alt={meal.title}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        <ChefHat className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{meal.title}</div>
                      <div className="mt-1 text-xs text-muted-foreground">Recipe inspiration</div>
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => importMeal(meal.id)} disabled={importLoading}>
                      <Plus /> Save
                    </Button>
                  </div>
                </Card>
              ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card className="p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
              <Search className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Find a new recipe</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Search TheMealDB and save a dish to your Recipe Radar library.
              </p>
            </div>
          </div>

          <form
            className="mt-5 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              searchMealDb();
            }}
          >
            <Input
              value={importQuery}
              onChange={(e) => setImportQuery(e.target.value)}
              placeholder="Try chicken, pasta, curry…"
              aria-label="Search external recipes"
            />
            <Button type="submit" disabled={importLoading}>
              {importLoading ? "Searching…" : "Search"}
            </Button>
          </form>

          {importErr && <div className="mt-3"><ErrorNotice message={importErr} /></div>}

          {importResults.length > 0 && (
            <div className="mt-4 max-h-80 space-y-2 overflow-auto pr-1">
              {importResults.map((meal) => (
                <div key={meal.id} className="flex items-center gap-3 rounded-xl border bg-background p-2.5">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {meal.thumb ? (
                      <img src={meal.thumb} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center"><ChefHat className="h-4 w-4" /></div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{meal.title}</div>
                    <div className="text-xs text-muted-foreground">External recipe</div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => importMeal(meal.id)} disabled={importLoading}>
                    <Plus /> Save
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight">Recipe library</h2>
                <Badge variant="secondary">{recipes.length}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Recipes you have created or saved.</p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search your recipes"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label="Search saved recipes"
              />
            </div>
          </div>

          <Separator className="my-5" />

          {recipesErr && <div className="mb-4"><ErrorNotice message={recipesErr} /></div>}

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-16 animate-pulse rounded-xl bg-muted/70" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              title={q ? "No matching recipes" : "Your recipe library is empty"}
              description={q ? "Try a shorter or different search term." : "Create a recipe yourself or save one from the inspiration section."}
              action={
                !q ? (
                  <Button asChild>
                    <Link to="/recipes/new"><Plus /> Add your first recipe</Link>
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="grid gap-2">
              {filtered.map((recipe) => (
                <Link
                  key={recipe.id}
                  to={`/recipes/${recipe.id}`}
                  className="group flex items-center justify-between gap-3 rounded-xl border bg-background p-4 transition hover:border-primary/25 hover:bg-accent/40"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                      <ChefHat className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{recipe.title}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">Open ingredients and steps</div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
