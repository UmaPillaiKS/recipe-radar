import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { PageHeader } from "../components/PageHeader";
import { EmptyState } from "../components/EmptyState";
import { API_BASE } from "../lib/api";

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
  const [input, setInput] = useState("eggs, salt");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<MatchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ingredients = useMemo(() => parseCommaList(input), [input]);
  const canSearch = ingredients.length > 0 && !loading;

  async function onMatch() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients }),
      });

      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as MatchResponse;
      setData(json);
    } catch (e: any) {
      setError(e.message ?? "Failed to match");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cook from pantry"
        description="Enter what you already have. We’ll show what you can cook now — and what you’re close to making."
        actions={
          <Button asChild variant="secondary">
            <Link to="/recipes">Browse recipes</Link>
          </Button>
        }
      />

      {error && (
        <Card className="p-4 border-destructive/40">
          <div className="text-sm text-destructive whitespace-pre-wrap">{error}</div>
        </Card>
      )}

      {/* Input */}
      <Card className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Your pantry</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Comma-separated, e.g. <span className="font-mono">eggs, tomato, salt</span>
            </p>
          </div>
          <Badge variant="secondary">{ingredients.length} items</Badge>
        </div>

        <Separator />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="eggs, tomato, salt"
          />
          <Button onClick={onMatch} disabled={!canSearch} className="sm:w-40">
            {loading ? "Matching…" : "Find recipes"}
          </Button>
        </div>

        {ingredients.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {ingredients.map((x, idx) => (
              <Badge key={`${x}-${idx}`} variant="outline">
                {x}
              </Badge>
            ))}
          </div>
        )}

        {!canSearch && (
          <div className="text-xs text-muted-foreground">
            Add at least one ingredient to search.
          </div>
        )}
      </Card>

      {/* Results */}
      {!data ? (
        <EmptyState
          title="No results yet"
          description="Enter your pantry items and click “Find recipes”."
          action={
            <Button onClick={onMatch} disabled={!canSearch}>
              {loading ? "Matching…" : "Find recipes"}
            </Button>
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Cookable */}
          <Card className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Can cook now</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Recipes where you have all required ingredients.
                </p>
              </div>
              <Badge variant="secondary">{data.cookable.length}</Badge>
            </div>

            <Separator />

            {data.cookable.length === 0 ? (
              <EmptyState
                title="No exact matches"
                description="Try adding more pantry items, or check the “Almost” section."
              />
            ) : (
              <div className="space-y-2">
                {data.cookable.map((r) => (
                  <Link key={r.id} to={`/recipes/${r.id}`} className="group">
                    <Card className="p-4 transition hover:bg-accent/20">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{r.title}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {r.matchedCount}/{r.requiredCount} matched
                          </div>
                        </div>
                        <Badge variant="outline">Cook</Badge>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          {/* Almost */}
          <Card className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Almost</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Recipes you can make with a few missing items.
                </p>
              </div>
              <Badge variant="secondary">{data.almost.length}</Badge>
            </div>

            <Separator />

            {data.almost.length === 0 ? (
              <EmptyState
                title="Nothing here"
                description="Nice! Either you can cook everything, or you need more pantry items to match."
              />
            ) : (
              <div className="space-y-2">
                {data.almost.map((r) => (
                  <Link key={r.id} to={`/recipes/${r.id}`} className="group">
                    <Card className="p-4 transition hover:bg-accent/20">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-medium truncate">{r.title}</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              Missing {r.missing.length} item{r.missing.length === 1 ? "" : "s"}
                            </div>
                          </div>
                          <Badge variant="outline">Almost</Badge>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {r.missing.slice(0, 8).map((m, idx) => (
                            <Badge key={`${m}-${idx}`} variant="secondary">
                              {m}
                            </Badge>
                          ))}
                          {r.missing.length > 8 && (
                            <Badge variant="outline">+{r.missing.length - 8} more</Badge>
                          )}
                        </div>
                      </div>
                    </Card>
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
