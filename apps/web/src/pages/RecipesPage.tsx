import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

type Recipe = {
  id: string;
  title: string;
};

export function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("http://localhost:4000/recipes");
        const data = await res.json();
        setRecipes(data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div style={{ padding: 16 }}>Loading…</div>;

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>Recipes</h1>
        <Link to="/recipes/new">+ Add recipe</Link>
        <Link to="/cook">Cook from pantry</Link>
        <Link to="/grocery">Grocery list</Link>

      </div>

      <ul style={{ marginTop: 12 }}>
        {recipes.map((r) => (
          <li key={r.id}>
            <Link to={`/recipes/${r.id}`}>{r.title}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
