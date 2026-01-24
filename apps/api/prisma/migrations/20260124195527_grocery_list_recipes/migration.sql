-- CreateTable
CREATE TABLE "GroceryListRecipe" (
    "id" TEXT NOT NULL,
    "groceryListId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,

    CONSTRAINT "GroceryListRecipe_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GroceryListRecipe_groceryListId_recipeId_key" ON "GroceryListRecipe"("groceryListId", "recipeId");

-- AddForeignKey
ALTER TABLE "GroceryListRecipe" ADD CONSTRAINT "GroceryListRecipe_groceryListId_fkey" FOREIGN KEY ("groceryListId") REFERENCES "GroceryList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroceryListRecipe" ADD CONSTRAINT "GroceryListRecipe_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
