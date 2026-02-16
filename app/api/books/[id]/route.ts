import { db } from "@/lib/db";
import { books } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

// GET /api/books/[id] - Fetch single book by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid book ID" },
        { status: 400 }
      );
    }

    const [book] = await db.select().from(books).where(eq(books.id, id));

    if (!book) {
      return NextResponse.json(
        { error: "Book not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(book);
  } catch (error) {
    console.error("Error fetching book:", error);
    return NextResponse.json(
      { error: "Failed to fetch book" },
      { status: 500 }
    );
  }
}

// PATCH /api/books/[id] - Update book fields
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid book ID" },
        { status: 400 }
      );
    }

    const updates = await request.json();

    const [updatedBook] = await db
      .update(books)
      .set(updates)
      .where(eq(books.id, id))
      .returning();

    if (!updatedBook) {
      return NextResponse.json(
        { error: "Book not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedBook);
  } catch (error) {
    console.error("Error updating book:", error);
    return NextResponse.json(
      { error: "Failed to update book" },
      { status: 500 }
    );
  }
}

// DELETE /api/books/[id] - Remove book or decrement quantity
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid book ID" },
        { status: 400 }
      );
    }

    // Fetch the book first
    const [book] = await db.select().from(books).where(eq(books.id, id));

    if (!book) {
      return NextResponse.json(
        { error: "Book not found" },
        { status: 404 }
      );
    }

    // If quantity > 1, decrement
    if (book.quantity > 1) {
      const [updatedBook] = await db
        .update(books)
        .set({ quantity: book.quantity - 1 })
        .where(eq(books.id, id))
        .returning();

      return NextResponse.json(updatedBook);
    }

    // If quantity === 1, delete the record
    await db.delete(books).where(eq(books.id, id));

    return NextResponse.json({ success: true, deleted: true });
  } catch (error) {
    console.error("Error deleting book:", error);
    return NextResponse.json(
      { error: "Failed to delete book" },
      { status: 500 }
    );
  }
}
