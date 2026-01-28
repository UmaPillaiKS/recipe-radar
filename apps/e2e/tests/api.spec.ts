import { test, expect, request } from "@playwright/test";

test("API health is ok", async () => {
  const API_URL = process.env.API_URL || "http://localhost:4000";
  const api = await request.newContext({ baseURL: API_URL });

  const res = await api.get("/health");
  expect(res.ok()).toBeTruthy();
  const json = await res.json();
  expect(json.ok).toBe(true);
});

test("MealDB search proxy works (if enabled)", async () => {
  const API_URL = process.env.API_URL || "http://localhost:4000";
  const api = await request.newContext({ baseURL: API_URL });

  const res = await api.get("/external/meals/search?q=chicken");
  // If you haven’t added this yet, remove this test for now.
  expect(res.ok()).toBeTruthy();
  const json = await res.json();
  expect(Array.isArray(json.results)).toBe(true);
});
