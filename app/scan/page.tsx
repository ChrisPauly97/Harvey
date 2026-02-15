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
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-semibold transition-colors"
            >
              <span className="text-xl">←</span> Back
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Add Item</h1>
            <div className="w-16"></div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-emerald-500"></div>
            <p className="mt-4 text-gray-600 font-medium">Adding item...</p>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
                {error}
              </div>
            )}

            {/* Category Selector */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">
                Where are you storing this?
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setCategory("fridge")}
                  className={`py-4 px-4 rounded-xl font-semibold transition-all ${
                    category === "fridge"
                      ? "bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-md"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  <div className="text-3xl mb-1">🧊</div>
                  <div className="text-sm">Fridge</div>
                </button>
                <button
                  onClick={() => setCategory("pantry")}
                  className={`py-4 px-4 rounded-xl font-semibold transition-all ${
                    category === "pantry"
                      ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  <div className="text-3xl mb-1">🥫</div>
                  <div className="text-sm">Pantry</div>
                </button>
              </div>
            </div>

            {/* Camera Scanner */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">
                📸 Scan Barcode
              </h2>
              <BarcodeScanner onScan={addItem} />
            </div>

            {/* Manual Entry */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold mb-2 text-gray-900">
                ⌨️ Manual Entry
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Can&apos;t scan? Enter the barcode manually
              </p>
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  placeholder="Enter barcode number"
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={!manualBarcode.trim()}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-sm active:scale-95"
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
