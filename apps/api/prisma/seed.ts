import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  // Clear existing data (safe for dev)
  await prisma.groceryItem.deleteMany();
  await prisma.planItem.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.recipeStep.deleteMany();
  await prisma.recipeIngredient.deleteMany();
  await prisma.recipe.deleteMany();
  // Ingredient is shared; clear after dependents
  await prisma.ingredient.deleteMany();

  // Helper: upsert ingredient by normalized name
  async function upsertIngredient(name: string) {
    const normalized = name.trim().toLowerCase();
    return prisma.ingredient.upsert({
      where: { name: normalized },
      update: {},
      create: { name: normalized },
    });
  }

  async function createRecipe(args: {
    title: string;
    ingredients: Array<{ name: string; amount?: number; unit?: string; optional?: boolean }>;
    steps: string[];
  }) {
    return prisma.recipe.create({
      data: {
        title: args.title,
        ingredients: {
          create: await Promise.all(
            args.ingredients.map(async (ing) => {
              const ingredient = await upsertIngredient(ing.name);
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
          create: args.steps.map((text, idx) => ({
            order: idx + 1,
            text,
          })),
        },
      },
    });
  }

  await createRecipe({
    title: "Simple Omelette",
    ingredients: [
      { name: "eggs", amount: 2, unit: "pcs" },
      { name: "salt", optional: true },
      { name: "butter", amount: 1, unit: "tbsp", optional: true },
    ],
    steps: ["Beat eggs", "Heat pan", "Cook until set"],
  });

  await createRecipe({
    title: "Tomato Egg Stir Fry",
    ingredients: [
      { name: "eggs", amount: 3, unit: "pcs" },
      { name: "tomatoes", amount: 250, unit: "g" },
      { name: "salt", optional: true },
      { name: "oil", amount: 1, unit: "tbsp", optional: true },
    ],
    steps: ["Beat eggs", "Cook tomatoes", "Add eggs and stir"],
  });

  await createRecipe({
    title: "Garlic Butter Pasta",
    ingredients: [
      { name: "pasta", amount: 200, unit: "g" },
      { name: "garlic", amount: 2, unit: "cloves" },
      { name: "butter", amount: 2, unit: "tbsp" },
      { name: "salt", optional: true },
    ],
    steps: ["Boil pasta", "Sauté garlic in butter", "Toss pasta", "Season"],
  });

  // Ensure default plan exists (empty by default)
  await prisma.plan.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
