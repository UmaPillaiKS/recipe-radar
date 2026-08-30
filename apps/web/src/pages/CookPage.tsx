import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight,CircleCheck, PackageSearch, Sparkles } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { PageHeader } from "../components/PageHeader";
import { EmptyState } from "../components/EmptyState";
import { API_BASE } from "../lib/api";
import { getErrorMessage } from "../lib/errors";

type MatchRecipe = {
  id: string;
  title: string;
  matchedCount: number;
  requiredCount: number;
  missing: string[];
};

type MatchResponse = {
  cookable: MatchRecipe[];
  almost: MatchRecipe[];
};

function parseCommaList(input: string) {
  return input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function CookPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<MatchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ingredients = useMemo(() => parseCommaList(input), [input]);
  const canSearch = ingredients.length > 0 && !loading;

  async function onMatch() {
    if (!canSearch) return;

    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients }),
      });

      if (!res.ok) throw new Error("We couldn't match your pantry right now. Please try again.");
      const json = (await res.json()) as MatchResponse;
      setData(json);
    } catch (e: unknown) {
      setError(getErrorMessage(e, "We couldn't match your pantry right now. Please try again."));
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Cook from your pantry"
        description="Tell Recipe Radar what is already in your kitchen. We’ll find dishes you can make now and the closest matches for everything else."
        actions={
          <Button asChild variant="outline">
            <Link to="/recipes">Browse all recipes</Link>
          </Button>
        }
      />

      <Card className="overflow-hidden border-primary/10 shadow-sm">
        <div className="bg-gradient-to-r from-secondary/70 to-card p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <PackageSearch className="h-4 w-4" /> Your pantry
              </div>
              <h2 className="mt-2 text-xl font-bold tracking-tight">What ingredients do you have?</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Separate ingredients with commas. You can keep it simple — for example: eggs, tomatoes, rice, garlic.
              </p>
            </div>
            <Badge variant="secondary" className="w-fit">{ingredients.length} {ingredients.length === 1 ? "ingredient" : "ingredients"}</Badge>
          </div>

          <form
            className="mt-5 flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              onMatch();
            }}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="eggs, tomatoes, rice, garlic"
              aria-label="Pantry ingredients"
            />
            <Button type="submit" disabled={!canSearch} className="sm:min-w-36">
              {loading ? "Matching…" : "Find recipes"}
              {!loading && <ArrowRight />}
            </Button>
          </form>

          {ingredients.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {ingredients.map((ingredient, idx) => (
                <Badge key={`${ingredient}-${idx}`} variant="outline" className="bg-background/70">
                  {ingredient}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </Card>

      {error && (
        <Card className="border-destructive/30 bg-destructive/5 p-4 shadow-none">
          <div className="text-sm text-destructive">{error}</div>
        </Card>
      )}

      {!data ? (
        <EmptyState
          title="Ready when your pantry is"
          description="Add at least one ingredient above to see what you can make."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <CircleCheck className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-bold tracking-tight">Ready to cook</h2>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">You already have every required ingredient.</p>
              </div>
              <Badge variant="secondary">{data.cookable.length}</Badge>
            </div>

            <Separator className="my-5" />

            {data.cookable.length === 0 ? (
              <div className="rounded-xl border border-dashed bg-muted/20 p-5 text-sm text-muted-foreground">
                No exact matches yet. Add a few more pantry items or check the close matches.
              </div>
            ) : (
              <div className="space-y-2">
                {data.cookable.map((recipe) => (
                  <Link
                    key={recipe.id}
                    to={`/recipes/${recipe.id}`}
                    className="group flex items-center justify-between gap-3 rounded-xl border p-4 transition hover:border-primary/25 hover:bg-accent/30"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{recipe.title}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{recipe.matchedCount}/{recipe.requiredCount} ingredients matched</div>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                  </Link>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-bold tracking-tight">Close matches</h2>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">Recipes that only need a few more ingredients.</p>
              </div>
              <Badge variant="secondary">{data.almost.length}</Badge>
            </div>

            <Separator className="my-5" />

            {data.almost.length === 0 ? (
              <div className="rounded-xl border border-dashed bg-muted/20 p-5 text-sm text-muted-foreground">
                No close matches found for this pantry combination.
              </div>
            ) : (
              <div className="space-y-2">
                {data.almost.map((recipe) => (
                  <Link
                    key={recipe.id}
                    to={`/recipes/${recipe.id}`}
                    className="group block rounded-xl border p-4 transition hover:border-primary/25 hover:bg-accent/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-semibold">{recipe.title}</div>
                        <div className="mt-1 text-xs text-muted-foreground">Missing {recipe.missing.length} {recipe.missing.length === 1 ? "ingredient" : "ingredients"}</div>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {recipe.missing.slice(0, 6).map((ingredient, idx) => (
                        <Badge key={`${ingredient}-${idx}`} variant="secondary">{ingredient}</Badge>
                      ))}
                      {recipe.missing.length > 6 && <Badge variant="outline">+{recipe.missing.length - 6} more</Badge>}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
