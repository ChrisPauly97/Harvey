"use client";

import KeyboardBarcodeScanner from "@/components/KeyboardBarcodeScanner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface ScannedBook {
  isbn: string;
  title?: string;
  timestamp: number;
}

export default function BookScanPage() {
  const router = useRouter();
  const [manualIsbn, setManualIsbn] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [scannedBooks, setScannedBooks] = useState<ScannedBook[]>([]);

  // Auto-hide success message after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const addBook = async (isbn: string) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await fetch("/api/books", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isbn }),
      });

      if (!response.ok) {
        throw new Error("Failed to add book");
      }

      const data = await response.json();

      // Add to scanned books list for continuous scanning
      setScannedBooks((prev) => [
        { isbn, title: data.title, timestamp: Date.now() },
        ...prev,
      ]);

      setSuccess(`✅ Added: ${data.title || isbn}`);
      setLoading(false);
    } catch (err) {
      console.error("Error adding book:", err);
      setError("Failed to add book. Please try again.");
      setLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (manualIsbn.trim()) {
      addBook(manualIsbn.trim());
      setManualIsbn("");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/books"
              className="flex items-center gap-2 text-purple-600 dark:text-purple-500 hover:text-purple-700 dark:hover:text-purple-400 font-semibold transition-colors"
            >
              <span className="text-xl">←</span> Back
            </Link>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Add Book
            </h1>
            <div className="w-16"></div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 pb-20">
        {/* Success Toast */}
        {success && (
          <div className="fixed top-20 left-4 right-4 max-w-sm mx-auto bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-xl shadow-lg animate-pulse z-50">
            {success}
          </div>
        )}

        {/* Continuous Scanning Active Banner */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-4 py-3 rounded-xl mb-4 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🔄</span>
              <div>
                <p className="font-semibold">Continuous Scanning Active</p>
                <p className="text-xs opacity-90">Just scan ISBNs - no clicking needed!</p>
              </div>
            </div>
            {scannedBooks.length > 0 && (
              <div className="bg-white/20 px-3 py-1 rounded-full">
                <p className="font-bold">{scannedBooks.length}</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        {loading ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-gray-700 border-t-purple-500"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">
              Adding book...
            </p>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl mb-4">
                {error}
              </div>
            )}

            {/* Keyboard Scanner */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-4">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                📡 ISBN Scanner
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Use a barcode scanner to scan book ISBNs
              </p>
              <KeyboardBarcodeScanner onScan={addBook} />
            </div>

            {/* Manual Entry */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-4">
              <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                ⌨️ Manual Entry
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Can&apos;t scan? Enter the ISBN manually
              </p>
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={manualIsbn}
                  onChange={(e) => setManualIsbn(e.target.value)}
                  placeholder="Enter ISBN number"
                  className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={!manualIsbn.trim()}
                  className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-sm active:scale-95"
                >
                  Add
                </button>
              </form>
            </div>

            {/* Recently Scanned Books */}
            {scannedBooks.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-4">
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                  📋 Recently Scanned
                </h2>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {scannedBooks.map((book, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {book.title || book.isbn}
                        </p>
                        {book.title && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            ISBN: {book.isbn}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(book.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Finish Button */}
            {scannedBooks.length > 0 && (
              <button
                onClick={() => router.push("/books")}
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white px-6 py-4 rounded-xl font-semibold transition-all shadow-md active:scale-95"
              >
                ✅ Done - View Collection
              </button>
            )}
          </>
        )}
      </div>
    </main>
  );
}
