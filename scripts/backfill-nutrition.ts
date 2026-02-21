import { db } from "@/lib/db";
import { items } from "@/lib/schema";
import { eq, isNull } from "drizzle-orm";

interface NutrimentData {
  "energy-kcal_100g"?: number;
  "fat_100g"?: number;
  "carbohydrates_100g"?: number;
  "proteins_100g"?: number;
  "fiber_100g"?: number;
}

async function fetchNutritionFromOFF(barcode: string) {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
      { signal: AbortSignal.timeout(3000) }
    );
    const data = await response.json();

    if (data.status === 1 && data.product) {
      const product = data.product;
      const nutriments: NutrimentData = product.nutriments || {};

      return {
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
    console.warn(`Failed to fetch nutrition for barcode ${barcode}:`, error);
    return null;
  }
}

async function backfillNutrition() {
  console.log("🥗 Starting nutrition data backfill...\n");

  // Get all items that don't have nutrition data
  const itemsToUpdate = await db
    .select()
    .from(items)
    .where(isNull(items.caloriesPer100g));

  console.log(`Found ${itemsToUpdate.length} items without nutrition data\n`);

  let updated = 0;
  let found = 0;
  let failed = 0;

  for (let i = 0; i < itemsToUpdate.length; i++) {
    const item = itemsToUpdate[i];
    const progress = `[${i + 1}/${itemsToUpdate.length}]`;

    try {
      const nutrition = await fetchNutritionFromOFF(item.barcode);

      if (nutrition && nutrition.caloriesPer100g) {
        // Update the item with nutrition data
        await db
          .update(items)
          .set(nutrition)
          .where(eq(items.id, item.id));

        found++;
        updated++;
        console.log(
          `${progress} ✅ ${item.name} (${item.barcode}) - ${Math.round(nutrition.caloriesPer100g)} kcal`
        );
      } else {
        failed++;
        console.log(
          `${progress} ⏭️  ${item.name} (${item.barcode}) - No nutrition data found`
        );
      }

      // Add delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      failed++;
      console.log(
        `${progress} ❌ ${item.name} (${item.barcode}) - Error: ${error}`
      );
    }
  }

  console.log("\n📊 Backfill Complete!");
  console.log(`   ✅ Updated: ${updated}`);
  console.log(`   ⏭️  No data: ${failed}`);
  console.log(`   🎯 Success rate: ${((found / itemsToUpdate.length) * 100).toFixed(1)}%`);
}

backfillNutrition().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
