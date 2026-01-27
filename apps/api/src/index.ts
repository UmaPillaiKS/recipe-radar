import Fastify from "fastify";
import cors from "@fastify/cors";
import { prisma } from "./prisma.js";
import { lookupMealById, searchMealsByName, getRandomMeal } from "./integrations/themealdb.js";


const app = Fastify({ logger: true });
function normalize(s: string) {
  return s.trim().toLowerCase();
}

await app.register(cors, {
  origin: (origin, cb) => {
    const webOrigin = process.env.WEB_ORIGIN?.trim();

    // allow no-origin requests (curl, server-to-server, Render internal checks)
    if (!origin) return cb(null, true);

    // allow local dev
    if (origin === "http://localhost:5173") return cb(null, true);

    // allow exact production frontend origin
    if (webOrigin && origin === webOrigin) return cb(null, true);

    // optional: allow ALL vercel preview deployments (handy while testing)
    // comment this out if you want strict-only prod
    if (origin.endsWith(".vercel.app")) return cb(null, true);

    // IMPORTANT: don't throw (throwing causes 500)
    return cb(null, false);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
});



app.get("/health", async () => ({ ok: true }));

app.get("/recipes", async () => {
  const recipes = await prisma.recipe.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      ingredients: { include: { ingredient: true } },
      steps: { orderBy: { order: "asc" } },
    },
  });
  return recipes;
});

app.post("/recipes", async (req, reply) => {
  const body = req.body as {
    title: string;
    ingredients: Array<{ name: string; amount?: number; unit?: string; optional?: boolean }>;
    steps: string[];
  };

  if (!body?.title?.trim()) {
    return reply.code(400).send({ error: "title is required" });
  }

  // normalize ingredient names
  const normalized = (name: string) => name.trim().toLowerCase();

  const recipe = await prisma.recipe.create({
    data: {
      title: body.title.trim(),
      ingredients: {
        create: await Promise.all(
          (body.ingredients ?? []).map(async (ing) => {
            const name = normalized(ing.name);
            const ingredient = await prisma.ingredient.upsert({
              where: { name },
              update: {},
              create: { name },
            });
            return {
              ingredientId: ingredient.id,
              amount: ing.amount ?? null,
              unit: ing.unit ?? null,
              optional: ing.optional ?? false,
            };
          })
        ),
      },
      steps: {
        create: (body.steps ?? []).map((text, idx) => ({
          order: idx + 1,
          text: text.trim(),
        })),
      },
    },
    include: {
      ingredients: { include: { ingredient: true } },
      steps: { orderBy: { order: "asc" } },
    },
  });

  return reply.code(201).send(recipe);
});
app.get("/recipes/:id", async (req, reply) => {
  const { id } = req.params as { id: string };

  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: {
      ingredients: { include: { ingredient: true } },
      steps: { orderBy: { order: "asc" } },
    },
  });

  if (!recipe) return reply.code(404).send({ error: "not found" });
  return recipe;
});
app.post("/match", async (req, reply) => {
  const body = req.body as { ingredients: string[] };

  const normalize = (s: string) => s.trim().toLowerCase();

  const haveSet = new Set((body.ingredients ?? []).map(normalize).filter(Boolean));

  // load recipes with ingredients
  const recipes = await prisma.recipe.findMany({
    include: {
      ingredients: { include: { ingredient: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const results = recipes.map((r) => {
    const required = r.ingredients.filter((x) => !x.optional);
    const missing = required
      .map((x) => x.ingredient.name)
      .filter((name) => !haveSet.has(normalize(name)));

    const matchedCount = required.length - missing.length;

    return {
      id: r.id,
      title: r.title,
      matchedCount,
      requiredCount: required.length,
      missing,
    };
  });

  const cookable = results
    .filter((x) => x.missing.length === 0)
    .sort((a, b) => b.matchedCount - a.matchedCount);

  const almost = results
    .filter((x) => x.missing.length > 0)
    .sort((a, b) => a.missing.length - b.missing.length || b.matchedCount - a.matchedCount);

  return reply.send({ cookable, almost });
});
app.post("/plan", async (req) => {
  const body = req.body as { recipeIds: string[] };
  const recipeIds = (body.recipeIds ?? []).filter(Boolean);

  // ensure default plan exists
  await prisma.plan.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });

  // replace plan items
  await prisma.planItem.deleteMany({ where: { planId: "default" } });

  if (recipeIds.length > 0) {
    await prisma.planItem.createMany({
      data: recipeIds.map((recipeId) => ({ planId: "default", recipeId })),
      skipDuplicates: true,
    });
  }

  return prisma.plan.findUnique({
    where: { id: "default" },
    include: { items: { include: { recipe: true } } },
  });
});
app.get("/plan", async () => {
  return prisma.plan.findUnique({
    where: { id: "default" },
    include: { items: { include: { recipe: true } } },
  });
});
app.patch("/grocery-items/:id", async (req, reply) => {
  const { id } = req.params as { id: string };
  const body = req.body as { checked: boolean };

  const updated = await prisma.groceryItem.update({
    where: { id },
    data: { checked: Boolean(body.checked) },
    include: { ingredient: true },
  });

  return reply.send(updated);
});

app.post("/grocery-lists", async (req, reply) => {
  const body = (req.body ?? {}) as {
    name?: string;
    recipeIds?: string[];
    pantryIngredients?: string[];
  };

  const name = (body.name ?? "").trim();
  if (!name) return reply.code(400).send({ error: "name is required" });

  const recipeIds = (body.recipeIds ?? []).filter(Boolean);
  if (recipeIds.length === 0) return reply.code(400).send({ error: "recipeIds required" });

  // reuse preview computation by calling prisma directly again (simple & fine for now)
  const previewRes = await app.inject({
    method: "POST",
    url: "/grocery-lists/preview",
    payload: { recipeIds, pantryIngredients: body.pantryIngredients ?? [] },
  });

  if (previewRes.statusCode !== 200) {
    return reply.code(previewRes.statusCode).send(previewRes.json());
  }

  const preview = previewRes.json() as {
    recipes: Array<{ id: string; title: string }>;
    items: Array<{ ingredientId: string; ingredientName: string; amount: number | null; unit: string | null }>;
  };

  const created = await prisma.groceryList.create({
    data: {
      name,
      items: {
        create: preview.items.map((it) => ({
          ingredientId: it.ingredientId,
          amount: it.amount,
          unit: it.unit,
          checked: false,
        })),
      },
      recipes: {
        create: preview.recipes.map((r) => ({ recipeId: r.id })),
      },
    },
    include: {
      items: { include: { ingredient: true } },
      recipes: { include: { recipe: true } },
    },
  });

  return reply.code(201).send(created);
});

app.get("/grocery-lists", async () => {
  return prisma.groceryList.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { items: true } },
    },
  });
});
app.get("/grocery-lists/:id", async (req, reply) => {
  const { id } = req.params as { id: string };

  const list = await prisma.groceryList.findUnique({
    where: { id },
    include: {
      recipes: { include: { recipe: true } },
      items: { include: { ingredient: true }, orderBy: [{ checked: "asc" }, { ingredient: { name: "asc" } }] },
    },
  });

  if (!list) return reply.code(404).send({ error: "not found" });
  return list;
});

