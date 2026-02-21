import { db } from "@/lib/db";
import { items } from "@/lib/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { logItemEvent } from "@/lib/events";
import { unstable_cache, revalidateTag } from "next/cache";

// Infer category from Open Food Facts category tags
function inferCategoryFromTags(
  categoriesTags: string[]
): "fridge" | "freezer" | "pantry" {
  const tags = categoriesTags.map((t) => t.toLowerCase());

  const frozenTerms = [
    "frozen",
    "ice-cream",
    "ice cream",
    "frozen-meal",
    "frozen-dessert",
    "frozen-food",
    "ice-cream",
  ];

  const fridgeTerms = [
    "dairy",
    "milk",
    "cheese",
    "yogurt",
    "yoghurt",
    "meat",
    "poultry",
    "fish",
    "seafood",
    "fresh",
    "chilled",
    "deli",
    "egg",
    "butter",
    "cream",
    "probiotic",
  ];

  // Check for frozen products
  if (tags.some((t) => frozenTerms.some((f) => t.includes(f)))) {
    return "freezer";
  }

  // Check for fridge products
  if (tags.some((t) => fridgeTerms.some((f) => t.includes(f)))) {
    return "fridge";
  }

  // Default to pantry
  return "pantry";
}

// Helper function to fetch from Open Food Facts
interface ProductData {
  name: string;
  imageUrl: string | null;
  brand: string | null;
  category: "fridge" | "freezer" | "pantry";
  source: string;
  caloriesPer100g: number | null;
  fatPer100g: number | null;
  carbohydratesPer100g: number | null;
  proteinPer100g: number | null;
  fiberPer100g: number | null;
  servingSize: string | null;
  nutriScore: string | null;
}

async function fetchFromOpenFoodFacts(
  barcode: string
): Promise<ProductData | null> {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
      { signal: AbortSignal.timeout(2000) }
    );
    const data = await response.json();

    if (data.status === 1 && data.product) {
      const product = data.product;
      const nutriments = product.nutriments || {};
      return {
        name: product.product_name || barcode,
        imageUrl: product.image_url || null,
        brand: product.brands || null,
        category: product.categories_tags
          ? inferCategoryFromTags(product.categories_tags)
          : "pantry",
        source: "OpenFoodFacts",
        caloriesPer100g: nutriments["energy-kcal_100g"] ?? null,
        fatPer100g: nutriments["fat_100g"] ?? null,
        carbohydratesPer100g: nutriments["carbohydrates_100g"] ?? null,
        proteinPer100g: nutriments["proteins_100g"] ?? null,
        fiberPer100g: nutriments["fiber_100g"] ?? null,
        servingSize: product.serving_size || null,
        nutriScore: product.nutrition_grades || null,
      };
    }
    return null;
  } catch (error) {
    console.warn("OpenFoodFacts fetch failed:", error);
    return null;
  }
}

// Helper function to fetch from EAN-Search API (free)
async function fetchFromEANSearch(barcode: string): Promise<ProductData | null> {
  try {
    const response = await fetch(
      `https://www.ean-search.org/?q=${barcode}&format=json`,
      { signal: AbortSignal.timeout(2000) }
    );
    const data = await response.json();

    if (data.product && data.product.title) {
      return {
        name: data.product.title || barcode,
        imageUrl: data.product.image || null,
        brand: data.product.brand || null,
        category: "pantry", // No category inference available
        source: "EAN-Search",
        caloriesPer100g: null,
        fatPer100g: null,
        carbohydratesPer100g: null,
        proteinPer100g: null,
        fiberPer100g: null,
        servingSize: null,
        nutriScore: null,
      };
    }
    return null;
  } catch (error) {
    console.warn("EAN-Search fetch failed:", error);
    return null;
  }
}

// Cached function to fetch all items
const getCachedItems = unstable_cache(
  async () => {
    const allItems = await db
      .select({
        id: items.id,
        barcode: items.barcode,
        name: items.name,
        quantity: items.quantity,
        category: items.category,
        addedAt: items.addedAt,
        imageUrl: items.imageUrl,
        expirationDate: items.expirationDate,
        usageLevel: items.usageLevel,
        brand: items.brand,
        tags: items.tags,
        parentId: items.parentId,
        portionSize: items.portionSize,
        portionUnit: items.portionUnit,
        portionAmount: items.portionAmount,
        isOriginal: items.isOriginal,
        caloriesPer100g: items.caloriesPer100g,
        fatPer100g: items.fatPer100g,
        carbohydratesPer100g: items.carbohydratesPer100g,
        proteinPer100g: items.proteinPer100g,
        fiberPer100g: items.fiberPer100g,
        servingSize: items.servingSize,
        nutriScore: items.nutriScore,
        childCount: sql<number>`(SELECT COUNT(*) FROM ${items} AS c WHERE c.parent_id = ${items.id})`.as('childCount'),
      })
      .from(items)
      .orderBy(desc(items.addedAt));

    return allItems;
  },
  ['items-list'],
  {
    revalidate: 30, // Cache for 30 seconds
    tags: ['items'],
  }
);

