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

  useEffect(() => {
    async function fetchCount() {
      try {
        const response = await fetch("/api/shopping-list");
        if (response.ok) {
          const data = await response.json();
          const unpurchasedCount = (data.manual || []).filter((i: any) => !i.isPurchased).length +
            (data.recurring || []).filter((i: any) => !i.isPurchased).length;
          setShoppingListCount(unpurchasedCount);
        }
      } catch (error) {
        console.error("Failed to fetch shopping list count:", error);
      }
    }

    fetchCount();
    // Refresh count every 30 seconds
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <html lang="en" className="dark">
      <body>
        {children}
        <BottomNav shoppingListCount={shoppingListCount} />
      </body>
    </html>
  );
}
