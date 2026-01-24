import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Checkbox } from "../components/ui/checkbox";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";
import { PageHeader } from "../components/PageHeader";

type IngredientRow = { name: string; amount: string; unit: string; optional: boolean };
const API = import.meta.env.VITE_API_URL;


export function NewRecipePage() {
  const nav = useNavigate();

  const [title, setTitle] = useState("");
  const [ingredients, setIngredients] = useState<IngredientRow[]>([
    { name: "", amount: "", unit: "", optional: false },
  ]);
  const [steps, setSteps] = useState<string[]>([""]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = useMemo(() => title.trim().length > 0, [title]);

  function updateIngredient(i: number, patch: Partial<IngredientRow>) {
    setIngredients((prev) => prev.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }

  function removeIngredient(i: number) {
    setIngredients((prev) => (prev.length === 1 ? prev : prev.filter((_, idx) => idx !== i)));
  }

  function updateStep(i: number, value: string) {
    setSteps((prev) => prev.map((x, idx) => (idx === i ? value : x)));
  }

  function removeStep(i: number) {
    setSteps((prev) => (prev.length === 1 ? prev : prev.filter((_, idx) => idx !== i)));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    const payload = {
      title: title.trim(),
      ingredients: ingredients
        .filter((x) => x.name.trim())
        .map((x) => ({
          name: x.name.trim(),
          amount: x.amount ? Number(x.amount) : undefined,
          unit: x.unit.trim() || undefined,
          optional: x.optional,
        })),
      steps: steps.map((s) => s.trim()).filter(Boolean),
    };

    setSaving(true);
    try {
      const res = await fetch(`${API}/recipes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to save");
      }

      const created = await res.json();
      nav(`/recipes/${created.id}`);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add recipe"
        description="Create a recipe with ingredients and step-by-step instructions."
        actions={
          <Button asChild variant="secondary">
            <Link to="/recipes">← Back</Link>
          </Button>
        }
      />

      {error && (
        <Card className="p-4 border-destructive/40">
          <div className="text-sm text-destructive">{error}</div>
        </Card>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Title */}
        <Card className="p-6 space-y-3">
          <div className="space-y-1">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="e.g. Simple Omelette"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>
          <div className="text-sm text-muted-foreground">
            Keep it short and recognizable.
          </div>
        </Card>

        {/* Ingredients */}
        <Card className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Ingredients</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Add amounts when possible. Mark optional items if they are not required.
              </p>
            </div>

            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                setIngredients((prev) => [...prev, { name: "", amount: "", unit: "", optional: false }])
              }
            >
              + Ingredient
            </Button>
          </div>

          <Separator />

          <div className="space-y-3">
            {ingredients.map((row, i) => (
              <div
                key={i}
                className="grid grid-cols-1 gap-3 rounded-lg border p-4 sm:grid-cols-12 sm:items-center"
              >
                <div className="sm:col-span-5">
                  <Label className="sr-only" htmlFor={`ing-name-${i}`}>
                    Ingredient name
                  </Label>
                  <Input
                    id={`ing-name-${i}`}
                    placeholder="Name (e.g. eggs)"
                    value={row.name}
                    onChange={(e) => updateIngredient(i, { name: e.target.value })}
                  />
                </div>

                <div className="sm:col-span-2">
                  <Label className="sr-only" htmlFor={`ing-amount-${i}`}>
                    Amount
                  </Label>
                  <Input
                    id={`ing-amount-${i}`}
                    placeholder="Amount"
                    inputMode="decimal"
                    value={row.amount}
                    onChange={(e) => updateIngredient(i, { amount: e.target.value })}
                  />
                </div>

                <div className="sm:col-span-2">
                  <Label className="sr-only" htmlFor={`ing-unit-${i}`}>
                    Unit
                  </Label>
                  <Input
                    id={`ing-unit-${i}`}
                    placeholder="Unit"
                    value={row.unit}
                    onChange={(e) => updateIngredient(i, { unit: e.target.value })}
                  />
                </div>

                <div className="sm:col-span-2 flex items-center gap-2">
                  <Checkbox
                    id={`ing-opt-${i}`}
                    checked={row.optional}
                    onCheckedChange={(v) => updateIngredient(i, { optional: Boolean(v) })}
                  />
                  <Label htmlFor={`ing-opt-${i}`} className="text-sm text-muted-foreground">
                    Optional
                  </Label>
                </div>

                <div className="sm:col-span-1 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-muted-foreground"
                    onClick={() => removeIngredient(i)}
                    disabled={ingredients.length === 1}
                    title={ingredients.length === 1 ? "Keep at least one row" : "Remove"}
                  >
                    ✕
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Steps */}
        <Card className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Steps</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Short, clear instructions work best.
              </p>
            </div>

            <Button type="button" variant="secondary" onClick={() => setSteps((prev) => [...prev, ""])}>
              + Step
            </Button>
          </div>

          <Separator />

          <div className="space-y-3">
            {steps.map((s, i) => (
              <div key={i} className="flex gap-3">
                <div className="mt-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-medium">
                  {i + 1}
                </div>

                <div className="flex-1">
                  <Label className="sr-only" htmlFor={`step-${i}`}>
                    Step {i + 1}
                  </Label>
                  <Input
                    id={`step-${i}`}
                    placeholder={`Step ${i + 1} (e.g. Beat eggs with salt)`}
                    value={s}
                    onChange={(e) => updateStep(i, e.target.value)}
                  />
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  className="text-muted-foreground"
                  onClick={() => removeStep(i)}
                  disabled={steps.length === 1}
                  title={steps.length === 1 ? "Keep at least one row" : "Remove"}
                >
                  ✕
                </Button>
              </div>
            ))}
          </div>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3">
          <Button asChild variant="secondary">
            <Link to="/recipes">Cancel</Link>
          </Button>

          <Button type="submit" disabled={saving || !canSave}>
            {saving ? "Saving…" : "Save recipe"}
          </Button>
        </div>
      </form>
    </div>
  );
}
