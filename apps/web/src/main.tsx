import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { RecipesPage } from "./pages/RecipesPage";
import { RecipeDetailPage } from "./pages/RecipeDetailPage";
import { NewRecipePage } from "./pages/NewRecipePage";
import { CookPage } from "./pages/CookPage";
import { GroceryPage } from "./pages/GroceryPage";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/recipes" element={<RecipesPage />} />
        <Route path="/recipes/new" element={<NewRecipePage />} />
        <Route path="/recipes/:id" element={<RecipeDetailPage />} />
        <Route path="*" element={<Navigate to="/recipes" replace />} />
        <Route path="/cook" element={<CookPage />} />
        <Route path="/grocery" element={<GroceryPage />} />

      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