app.delete("/grocery-lists/:id", async (req, reply) => {
  const { id } = req.params as { id: string };
  await prisma.groceryList.delete({ where: { id } });
  return reply.code(204).send();
});
app.patch("/grocery-lists/:id", async (req, reply) => {
  const { id } = req.params as { id: string };
  const body = req.body as { name?: string };
  const name = (body.name ?? "").trim();
  if (!name) return reply.code(400).send({ error: "name is required" });

  const updated = await prisma.groceryList.update({
    where: { id },
    data: { name },
  });

  return reply.send(updated);
});

app.post("/grocery-lists/preview", async (req, reply) => {
  const body = (req.body ?? {}) as { recipeIds?: string[]; pantryIngredients?: string[] };

  const recipeIds = (body.recipeIds ?? []).filter(Boolean);
  if (recipeIds.length === 0) return reply.code(400).send({ error: "recipeIds required" });

  const pantrySet = new Set((body.pantryIngredients ?? []).map(normalize).filter(Boolean));

  const recipes = await prisma.recipe.findMany({
    where: { id: { in: recipeIds } },
    include: { ingredients: { include: { ingredient: true } } },
    orderBy: { createdAt: "desc" },
  });

  const all = recipes.flatMap((r) =>
    r.ingredients
      .filter((ri) => !ri.optional)
      .map((ri) => ({
        ingredientId: ri.ingredientId,
        ingredientName: ri.ingredient.name,
        amount: ri.amount,
        unit: ri.unit,
      }))
  );

  const needed = all.filter((x) => !pantrySet.has(normalize(x.ingredientName)));

  const key = (x: { ingredientId: string; unit: string | null }) =>
    `${x.ingredientId}__${x.unit ?? ""}`;

  const grouped = new Map<
    string,
    { ingredientId: string; unit: string | null; amount: number | null; anyNull: boolean }
  >();

  for (const x of needed) {
    const k = key({ ingredientId: x.ingredientId, unit: x.unit });
    const g = grouped.get(k);
    const amountNull = x.amount == null;

    if (!g) {
      grouped.set(k, {
        ingredientId: x.ingredientId,
        unit: x.unit ?? null,
        amount: amountNull ? null : x.amount!,
        anyNull: amountNull,
      });
    } else {
      if (amountNull || g.anyNull) {
        g.anyNull = true;
        g.amount = null;
      } else {
        g.amount = (g.amount ?? 0) + x.amount!;
      }
    }
  }

  // return items with ingredient names (for UI)
  const ingredientIds = Array.from(grouped.values()).map((g) => g.ingredientId);
  const ingredients = await prisma.ingredient.findMany({ where: { id: { in: ingredientIds } } });
  const nameById = new Map(ingredients.map((i) => [i.id, i.name]));

  const items = Array.from(grouped.values())
    .map((g) => ({
      ingredientId: g.ingredientId,
      ingredientName: nameById.get(g.ingredientId) ?? "unknown",
      amount: g.amount,
      unit: g.unit,
    }))
    .sort((a, b) => String(a.ingredientName).localeCompare(String(b.ingredientName)));

  return reply.send({
    recipes: recipes.map((r) => ({ id: r.id, title: r.title })),
    items,
  });
});
// --- TheMealDB integration ---

