"use client";

import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import { useEffect, useState } from "react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [shoppingListCount, setShoppingListCount] = useState(0);
  const [recipeCount, setRecipeCount] = useState(0);
  const [booksCount, setBooksCount] = useState(0);
  const [cachingRecipes, setCachingRecipes] = useState(false);

  useEffect(() => {
    async function cacheRecipesIfNeeded() {
      try {
        const lastCacheTime = localStorage.getItem("recipeCacheTime");
        const now = Date.now();
        const ONE_DAY = 24 * 60 * 60 * 1000;

        // Only cache if it's been more than 24 hours
        if (!lastCacheTime || now - parseInt(lastCacheTime) > ONE_DAY) {
          setCachingRecipes(true);
          const response = await fetch("/api/recipes/cache", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              categories: ["Dessert", "Vegetarian", "Seafood", "Breakfast", "Pasta"],
              limit: 100,
            }),
          });

          if (response.ok) {
            localStorage.setItem("recipeCacheTime", now.toString());
            console.log("Recipes cached successfully");
          }
          setCachingRecipes(false);
        }
      } catch (error) {
        console.error("Failed to cache recipes:", error);
        setCachingRecipes(false);
      }
    }

    async function fetchCounts() {
      try {
        // Fetch shopping list count
        const shoppingResponse = await fetch("/api/shopping-list");
        if (shoppingResponse.ok) {
          const data = await shoppingResponse.json();
          const unpurchasedCount = (data.manual || []).filter((i: any) => !i.isPurchased).length +
            (data.recurring || []).filter((i: any) => !i.isPurchased).length;
          setShoppingListCount(unpurchasedCount);
        }

        // Fetch recipe count
        const recipesResponse = await fetch("/api/recipes/suggestions?limit=100");
        if (recipesResponse.ok) {
          const data = await recipesResponse.json();
          setRecipeCount((data.recipes || []).length);
        }

        // Fetch books count
        const booksResponse = await fetch("/api/books");
        if (booksResponse.ok) {
          const data = await booksResponse.json();
          const totalBooks = data.reduce((sum: number, book: any) => sum + book.quantity, 0);
          setBooksCount(totalBooks);
        }
      } catch (error) {
        console.error("Failed to fetch counts:", error);
      }
    }

    // Cache recipes on app load if needed (once per day)
    cacheRecipesIfNeeded();

    // Fetch initial counts
    fetchCounts();

    // Refresh counts every 30 seconds
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <html lang="en" className="dark">
      <body>
        {children}

        {/* Caching indicator toast */}
        {cachingRecipes && (
          <div className="fixed bottom-24 right-4 z-50 animate-pulse rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white shadow-lg">
            📥 Caching recipes...
          </div>
        )}

        <BottomNav shoppingListCount={shoppingListCount} recipeCount={recipeCount} booksCount={booksCount} />
      </body>
    </html>
  );
}
