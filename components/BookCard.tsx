"use client";

import { Book } from "@/lib/schema";
import { useState } from "react";

interface BookCardProps {
  book: Book;
  onDelete: (id: number) => void;
}

export default function BookCard({ book, onDelete }: BookCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (isDeleting) return;

    const confirmMsg =
      book.quantity > 1
        ? `Remove one copy of "${book.title}"? (${book.quantity - 1} will remain)`
        : `Remove "${book.title}" from your collection?`;

    if (!confirm(confirmMsg)) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/books/${book.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete book");
      }

      onDelete(book.id);
    } catch (error) {
      console.error("Error deleting book:", error);
      alert("Failed to delete book. Please try again.");
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
      {/* Cover Image */}
      <div className="relative aspect-[2/3] bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/20 dark:to-indigo-900/20">
        {book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt={book.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl">📚</span>
          </div>
        )}

        {/* Quantity Badge */}
        {book.quantity > 1 && (
          <div className="absolute top-2 right-2 bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
            ×{book.quantity}
          </div>
        )}
      </div>

      {/* Book Info */}
      <div className="p-4">
        <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 line-clamp-2 mb-1">
          {book.title}
        </h3>

        {book.authors && book.authors.length > 0 && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-1">
            by {book.authors.join(", ")}
          </p>
        )}

        <div className="space-y-1 text-xs text-gray-500 dark:text-gray-500 mb-3">
          {book.publisher && (
            <p className="line-clamp-1">
              <span className="font-semibold">Publisher:</span> {book.publisher}
            </p>
          )}
          {book.publishDate && (
            <p>
              <span className="font-semibold">Published:</span> {book.publishDate}
            </p>
          )}
          {book.pageCount && (
            <p>
              <span className="font-semibold">Pages:</span> {book.pageCount}
            </p>
          )}
          <p className="text-gray-400 dark:text-gray-600">
            ISBN: {book.isbn}
          </p>
        </div>

        {/* Delete Button */}
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="w-full bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDeleting ? "Removing..." : book.quantity > 1 ? "Remove One" : "Remove"}
        </button>
      </div>
    </div>
  );
}