// GET /api/items - List all items with child count
export async function GET() {
  try {
    const allItems = await getCachedItems();

    return NextResponse.json(allItems, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error("Error fetching items:", error);
    return NextResponse.json(
      { error: "Failed to fetch items" },
      { status: 500 }
    );
  }
}

// POST /api/items - Add a new item
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { barcode, category, expirationDate, brand, name } = body;

    if (!barcode) {
      return NextResponse.json(
        { error: "Barcode is required" },
        { status: 400 }
      );
    }

    // If category is provided explicitly, validate it
    if (category && !["fridge", "freezer", "pantry"].includes(category)) {
      return NextResponse.json(
        { error: "Category must be 'fridge', 'freezer', or 'pantry'" },
        { status: 400 }
      );
    }

    // If name is explicitly provided (user entered it), use it directly
    let productName = name || barcode;
    let imageUrl = null;
    let productBrand = brand;
    let inferredCategory: "fridge" | "freezer" | "pantry" = "pantry";
    let productData: ProductData | null = null;

    // Only try API lookups if name wasn't explicitly provided
    if (!name) {
      // Try multiple API sources in order (with short timeouts)
      // 1. Try Open Food Facts (2s timeout)
      productData = await fetchFromOpenFoodFacts(barcode);
      if (productData) {
        console.log(`Found ${barcode} in ${productData.source}`);
      }

      // 2. If not found, try EAN-Search (2s timeout)
      if (!productData) {
        productData = await fetchFromEANSearch(barcode);
        if (productData) {
          console.log(`Found ${barcode} in ${productData.source}`);
        }
      }

      // Use fetched data or mark as not found
      if (productData) {
        productName = productData.name;
        imageUrl = productData.imageUrl;
        productBrand = productBrand || productData.brand;
        if (!category) {
          inferredCategory = productData.category;
        }
      } else {
        // Product not found in any API - don't create item yet
        console.warn(`Product ${barcode} not found in any API`);
        return NextResponse.json(
          {
            notFound: true,
            barcode,
            category: category || inferredCategory,
            message: "Product not found. Please provide a name.",
          },
          { status: 202 } // 202 Accepted - awaiting user input
        );
      }
    }

    // Use provided category or inferred category
    const finalCategory = category || inferredCategory;

    // Check if an ORIGINAL item already exists in this category
    // (portions can have the same barcode+category, but not original items)
    const existingItem = await db
      .select()
      .from(items)
      .where(
        and(
          eq(items.barcode, barcode),
          eq(items.category, finalCategory),
          sql`${items.parentId} IS NULL`
        )
      );

    if (existingItem.length > 0) {
      // Original item exists in this category, increment quantity
      const [updatedItem] = await db
        .update(items)
        .set({ quantity: sql`${items.quantity} + 1` })
        .where(eq(items.id, existingItem[0].id))
        .returning();

      // Log quantity increment event
      await logItemEvent({
        itemId: updatedItem.id,
        barcode: updatedItem.barcode,
        name: updatedItem.name,
        category: updatedItem.category,
        eventType: "quantity_increment",
        quantityChange: 1,
        metadata: { newQuantity: updatedItem.quantity },
      });

      // Invalidate cache
      revalidateTag('items');

      return NextResponse.json(updatedItem, { status: 200 });
    }

    // Parse expiration date if provided
    let parsedExpirationDate = null;
    if (expirationDate) {
      parsedExpirationDate = new Date(expirationDate);
    }

    // Extract nutrition data if available
    let nutritionData = {
      caloriesPer100g: null as number | null,
      fatPer100g: null as number | null,
      carbohydratesPer100g: null as number | null,
      proteinPer100g: null as number | null,
      fiberPer100g: null as number | null,
      servingSize: null as string | null,
      nutriScore: null as string | null,
    };

    if (productData) {
      nutritionData = {
        caloriesPer100g: productData.caloriesPer100g,
        fatPer100g: productData.fatPer100g,
        carbohydratesPer100g: productData.carbohydratesPer100g,
        proteinPer100g: productData.proteinPer100g,
        fiberPer100g: productData.fiberPer100g,
        servingSize: productData.servingSize,
        nutriScore: productData.nutriScore,
      };
    }

    // Insert new item into database
    const [newItem] = await db
      .insert(items)
      .values({
        barcode,
        name: productName,
        imageUrl,
        quantity: 1,
        category: finalCategory,
        expirationDate: parsedExpirationDate,
        brand: productBrand,
        caloriesPer100g: nutritionData.caloriesPer100g,
        fatPer100g: nutritionData.fatPer100g,
        carbohydratesPer100g: nutritionData.carbohydratesPer100g,
        proteinPer100g: nutritionData.proteinPer100g,
        fiberPer100g: nutritionData.fiberPer100g,
        servingSize: nutritionData.servingSize,
        nutriScore: nutritionData.nutriScore,
      })
      .returning();

    // Log added event
    await logItemEvent({
      itemId: newItem.id,
      barcode: newItem.barcode,
      name: newItem.name,
      category: newItem.category,
      eventType: "added",
      quantityChange: 1,
      metadata: {
        brand: productBrand,
        expirationDate: parsedExpirationDate?.toISOString(),
      },
    });

    // Invalidate cache
    revalidateTag('items');

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error("Error adding item:", error);
    return NextResponse.json(
      { error: "Failed to add item" },
      { status: 500 }
    );
  }
}
