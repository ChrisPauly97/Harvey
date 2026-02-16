import { db } from "@/lib/db";
import { books } from "@/lib/schema";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

// GET /api/books - List all books
export async function GET() {
  try {
    const allBooks = await db
      .select()
      .from(books)
      .orderBy(desc(books.addedAt));

    return NextResponse.json(allBooks);
  } catch (error) {
    console.error("Error fetching books:", error);
    return NextResponse.json(
      { error: "Failed to fetch books" },
      { status: 500 }
    );
  }
}

// Helper function to resolve author names from Open Library API
async function resolveAuthorNames(authorKeys: string[]): Promise<string[]> {
  const authorNames: string[] = [];

  for (const key of authorKeys.slice(0, 5)) { // Limit to 5 authors max
    try {
      const authorId = key.replace("/authors/", "");
      const response = await fetch(`https://openlibrary.org/authors/${authorId}.json`);
      const data = await response.json();
      if (data.name) {
        authorNames.push(data.name);
      }
    } catch (error) {
      console.warn(`Failed to resolve author ${key}:`, error);
    }
  }

  return authorNames;
}

// POST /api/books - Add a new book or increment quantity
export async function POST(request: Request) {
  try {
    const { isbn } = await request.json();

    if (!isbn) {
      return NextResponse.json(
        { error: "ISBN is required" },
        { status: 400 }
      );
    }

    // Check if book with ISBN already exists
    const existingBook = await db
      .select()
      .from(books)
      .where(eq(books.isbn, isbn));

    if (existingBook.length > 0) {
      // Book exists, increment quantity
      const [updatedBook] = await db
        .update(books)
        .set({ quantity: existingBook[0].quantity + 1 })
        .where(eq(books.id, existingBook[0].id))
        .returning();

      return NextResponse.json(updatedBook, { status: 200 });
    }

    // Fetch book info from Open Library API
    let bookTitle = isbn;
    let authorsList: string[] = [];
    let publisher = null;
    let publishDate = null;
    let pageCount = null;
    let coverUrl = null;
    let description = null;
    let language = null;

    try {
      const response = await fetch(
        `https://openlibrary.org/isbn/${isbn}.json`
      );

      if (response.ok) {
        const data = await response.json();

        // Extract basic info
        bookTitle = data.title || isbn;
        publisher = data.publishers?.[0] || null;
        publishDate = data.publish_date || null;
        pageCount = data.number_of_pages || null;

        // Resolve author names
        if (data.authors && data.authors.length > 0) {
          const authorKeys = data.authors.map((a: any) => a.key);
          authorsList = await resolveAuthorNames(authorKeys);
        }

        // Get cover image
        if (data.covers && data.covers.length > 0) {
          coverUrl = `https://covers.openlibrary.org/b/id/${data.covers[0]}-M.jpg`;
        } else {
          // Try ISBN-based cover as fallback
          coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;
        }

        // Get description if available
        if (data.description) {
          description = typeof data.description === 'string'
            ? data.description
            : data.description.value;
        }

        // Get language
        if (data.languages && data.languages.length > 0) {
          language = data.languages[0].key.replace("/languages/", "");
        }
      }
    } catch (apiError) {
      console.warn("Failed to fetch book data from Open Library:", apiError);
      // Continue with ISBN as title if API fails
    }

    // Insert new book into database
    const [newBook] = await db
      .insert(books)
      .values({
        isbn,
        title: bookTitle,
        authors: authorsList,
        publisher,
        publishDate,
        pageCount,
        coverUrl,
        description,
        language,
        quantity: 1,
      })
      .returning();

    return NextResponse.json(newBook, { status: 201 });
  } catch (error) {
    console.error("Error adding book:", error);
    return NextResponse.json(
      { error: "Failed to add book" },
      { status: 500 }
    );
  }
}
