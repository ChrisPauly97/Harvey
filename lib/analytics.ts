import { db } from "@/lib/db";
import { itemEvents } from "@/lib/schema";
import { and, desc, eq, gte } from "drizzle-orm";

export interface ConsumptionTrend {
  barcode: string;
  name: string;
  consumptionRate: number; // items consumed per day
  purchaseFrequency: number; // avg days between purchases
  totalConsumed: number;
  lastPurchase: Date | null;
  predictedRunOut: Date | null;
  confidence: "high" | "medium" | "low";
  eventCount: number;
}

/**
 * Analyze consumption pattern for a specific item
 * Returns trend analysis for shopping list predictions
 */
export async function analyzeConsumption(
  barcode: string,
  category: "fridge" | "freezer" | "pantry",
  lookbackDays: number = 30,
  currentQuantity: number = 0
): Promise<ConsumptionTrend | null> {
  const cutoffTime = new Date();
  cutoffTime.setDate(cutoffTime.getDate() - lookbackDays);

  // Fetch all events for this barcode+category in lookback period
  const events = await db
    .select()
    .from(itemEvents)
    .where(
      and(
        eq(itemEvents.barcode, barcode),
        eq(itemEvents.category, category),
        gte(itemEvents.timestamp, cutoffTime)
      )
    )
    .orderBy(desc(itemEvents.timestamp));

  if (events.length === 0) {
    return null;
  }

  // Get the latest name from events
  const name = events[0].name;

  // Find all purchase (added) events
  const purchaseEvents = events.filter((e) => e.eventType === "added");
  const lastPurchaseTime = purchaseEvents.length > 0 ? purchaseEvents[0].timestamp : null;

  // Calculate purchase frequency (avg days between purchases)
  let purchaseFrequency = 0;
  if (purchaseEvents.length > 1) {
    const intervals: number[] = [];
    for (let i = 0; i < purchaseEvents.length - 1; i++) {
      const time1 = purchaseEvents[i].timestamp instanceof Date
        ? purchaseEvents[i].timestamp.getTime()
        : (purchaseEvents[i].timestamp as any) * 1000;
      const time2 = purchaseEvents[i + 1].timestamp instanceof Date
        ? purchaseEvents[i + 1].timestamp.getTime()
        : (purchaseEvents[i + 1].timestamp as any) * 1000;
      const days = (time1 - time2) / (1000 * 60 * 60 * 24);
      intervals.push(days);
    }
    purchaseFrequency = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  }

  // Count consumed quantity (decrements + deletes)
  const consumedEvents = events.filter(
    (e) => e.eventType === "quantity_decrement" || e.eventType === "deleted"
  );
  const totalConsumed = consumedEvents.reduce((sum, e) => sum + (e.quantityChange || 0), 0);

  // Calculate consumption rate (items/day)
  const daysOfData = lookbackDays;
  const consumptionRate = totalConsumed / daysOfData;

  // Predict run-out date
  let predictedRunOut: Date | null = null;
  if (consumptionRate > 0 && currentQuantity > 0) {
    const daysUntilRunOut = currentQuantity / consumptionRate;
    predictedRunOut = new Date();
    predictedRunOut.setDate(predictedRunOut.getDate() + daysUntilRunOut);
  }

  // Determine confidence based on event frequency
  let confidence: "high" | "medium" | "low" = "low";
  if (totalConsumed >= 10) {
    confidence = "high";
  } else if (totalConsumed >= 3) {
    confidence = "medium";
  }

  return {
    barcode,
    name,
    consumptionRate,
    purchaseFrequency,
    totalConsumed,
    lastPurchase: lastPurchaseTime,
    predictedRunOut,
    confidence,
    eventCount: events.length,
  };
}

/**
 * Check if item should be suggested for purchase based on consumption trends
 */
export async function shouldSuggestPurchase(
  barcode: string,
  category: "fridge" | "freezer" | "pantry",
  currentQuantity: number,
  usageLevel: number = 100,
  daysToRunOut: number = 7
): Promise<{
  should: boolean;
  reason: string;
  priority: "high" | "medium" | "low";
}> {
  const trend = await analyzeConsumption(barcode, category, 30, currentQuantity);

  // Fallback rule: Last item with low usage level (even without consumption history)
  // Only suggest if quantity = 1 AND usageLevel < 25% to avoid suggesting items that last ages
  if (currentQuantity === 1 && usageLevel < 25) {
    return {
      should: true,
      reason: "Last item with low usage - consider replenishing",
      priority: "medium",
    };
  }

  // No consumption data, don't suggest further
  if (!trend) {
    return { should: false, reason: "No consumption history", priority: "low" };
  }

  // Consumption-based rule: if item is running out based on consumption history
  if (trend.predictedRunOut && usageLevel < 25) {
    const daysLeft =
      (trend.predictedRunOut.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
    if (daysLeft <= daysToRunOut && daysLeft > 0) {
      return {
        should: true,
        reason: `Low usage level with consumption history, expected to run out in ${Math.ceil(daysLeft)} days`,
        priority: daysLeft <= 3 ? "high" : "medium",
      };
    }
  }

  // Regular consumption rule: if regularly purchased, suggest before run-out
  if (trend.purchaseFrequency > 0 && trend.confidence === "high") {
    // Suggest when quantity is below average consumption per purchase frequency
    const avgQuantityPerPurchase = trend.totalConsumed / Math.max(1, trend.purchaseFrequency);
    if (currentQuantity < avgQuantityPerPurchase * 0.3) {
      return {
        should: true,
        reason: `Regularly purchased item running low`,
        priority: "medium",
      };
    }
  }

  return { should: false, reason: "Item has sufficient stock", priority: "low" };
}
