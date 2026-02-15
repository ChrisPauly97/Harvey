"use client";

import ItemCard from "@/components/ItemCard";
import { Item } from "@/lib/schema";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "fridge" | "pantry">("all");

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/items");
      if (!response.ok) throw new Error("Failed to fetch items");
      const data = await response.json();
      setItems(data);
      setError(null);
    } catch (err) {
      setError("Failed to load items. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleDelete = async (id: number) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    const confirmed = window.confirm(
      `Are you sure you want to remove all ${item.quantity} ${
        item.quantity === 1 ? "item" : "items"
      } of "${item.name}"?`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/items/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete item");

      // Item was deleted, remove from state
      setItems(items.filter((item) => item.id !== id));
    } catch (err) {
      alert("Failed to delete item. Please try again.");
      console.error(err);
    }
  };

  const handleUpdateQuantity = async (
    id: number,
    action: "increment" | "decrement"
  ) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    // Confirm if decrementing will delete the item
    if (action === "decrement" && item.quantity === 1) {
      const confirmed = window.confirm(
        `This will remove "${item.name}" from your inventory. Continue?`
      );
      if (!confirmed) return;
    }

    try {
      const response = await fetch(`/api/items/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) throw new Error("Failed to update quantity");

      const data = await response.json();

      if (data.deleted) {
        // Item was deleted (quantity reached 0)
        setItems(items.filter((item) => item.id !== id));
      } else {
        // Update quantity in state
        setItems(
          items.map((item) => (item.id === id ? { ...item, ...data } : item))
        );
      }
    } catch (err) {
      alert("Failed to update quantity. Please try again.");
      console.error(err);
    }
  };

  const filteredItems =
    filter === "all" ? items : items.filter((item) => item.category === filter);

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-green-900">
            🍽️ Harvey
          </h1>
          <Link
            href="/scan"
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold text-lg shadow-lg transition-colors"
          >
            + Add Item
          </Link>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setFilter("all")}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              filter === "all"
                ? "bg-green-500 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            All ({items.length})
          </button>
          <button
            onClick={() => setFilter("fridge")}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              filter === "fridge"
                ? "bg-blue-500 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            🧊 Fridge ({items.filter((i) => i.category === "fridge").length})
          </button>
          <button
            onClick={() => setFilter("pantry")}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              filter === "pantry"
                ? "bg-amber-500 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            🥫 Pantry ({items.filter((i) => i.category === "pantry").length})
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            <p className="mt-4 text-gray-600">Loading your inventory...</p>
          </div>
        ) : filteredItems.length === 0 && items.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-xl text-gray-600 mb-4">Your kitchen is empty!</p>
            <p className="text-gray-500 mb-6">
              Start scanning items to track your inventory
            </p>
            <Link
              href="/scan"
              className="inline-block bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold"
            >
              Scan Your First Item
            </Link>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-xl text-gray-600">
              No items in {filter === "fridge" ? "fridge" : "pantry"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600">
              {filteredItems.length}{" "}
              {filteredItems.length === 1 ? "item" : "items"}
              {filter !== "all" &&
                ` in ${filter === "fridge" ? "fridge" : "pantry"}`}
            </p>
            {filteredItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onDelete={handleDelete}
                onUpdateQuantity={handleUpdateQuantity}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
