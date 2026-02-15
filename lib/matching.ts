import { Item, RecipeIngredient } from "./schema";

/**
 * Ingredient matching result
 */
export interface IngredientMatch {
  inventoryItem: Item;
  recipeIngredient: RecipeIngredient;
  confidence: number; // 0-1
  matchType: "exact" | "partial" | "fuzzy";
}

/**
 * Result of matching inventory against recipe ingredients
 */
export interface MatchResult {
  matched: IngredientMatch[];
  missing: RecipeIngredient[];
  matchScore: number; // 0-100 percentage
  totalIngredients: number;
  matchedCount: number;
  missingCount: number;
}

/**
 * Normalize ingredient name for matching
 * - Lowercase
 * - Remove special characters
 * - Remove common words (organic, fresh, frozen, etc)
 * - Remove trailing 's' for plurals (optional)
 */
function normalizeIngredient(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, "") // Remove special chars
    .replace(/\b(organic|fresh|frozen|dried|raw|cooked|canned|tinned|ground|minced|sliced|diced|whole|peeled|powdered|powdered|paste|sauce|extract|oil|juice|zest|peel|rind)\b/g, "") // Remove common modifiers
    .replace(/\s+/g, " ") // Normalize spaces
    .trim();
}

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching when exact/partial matches fail
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Match a single inventory item against a single recipe ingredient
 * Returns confidence score (0-1)
 */
function matchSingleIngredient(
  inventoryItem: Item,
  recipeIngredient: RecipeIngredient
): { confidence: number; matchType: "exact" | "partial" | "fuzzy" } | null {
  const invNorm = normalizeIngredient(inventoryItem.name);
  const recNorm = normalizeIngredient(recipeIngredient.name);

  if (!invNorm || !recNorm) {
    return null;
  }

  // Exact match (normalized names are identical)
  if (invNorm === recNorm) {
    return { confidence: 1.0, matchType: "exact" };
  }

  // Partial match (one contains the other)
  if (invNorm.includes(recNorm) || recNorm.includes(invNorm)) {
    return { confidence: 0.8, matchType: "partial" };
  }

  // Fuzzy match using Levenshtein distance
  const distance = levenshteinDistance(invNorm, recNorm);
  const maxLength = Math.max(invNorm.length, recNorm.length);

  // If distance is small relative to length, consider it a fuzzy match
  if (distance <= Math.ceil(maxLength * 0.3)) {
    const confidence = 1 - distance / maxLength;
    return { confidence: Math.max(0.6, confidence), matchType: "fuzzy" };
  }

  return null;
}

/**
 * Match an inventory of items against recipe ingredients
 * Returns matched items, missing ingredients, and match score
 */
export function matchIngredients(
  inventoryItems: Item[],
  recipeIngredients: RecipeIngredient[]
): MatchResult {
  const matched: IngredientMatch[] = [];
  const missing: RecipeIngredient[] = [];
  const usedInventoryIds = new Set<number>();

  // Try to match each recipe ingredient
  for (const recipeIng of recipeIngredients) {
    let bestMatch: IngredientMatch | null = null;

    // Find best matching inventory item
    for (const invItem of inventoryItems) {
      if (usedInventoryIds.has(invItem.id)) continue; // Skip already matched items

      const result = matchSingleIngredient(invItem, recipeIng);
      if (result && (!bestMatch || result.confidence > bestMatch.confidence)) {
        bestMatch = {
          inventoryItem: invItem,
          recipeIngredient: recipeIng,
          confidence: result.confidence,
          matchType: result.matchType,
        };
      }
    }

    if (bestMatch) {
      matched.push(bestMatch);
      usedInventoryIds.add(bestMatch.inventoryItem.id);
    } else {
      missing.push(recipeIng);
    }
  }

  const matchScore =
    recipeIngredients.length > 0
      ? Math.round((matched.length / recipeIngredients.length) * 100)
      : 0;

  return {
    matched,
    missing,
    matchScore,
    totalIngredients: recipeIngredients.length,
    matchedCount: matched.length,
    missingCount: missing.length,
  };
}

/**
 * Filter recipes based on match score and missing ingredients count
 */
export function filterRecipes(
  matches: Array<{ matchScore: number; missingCount: number }>,
  minMatchScore: number = 50,
  maxMissing: number = 3
): boolean[] {
  return matches.map(
    (m) => m.matchScore >= minMatchScore && m.missingCount <= maxMissing
  );
}

/**
 * Sort recipes by match score (descending)
 */
export function sortByMatchScore<T extends { matchScore: number }>(
  recipes: T[]
): T[] {
  return [...recipes].sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Helper to convert Set to array (for typescript compatibility)
 */
export function setToArray<T>(set: Set<T>): T[] {
  return Array.from(set);
}
