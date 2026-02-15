"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface BottomNavProps {
  shoppingListCount?: number;
  recipeCount?: number;
}

export default function BottomNav({
  shoppingListCount = 0,
  recipeCount = 0,
}: BottomNavProps) {
  const pathname = usePathname();
  const isInventory = pathname === "/";
  const isShopping = pathname === "/shopping-list";
  const isRecipes = pathname === "/recipes";

  return (
    <div className="fixed bottom-0 inset-x-0 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 z-40 safe-bottom">
      <div className="flex">
        <Link
          href="/"
          className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
            isInventory
              ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
          }`}
        >
          📦 Inventory
        </Link>
        <Link
          href="/recipes"
          className={`flex-1 py-3 px-4 text-center font-medium transition-colors relative ${
            isRecipes
              ? "bg-gradient-to-r from-orange-500 to-red-500 text-white"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
          }`}
        >
          🍳 Recipes
          {recipeCount > 0 && (
            <span className="absolute top-1 right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
              {recipeCount > 99 ? "99+" : recipeCount}
            </span>
          )}
        </Link>
        <Link
          href="/shopping-list"
          className={`flex-1 py-3 px-4 text-center font-medium transition-colors relative ${
            isShopping
              ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
          }`}
        >
          🛒 Shopping
          {shoppingListCount > 0 && (
            <span className="absolute top-1 right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
              {shoppingListCount > 99 ? "99+" : shoppingListCount}
            </span>
          )}
        </Link>
      </div>
    </div>
  );
}
