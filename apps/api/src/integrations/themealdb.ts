type MealDbMeal = Record<string, any>;

const BASE = "https://www.themealdb.com/api/json/v1/1"; // free key "1" endpoints :contentReference[oaicite:2]{index=2}

export type MealSearchResult = {
  id: string;
  title: string;
  thumb: string | null;
};

export type MealDetails = {
  id: string;
  title: string;
  instructions: string;
  thumb: string | null;
  ingredients: Array<{ name: string; measure: string | null }>;
};

function pickIngredients(meal: MealDbMeal): MealDetails["ingredients"] {
  const out: MealDetails["ingredients"] = [];
  for (let i = 1; i <= 20; i++) {
    const name = String(meal[`strIngredient${i}`] ?? "").trim();
    const measureRaw = String(meal[`strMeasure${i}`] ?? "").trim();
    if (!name) continue;
    out.push({ name, measure: measureRaw || null });
  }
  return out;
}

export async function searchMealsByName(q: string): Promise<MealSearchResult[]> {
  const url = `${BASE}/search.php?s=${encodeURIComponent(q)}`; // search by name :contentReference[oaicite:3]{index=3}
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TheMealDB search failed: ${res.status}`);
  const json = (await res.json()) as { meals: any[] | null };

  if (!json.meals) return [];
  return json.meals.map((m) => ({
    id: String(m.idMeal),
    title: String(m.strMeal),
    thumb: m.strMealThumb ? String(m.strMealThumb) : null,
  }));
}

export async function lookupMealById(id: string): Promise<MealDetails | null> {
  const url = `${BASE}/lookup.php?i=${encodeURIComponent(id)}`; // lookup by id :contentReference[oaicite:4]{index=4}
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TheMealDB lookup failed: ${res.status}`);
  const json = (await res.json()) as { meals: any[] | null };
  const meal = json.meals?.[0];
  if (!meal) return null;

  return {
    id: String(meal.idMeal),
    title: String(meal.strMeal),
    instructions: String(meal.strInstructions ?? ""),
    thumb: meal.strMealThumb ? String(meal.strMealThumb) : null,
    ingredients: pickIngredients(meal),
  };
}
export async function getRandomMeal(): Promise<MealSearchResult | null> {
  const url = `${BASE}/random.php`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TheMealDB random failed: ${res.status}`);
  const json = (await res.json()) as { meals: any[] | null };
  const m = json.meals?.[0];
  if (!m) return null;

  return {
    id: String(m.idMeal),
    title: String(m.strMeal),
    thumb: m.strMealThumb ? String(m.strMealThumb) : null,
  };
}

