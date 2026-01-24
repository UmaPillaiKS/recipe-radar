import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

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

export function RecipeDetailPage() {
  const { id } = useParams();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:4000/recipes/${id}`);
        if (!res.ok) throw new Error("Failed to load recipe");
        const data = await res.json();
        setRecipe(data);
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  if (loading) return <div style={{ padding: 16 }}>Loading…</div>;
  if (!recipe) return <div style={{ padding: 16 }}>Not found.</div>;

  return (
    <div style={{ padding: 16 }}>
      <Link to="/recipes">← Back</Link>
      <h1>{recipe.title}</h1>

      <h2>Ingredients</h2>
      <ul>
        {recipe.ingredients.map((ri) => (
          <li key={ri.id}>
            {ri.amount ?? ""} {ri.unit ?? ""} {ri.ingredient.name}
            {ri.optional ? " (optional)" : ""}
          </li>
        ))}
      </ul>

      <h2>Steps</h2>
      <ol>
        {recipe.steps.map((s) => (
          <li key={s.id}>{s.text}</li>
        ))}
      </ol>
    </div>
  );
}
