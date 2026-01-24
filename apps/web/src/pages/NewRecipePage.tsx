import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

type IngredientRow = { name: string; amount: string; unit: string; optional: boolean };

export function NewRecipePage() {
  const nav = useNavigate();

  const [title, setTitle] = useState("");
  const [ingredients, setIngredients] = useState<IngredientRow[]>([
    { name: "", amount: "", unit: "", optional: false },
  ]);
  const [steps, setSteps] = useState<string[]>([""]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateIngredient(i: number, patch: Partial<IngredientRow>) {
    setIngredients((prev) => prev.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
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
      const res = await fetch("http://localhost:4000/recipes", {
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
    <div style={{ padding: 16, maxWidth: 700 }}>
      <Link to="/recipes">← Back</Link>
      <h1>Add recipe</h1>

      {error && <div style={{ marginBottom: 12 }}>{error}</div>}

      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label>
            Title<br />
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: "100%", padding: 8 }}
            />
          </label>
        </div>

        <h2>Ingredients</h2>
        {ingredients.map((row, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input
              placeholder="name (e.g. eggs)"
              value={row.name}
              onChange={(e) => updateIngredient(i, { name: e.target.value })}
              style={{ flex: 2, padding: 8 }}
            />
            <input
              placeholder="amount"
              value={row.amount}
              onChange={(e) => updateIngredient(i, { amount: e.target.value })}
              style={{ flex: 1, padding: 8 }}
            />
            <input
              placeholder="unit"
              value={row.unit}
              onChange={(e) => updateIngredient(i, { unit: e.target.value })}
              style={{ flex: 1, padding: 8 }}
            />
            <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input
                type="checkbox"
                checked={row.optional}
                onChange={(e) => updateIngredient(i, { optional: e.target.checked })}
              />
              optional
            </label>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setIngredients((prev) => [...prev, { name: "", amount: "", unit: "", optional: false }])}
        >
          + ingredient
        </button>

        <h2 style={{ marginTop: 16 }}>Steps</h2>
        {steps.map((s, i) => (
          <div key={i} style={{ marginBottom: 8 }}>
            <input
              placeholder={`Step ${i + 1}`}
              value={s}
              onChange={(e) => setSteps((prev) => prev.map((x, idx) => (idx === i ? e.target.value : x)))}
              style={{ width: "100%", padding: 8 }}
            />
          </div>
        ))}
        <button type="button" onClick={() => setSteps((prev) => [...prev, ""])}>
          + step
        </button>

        <div style={{ marginTop: 16 }}>
          <button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
