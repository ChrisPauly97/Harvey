"use client";

import BookCard from "@/components/BookCard";
import { Book } from "@/lib/schema";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const response = await fetch("/api/books");
      if (!response.ok) {
        throw new Error("Failed to fetch books");
      }
      const data = await response.json();
      // Ensure data is an array
      setBooks(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching books:", error);
      setBooks([]); // Set to empty array on error
      setLoading(false);
    }
  };

  const handleDelete = (id: number) => {
    setBooks((prev) => prev.filter((book) => book.id !== id));
  };

  // Filter books based on search query
  const filteredBooks = books.filter((book) => {
    const query = searchQuery.toLowerCase();
    return (
      book.title.toLowerCase().includes(query) ||
      book.isbn.includes(query) ||
      (book.authors && book.authors.some((author) => author.toLowerCase().includes(query))) ||
      (book.publisher && book.publisher.toLowerCase().includes(query))
    );
  });

  const totalBooks = books.reduce((sum, book) => sum + book.quantity, 0);

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                📚 My Library
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {totalBooks} {totalBooks === 1 ? "book" : "books"} in collection
              </p>
            </div>
            <Link
              href="/books/scan"
              className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white px-4 py-2 rounded-lg font-semibold transition-all shadow-sm active:scale-95"
            >
              + Add Book
            </Link>
          </div>

          {/* Search Bar */}
          {books.length > 0 && (
            <div className="relative">
              <input
                type="text"
                placeholder="Search by title, author, ISBN, or publisher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-gray-700 border-t-purple-500"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">
              Loading library...
            </p>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">
              {searchQuery ? "🔍" : "📚"}
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {searchQuery ? "No books found" : "No books yet"}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchQuery
                ? "Try a different search term"
                : "Scan your first book to get started!"}
            </p>
            {!searchQuery && (
              <Link
                href="/books/scan"
                className="inline-block bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-md active:scale-95"
              >
                + Add Your First Book
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Search Results Info */}
            {searchQuery && (
              <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                Found {filteredBooks.length} {filteredBooks.length === 1 ? "book" : "books"}
              </div>
            )}

            {/* Books Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredBooks.map((book) => (
                <BookCard key={book.id} book={book} onDelete={handleDelete} />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
