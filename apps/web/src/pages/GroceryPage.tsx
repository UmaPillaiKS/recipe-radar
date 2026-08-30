import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, ClipboardList, ShoppingBasket } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Checkbox } from "../components/ui/checkbox";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { PageHeader } from "../components/PageHeader";
import { EmptyState } from "../components/EmptyState";
import { API_BASE } from "../lib/api";
import { getErrorMessage } from "../lib/errors";

type Recipe = { id: string; title: string };

type PreviewItem = {
  ingredientId: string;
  ingredientName: string;
  amount: number | null;
  unit: string | null;
};

type Preview = {
  recipes: { id: string; title: string }[];
  items: PreviewItem[];
};

function fmtAmount(amount: number | null, unit: string | null) {
  if (amount == null && !unit) return "";
  const a = amount == null ? "" : String(amount);
  const u = unit ?? "";
  return `${a} ${u}`.trim();
}

export function GroceryPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loadingRecipes, setLoadingRecipes] = useState(true);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [pantryInput, setPantryInput] = useState("");
  const [listName, setListName] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);

  const nav = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/recipes`);
        if (!res.ok) throw new Error("Could not load your recipes.");
        setRecipes(await res.json());
      } catch (e: unknown) {
        setErr(getErrorMessage(e, "Could not load your recipes."));
      } finally {
        setLoadingRecipes(false);
      }
    })();
  }, []);

  const selectedCount = useMemo(
    () => Object.values(selected).filter(Boolean).length,
    [selected]
  );

  const canGenerate = selectedCount > 0 && !loading;
  const canSave = Boolean(preview) && listName.trim().length > 0 && !loading;

  function selectedRecipeIds() {
    return Object.entries(selected)
      .filter(([, value]) => value)
      .map(([id]) => id);
  }

  function pantryIngredients() {
    return pantryInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  async function previewList() {
    setErr(null);
    const recipeIds = selectedRecipeIds();

    if (recipeIds.length === 0) {
      setErr("Choose at least one recipe before generating a grocery list.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/grocery-lists/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeIds, pantryIngredients: pantryIngredients() }),
      });

      if (!res.ok) throw new Error("Could not build your grocery preview.");
      setPreview(await res.json());
    } catch (e: unknown) {
      setErr(getErrorMessage(e, "Could not build your grocery preview."));
    } finally {
      setLoading(false);
    }
  }

  async function saveList() {
    setErr(null);
    const name = listName.trim();
    if (!name) {
      setErr("Give your grocery list a name before saving it.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/grocery-lists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          recipeIds: selectedRecipeIds(),
          pantryIngredients: pantryIngredients(),
        }),
      });

      if (!res.ok) throw new Error("Could not save your grocery list.");
      const created = await res.json();
      nav(`/grocery/lists/${created.id}`);
    } catch (e: unknown) {
      setErr(getErrorMessage(e, "Could not save your grocery list."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Build a grocery list"
        description="Choose what you want to cook, tell us what is already in your pantry, and get a shopping list for only what you still need."
        actions={
          <>
            <Button onClick={previewList} disabled={!canGenerate}>
              <ClipboardList /> {loading ? "Working…" : "Preview list"}
            </Button>
            <Button onClick={saveList} disabled={!canSave} variant="outline">
              Save list
            </Button>
          </>
        }
      />

      {err && (
        <Card className="border-destructive/30 bg-destructive/5 p-4 shadow-none">
          <div className="text-sm text-destructive">{err}</div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <ShoppingBasket className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold tracking-tight">Plan your shop</h2>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Select dishes first, then subtract anything you already have.</p>
            </div>
            <Badge variant="secondary">{selectedCount} selected</Badge>
          </div>

          <Separator className="my-5" />

          <div className="space-y-2">
            <div className="text-sm font-semibold">1. Choose recipes</div>
            {loadingRecipes ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-12 animate-pulse rounded-xl bg-muted" />
                ))}
              </div>
            ) : recipes.length === 0 ? (
              <EmptyState title="No recipes to choose from" description="Add or save a recipe first, then come back to build your grocery list." />
            ) : (
              <div className="max-h-72 space-y-2 overflow-auto pr-1">
                {recipes.map((recipe) => (
                  <label
                    key={recipe.id}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border bg-background p-3 transition hover:border-primary/20 hover:bg-accent/30"
                  >
                    <Checkbox
                      checked={Boolean(selected[recipe.id])}
                      onCheckedChange={(value) =>
                        setSelected((prev) => ({ ...prev, [recipe.id]: Boolean(value) }))
                      }
                    />
                    <span className="font-medium">{recipe.title}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <Separator className="my-5" />

          <div className="space-y-2">
            <div className="text-sm font-semibold">2. What is already in your pantry?</div>
            <p className="text-sm leading-6 text-muted-foreground">Optional. Separate ingredients with commas so they can be removed from the shopping list.</p>
            <Input
              value={pantryInput}
              onChange={(e) => setPantryInput(e.target.value)}
              placeholder="eggs, salt, tomatoes"
            />
          </div>

          <Separator className="my-5" />

          <div className="space-y-2">
            <div className="text-sm font-semibold">3. Name your list</div>
            <Input
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              placeholder="Weekend shop"
            />
            <p className="text-xs text-muted-foreground">You only need a name when you are ready to save.</p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button onClick={previewList} disabled={!canGenerate}>
              {loading ? "Working…" : "Preview list"}
            </Button>
            <Button onClick={saveList} disabled={!canSave} variant="outline">Save list</Button>
          </div>
        </Card>

        <Card className="p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold tracking-tight">Your preview</h2>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Check what Recipe Radar thinks you need before saving.</p>
            </div>
            {preview && <Badge variant="secondary">{preview.items.length} items</Badge>}
          </div>

          <Separator className="my-5" />

          {!preview ? (
            <EmptyState
              title="Nothing to preview yet"
              description="Choose at least one recipe and generate a preview to see your missing ingredients."
            />
          ) : (
            <div className="space-y-5">
              <div>
                <div className="mb-2 text-sm font-semibold">Cooking</div>
                <div className="flex flex-wrap gap-2">
                  {preview.recipes.map((recipe) => (
                    <Badge key={recipe.id} variant="secondary">{recipe.title}</Badge>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <div className="mb-2 text-sm font-semibold">Still need to buy</div>
                {preview.items.length === 0 ? (
                  <div className="rounded-xl border border-dashed bg-secondary/30 p-5">
                    <div className="font-semibold">Your pantry has it covered.</div>
                    <div className="mt-1 text-sm text-muted-foreground">There are no missing required ingredients for these dishes.</div>
                  </div>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {preview.items.map((item) => {
                      const quantity = fmtAmount(item.amount, item.unit);
                      return (
                        <div
                          key={`${item.ingredientId}__${item.unit ?? ""}`}
                          className="flex items-center justify-between gap-3 rounded-xl border bg-background p-3"
                        >
                          <div className="min-w-0">
                            <div className="truncate font-medium">{item.ingredientName}</div>
                            <div className="mt-0.5 text-xs text-muted-foreground">{quantity || "Quantity not specified"}</div>
                          </div>
                          {quantity && <Badge variant="outline">{quantity}</Badge>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <Button onClick={saveList} disabled={!canSave} className="w-full">
                Save this grocery list
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
