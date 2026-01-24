/*
  Warnings:

  - You are about to drop the column `planId` on the `GroceryItem` table. All the data in the column will be lost.
  - You are about to drop the column `recipeIngredientId` on the `PlanItem` table. All the data in the column will be lost.
  - Added the required column `groceryListId` to the `GroceryItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "GroceryItem" DROP CONSTRAINT "GroceryItem_planId_fkey";

-- DropForeignKey
ALTER TABLE "PlanItem" DROP CONSTRAINT "PlanItem_recipeIngredientId_fkey";

-- DropIndex
DROP INDEX "GroceryItem_planId_idx";

-- AlterTable
ALTER TABLE "GroceryItem" DROP COLUMN "planId",
ADD COLUMN     "groceryListId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PlanItem" DROP COLUMN "recipeIngredientId";

-- CreateTable
CREATE TABLE "GroceryList" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroceryList_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GroceryItem_groceryListId_idx" ON "GroceryItem"("groceryListId");

-- AddForeignKey
ALTER TABLE "GroceryItem" ADD CONSTRAINT "GroceryItem_groceryListId_fkey" FOREIGN KEY ("groceryListId") REFERENCES "GroceryList"("id") ON DELETE CASCADE ON UPDATE CASCADE;
