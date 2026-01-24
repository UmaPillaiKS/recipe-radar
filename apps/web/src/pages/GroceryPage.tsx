import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

type Recipe = { id: string; title: string };

type GroceryItem = {
  id: string;
  amount: number | null;
  unit: string | null;
  checked: boolean;
  ingredient: { id: string; name: string };
};

export function GroceryPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("http://localhost:4000/recipes");
      const data = await res.json();
      setRecipes(data);
    })();

    (async () => {
      const res = await fetch("http://localhost:4000/grocery");
      if (res.ok) setItems(await res.json());
    })();
  }, []);

  async function generate() {
    setErr(null);
    setLoading(true);
    try {
      const recipeIds = Object.entries(selected)
        .filter(([, v]) => v)
        .map(([id]) => id);

      // Save plan
      const planRes = await fetch("http://localhost:4000/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeIds }),
      });
      if (!planRes.ok) throw new Error(await planRes.text());

      // Generate grocery list
      const res = await fetch("http://localhost:4000/grocery/generate", { method: "POST" });
      if (!res.ok) throw new Error(await res.text());

      setItems(await res.json());
    } catch (e: any) {
      setErr(e.message ?? "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function toggle(itemId: string, checked: boolean) {
    setItems((prev) => prev.map((x) => (x.id === itemId ? { ...x, checked } : x)));

    await fetch(`http://localhost:4000/grocery/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checked }),
    });
  }

  return (
    <div style={{ padding: 16, maxWidth: 900 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <Link to="/recipes">Recipes</Link>
        <h1 style={{ margin: 0 }}>Grocery list</h1>
      </div>

      <h2 style={{ marginTop: 16 }}>Pick recipes</h2>
      <div style={{ display: "grid", gap: 6 }}>
        {recipes.map((r) => (
          <label key={r.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={Boolean(selected[r.id])}
              onChange={(e) => setSelected((p) => ({ ...p, [r.id]: e.target.checked }))}
            />
            {r.title}
          </label>
        ))}
      </div>

      <button onClick={generate} disabled={loading} style={{ marginTop: 12 }}>
        {loading ? "Generating…" : "Generate grocery list"}
      </button>

      {err && <div style={{ marginTop: 12 }}>{err}</div>}

      <h2 style={{ marginTop: 18 }}>Items</h2>
      {items.length === 0 ? (
        <div>No items yet. Select recipes and generate.</div>
      ) : (
        <ul>
          {items.map((it) => (
            <li key={it.id}>
              <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={it.checked}
                  onChange={(e) => toggle(it.id, e.target.checked)}
                />
                <span style={{ textDecoration: it.checked ? "line-through" : "none" }}>
                  {it.amount ?? ""} {it.unit ?? ""} {it.ingredient.name}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