app.get("/external/meals/search", async (req, reply) => {
  const { q } = (req.query as { q?: string }) ?? {};
  const query = (q ?? "").trim();
  if (!query) return reply.code(400).send({ error: "q is required" });

  const results = await searchMealsByName(query);
  return { results };
});

app.post("/external/meals/import", async (req, reply) => {
  const body = (req.body ?? {}) as { mealId?: string };

  const mealId = String(body.mealId ?? "").trim();
  if (!mealId) return reply.code(400).send({ error: "mealId is required" });

  const meal = await lookupMealById(mealId);
  if (!meal) return reply.code(404).send({ error: "meal not found" });

  // Convert meal -> your schema
  // - Ingredients: we import as Ingredient rows + RecipeIngredient rows
  // - Steps: split instructions into simple lines
  const normalized = (name: string) => name.trim().toLowerCase();

  const steps = meal.instructions
    .split(/\r?\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const created = await prisma.recipe.create({
    data: {
      title: meal.title.trim(),
      ingredients: {
        create: await Promise.all(
          meal.ingredients.map(async (ing) => {
            const name = normalized(ing.name);
            const ingredient = await prisma.ingredient.upsert({
              where: { name },
              update: {},
              create: { name },
            });

            // We store the "measure" as unit for now (MVP)
            // amount stays null because TheMealDB measure is often "1 tsp", "a handful", etc.
            return {
              ingredientId: ingredient.id,
              amount: null,
              unit: ing.measure,
              optional: false,
            };
          })
        ),
      },
      steps: {
        create: (steps.length ? steps : ["Follow TheMealDB instructions."]).map((text, idx) => ({
          order: idx + 1,
          text,
        })),
      },
    },
    include: {
      ingredients: { include: { ingredient: true } },
      steps: { orderBy: { order: "asc" } },
    },
  });

  return reply.code(201).send(created);
});
app.get("/external/meals/suggestions", async (req) => {
  const count = Math.min(Math.max(Number((req.query as any)?.count ?? 3), 1), 6);

  const seen = new Set<string>();
  const results: Array<{ id: string; title: string; thumb: string | null }> = [];

  // Try a few extra times to avoid duplicates
  for (let tries = 0; tries < count * 3 && results.length < count; tries++) {
    const m = await getRandomMeal();
    if (!m) continue;
    if (seen.has(m.id)) continue;
    seen.add(m.id);
    results.push(m);
  }

  return { results };
});



const PORT = Number(process.env.PORT ?? 4000);
app.listen({ port: PORT, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
