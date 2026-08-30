import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { PageHeader } from "../components/PageHeader";
import { EmptyState } from "../components/EmptyState";
import { API_BASE } from "../lib/api";
import { getErrorMessage } from "../lib/errors";

type Recipe = {
  id: string;
  title: string;
  ingredients: Array<{
    id: string;
    amount: number | null;
    unit: string | null;
    optional: boolean;
    ingredient: { id: string; name: string };
  }>;
  steps: Array<{ id: string; order: number; text: string }>;
};

function fmtAmount(amount: number | null, unit: string | null) {
  if (amount == null && !unit) return "";
  const a = amount == null ? "" : String(amount);
  const u = unit ?? "";
  return `${a} ${u}`.trim();
}

export function RecipeDetailPage() {
  const { id } = useParams();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(`${API_BASE}/recipes/${id}`);
        if (!res.ok) throw new Error("Failed to load recipe");
        const data = await res.json();
        setRecipe(data);
      } catch (e: unknown) {
        setRecipe(null);
        setErr(getErrorMessage(e, "Failed to load recipe"));
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-9 w-40 rounded-md bg-muted/40" />
        <Card className="p-6">
          <div className="h-6 w-2/3 rounded-md bg-muted/40" />
          <div className="mt-4 space-y-2">
            <div className="h-4 w-full rounded-md bg-muted/40" />
            <div className="h-4 w-5/6 rounded-md bg-muted/40" />
            <div className="h-4 w-2/3 rounded-md bg-muted/40" />
          </div>
        </Card>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="space-y-4">
        <Button asChild variant="secondary">
          <Link to="/recipes">← Back to recipes</Link>
        </Button>

        <EmptyState
          title="Recipe not found"
          description={err ?? "This recipe may have been deleted."}
          action={
            <Button asChild>
              <Link to="/recipes">Go to Recipes</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const requiredCount = recipe.ingredients.filter((i) => !i.optional).length;
  const optionalCount = recipe.ingredients.filter((i) => i.optional).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={recipe.title}
        description="Ingredients and step-by-step instructions."
        actions={
          <div className="flex gap-2">
            <Button asChild variant="secondary">
              <Link to="/recipes">← Back</Link>
            </Button>
            <Button asChild>
              <Link to="/grocery">Add to grocery flow</Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Ingredients</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {requiredCount} required
                {optionalCount > 0 ? ` • ${optionalCount} optional` : ""}
              </p>
            </div>

            <div className="flex gap-2">
              <Badge variant="secondary">{recipe.ingredients.length} total</Badge>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="space-y-2">
            {recipe.ingredients.map((ri) => (
              <div
                key={ri.id}
                className="flex items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">{ri.ingredient.name}</div>
                  {ri.optional && (
                    <div className="text-xs text-muted-foreground mt-1">Optional</div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {ri.optional && <Badge variant="outline">Optional</Badge>}
                  {fmtAmount(ri.amount, ri.unit) && (
                    <Badge variant="secondary">{fmtAmount(ri.amount, ri.unit)}</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-6">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Steps</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {recipe.steps.length} step{recipe.steps.length === 1 ? "" : "s"}
            </p>
          </div>

          <Separator className="my-4" />

          <ol className="space-y-3">
            {recipe.steps
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((s, idx) => (
                <li key={s.id} className="flex gap-3">
                  <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-sm font-medium">
                    {idx + 1}
                  </div>
                  <div className="flex-1 rounded-lg border p-3 leading-relaxed">
                    {s.text}
                  </div>
                </li>
              ))}
          </ol>
        </Card>
      </div>
    </div>
  );
}
