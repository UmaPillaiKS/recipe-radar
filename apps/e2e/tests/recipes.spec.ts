import { test, expect, request } from "@playwright/test";

test("Add recipe via API, shows in UI list, opens detail", async ({ page }) => {
  const API_URL = process.env.API_URL || "http://localhost:4000";
  const unique = `E2E Omelette ${Date.now()}`;

  // 1) API: create recipe
  const api = await request.newContext({ baseURL: API_URL });
  const createRes = await api.post("/recipes", {
    data: {
      title: unique,
      ingredients: [{ name: "eggs", amount: 2, unit: "pcs", optional: false }],
      steps: ["Crack eggs", "Cook"],
    },
  });
  expect(createRes.ok()).toBeTruthy();
  const created = await createRes.json();
  expect(created.id).toBeTruthy();

  // 2) UI: open recipes page and find it
  await page.goto("/recipes");
  await expect(page.getByRole("heading", { name: "Your recipes" })).toBeVisible();

  await expect(page.getByRole("link", { name: unique })).toBeVisible();

  // 3) UI: open detail and verify ingredient + step
  await page.getByRole("link", { name: unique }).click();

  await expect(page.getByRole("heading", { name: unique })).toBeVisible();
  await expect(page.getByText("eggs", { exact: true })).toBeVisible();
  await expect(page.getByText("Crack eggs", { exact: true })).toBeVisible();
});
