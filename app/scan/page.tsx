"use client";

import BarcodeScanner from "@/components/BarcodeScanner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ScanPage() {
  const router = useRouter();
  const [manualBarcode, setManualBarcode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<"fridge" | "pantry">("fridge");

  const addItem = async (barcode: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ barcode, category }),
      });

      if (!response.ok) {
        throw new Error("Failed to add item");
      }

      // Redirect to home page
      router.push("/");
    } catch (err) {
      console.error("Error adding item:", err);
      setError("Failed to add item. Please try again.");
      setLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualBarcode.trim()) {
      addItem(manualBarcode.trim());
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="text-green-600 hover:text-green-700 font-medium"
          >
            ← Back
          </Link>
          <h1 className="text-3xl font-bold text-green-900">Scan Item</h1>
          <div className="w-24"></div> {/* Spacer for centering */}
        </div>

        {loading ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            <p className="mt-4 text-gray-600">Adding item...</p>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {/* Category Selector */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Storage Location</h2>
              <div className="flex gap-4">
                <button
                  onClick={() => setCategory("fridge")}
                  className={`flex-1 py-4 px-6 rounded-lg font-semibold text-lg transition-all ${
                    category === "fridge"
                      ? "bg-blue-500 text-white shadow-lg"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  🧊 Fridge
                </button>
                <button
                  onClick={() => setCategory("pantry")}
                  className={`flex-1 py-4 px-6 rounded-lg font-semibold text-lg transition-all ${
                    category === "pantry"
                      ? "bg-amber-500 text-white shadow-lg"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  🥫 Pantry
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Camera Scanner</h2>
              <BarcodeScanner onScan={addItem} />
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Manual Entry</h2>
              <p className="text-gray-600 mb-4">
                Can't scan? Enter the barcode manually:
              </p>
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  placeholder="Enter barcode number"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  type="submit"
                  disabled={!manualBarcode.trim()}
                  className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Add
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
