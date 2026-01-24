import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Checkbox } from "../components/ui/checkbox";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { PageHeader } from "../components/PageHeader";
import { API_BASE } from "../lib/api";

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
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [pantryInput, setPantryInput] = useState("eggs, salt");
  const [listName, setListName] = useState("This week");
  const [preview, setPreview] = useState<Preview | null>(null);

  const nav = useNavigate();

  useEffect(() => {
    (async () => {
      const res = await fetch(`${API_BASE}/recipes`);
      const data = await res.json();
      setRecipes(data);
    })();
  }, []);

  const selectedCount = useMemo(
    () => Object.values(selected).filter(Boolean).length,
    [selected]
  );

  const canGenerate = selectedCount > 0 && !loading;
  const canSave = Boolean(preview) && listName.trim().length > 0 && !loading;

  async function previewList() {
    setErr(null);

    const recipeIds = Object.entries(selected)
      .filter(([, v]) => v)
      .map(([id]) => id);

    if (recipeIds.length === 0) {
      setErr("Please select at least one recipe");
      return;
    }

    setLoading(true);
    try {
      const pantryIngredients = pantryInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch(`${API_BASE}/grocery-lists/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeIds, pantryIngredients }),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setPreview(data);
    } catch (e: any) {
      setErr(e.message ?? "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function saveList() {
    setErr(null);

    const name = listName.trim();
    if (!name) {
      setErr("Please enter a list name");
      return;
    }

    const recipeIds = Object.entries(selected)
      .filter(([, v]) => v)
      .map(([id]) => id);

    setLoading(true);
    try {
      const pantryIngredients = pantryInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch(`${API_BASE}/grocery-lists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, recipeIds, pantryIngredients }),
      });

      if (!res.ok) throw new Error(await res.text());
      const created = await res.json();

      nav(`/grocery/lists/${created.id}`);
    } catch (e: any) {
      setErr(e.message ?? "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Grocery Builder"
        description="Pick dishes, subtract pantry items, preview what you’re missing, then save a named list."
        actions={
          <div className="flex gap-2">
            <Button
              onClick={previewList}
              disabled={!canGenerate}
              variant="default"
            >
              {loading ? "Working…" : "Generate preview"}
            </Button>
            <Button onClick={saveList} disabled={!canSave} variant="secondary">
              Save list
            </Button>
          </div>
        }
      />

      {err && (
        <Card className="p-4 border-destructive/40">
          <div className="text-sm text-destructive whitespace-pre-wrap">{err}</div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Inputs */}
        <Card className="p-6 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Dishes</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Select recipes you plan to cook.
              </p>
            </div>

            <Badge variant="secondary">{selectedCount} selected</Badge>
          </div>

          <Separator />

          <div className="space-y-2">
            {recipes.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No recipes yet. Add a recipe first.
              </div>
            ) : (
              recipes.map((r) => (
                <label
                  key={r.id}
                  className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent/10"
                >
                  <Checkbox
                    checked={Boolean(selected[r.id])}
                    onCheckedChange={(v) =>
                      setSelected((p) => ({ ...p, [r.id]: Boolean(v) }))
                    }
                  />
                  <span className="font-medium">{r.title}</span>
                </label>
              ))
            )}
          </div>

          <Separator />

          <div className="space-y-2">
            <div>
              <div className="text-sm font-medium">Pantry</div>
              <div className="text-sm text-muted-foreground">
                Comma-separated, e.g. <span className="font-mono">eggs, salt, tomatoes</span>
              </div>
            </div>
            <Input
              value={pantryInput}
              onChange={(e) => setPantryInput(e.target.value)}
              placeholder="eggs, salt, tomatoes"
            />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">List name</div>
            <Input
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              placeholder="This week"
            />
            {!listName.trim() && (
              <div className="text-xs text-muted-foreground">
                Required to save a list.
              </div>
            )}
          </div>

          <div className="pt-2 flex flex-wrap gap-2">
            <Button onClick={previewList} disabled={!canGenerate}>
              {loading ? "Working…" : "Generate preview"}
            </Button>
            <Button onClick={saveList} disabled={!canSave} variant="secondary">
              Save list
            </Button>
          </div>
        </Card>

        {/* Right: Preview */}
        <Card className="p-6 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Preview</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Review dishes and missing ingredients before saving.
              </p>
            </div>

            {preview && (
              <div className="flex gap-2">
                <Badge variant="secondary">{preview.recipes.length} dishes</Badge>
                <Badge variant="secondary">{preview.items.length} items</Badge>
              </div>
            )}
          </div>

          <Separator />

          {!preview ? (
            <div className="text-sm text-muted-foreground">
              No preview yet. Select dishes and click <span className="font-medium">Generate preview</span>.
            </div>
          ) : (
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="text-sm font-medium">Dishes</div>
                <div className="flex flex-wrap gap-2">
                  {preview.recipes.map((r) => (
                    <Badge key={r.id} variant="secondary">
                      {r.title}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="text-sm font-medium">Grocery items</div>

                {preview.items.length === 0 ? (
                  <div className="rounded-lg border p-4">
                    <div className="font-medium">Nothing to buy 🎉</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Your pantry covers all required ingredients.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {preview.items.map((it) => (
                      <div
                        key={`${it.ingredientId}__${it.unit ?? ""}`}
                        className="flex items-center justify-between gap-3 rounded-lg border p-3"
                      >
                        <div className="min-w-0">
                          <div className="font-medium truncate">{it.ingredientName}</div>
                          {it.unit || it.amount != null ? (
                            <div className="text-xs text-muted-foreground mt-1">
                              {fmtAmount(it.amount, it.unit) || "—"}
                            </div>
                          ) : null}
                        </div>

                        {fmtAmount(it.amount, it.unit) ? (
                          <Badge variant="outline">{fmtAmount(it.amount, it.unit)}</Badge>
                        ) : (
                          <Badge variant="outline">qty?</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
