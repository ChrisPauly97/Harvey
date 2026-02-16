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

  useEffect(() => {
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

    fetchCounts();
    // Refresh counts every 60 seconds
    const interval = setInterval(fetchCounts, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <html lang="en" className="dark">
      <body>
        {children}
        <BottomNav shoppingListCount={shoppingListCount} recipeCount={recipeCount} booksCount={booksCount} />
      </body>
    </html>
  );
}
