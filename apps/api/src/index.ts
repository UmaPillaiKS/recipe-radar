import Fastify from "fastify";
import cors from "@fastify/cors";
import { prisma } from "./prisma.js";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: ["http://localhost:5173"],
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
app.post("/grocery/generate", async () => {
  // make sure plan exists
  const plan = await prisma.plan.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });

  const planItems = await prisma.planItem.findMany({
    where: { planId: plan.id },
    include: {
      recipe: {
        include: {
          ingredients: { include: { ingredient: true } },
        },
      },
    },
  });

  // take only required ingredients (optional=false)
  const all = planItems.flatMap((pi) =>
    pi.recipe.ingredients
      .filter((ri) => !ri.optional)
      .map((ri) => ({
        ingredientId: ri.ingredientId,
        amount: ri.amount,
        unit: ri.unit,
      }))
  );

  // aggregate by (ingredientId + unit)
  const key = (x: { ingredientId: string; unit: string | null }) =>
    `${x.ingredientId}__${x.unit ?? ""}`;

  const grouped = new Map<
    string,
    { ingredientId: string; unit: string | null; amount: number | null; anyNull: boolean }
  >();

  for (const x of all) {
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

  // replace grocery items (keep it simple for MVP)
  await prisma.groceryItem.deleteMany({ where: { planId: plan.id } });

  const createData = Array.from(grouped.values()).map((g) => ({
    planId: plan.id,
    ingredientId: g.ingredientId,
    amount: g.amount,
    unit: g.unit,
    checked: false,
  }));

  if (createData.length > 0) {
    await prisma.groceryItem.createMany({ data: createData });
  }

  return prisma.groceryItem.findMany({
    where: { planId: plan.id },
    include: { ingredient: true },
    orderBy: { checked: "asc" },
  });
});
app.get("/grocery", async () => {
  return prisma.groceryItem.findMany({
    where: { planId: "default" },
    include: { ingredient: true },
    orderBy: [{ checked: "asc" }, { ingredient: { name: "asc" } }],
  });
});
app.patch("/grocery/:id", async (req, reply) => {
  const { id } = req.params as { id: string };
  const body = req.body as { checked: boolean };

  const updated = await prisma.groceryItem.update({
    where: { id },
    data: { checked: Boolean(body.checked) },
    include: { ingredient: true },
  });

  return reply.send(updated);
});


const PORT = Number(process.env.PORT ?? 4000);
app.listen({ port: PORT, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
