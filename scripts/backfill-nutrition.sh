#!/bin/bash

echo "🥗 Starting nutrition data backfill for all items..."
echo ""

# Get all items without nutrition data
ITEMS=$(echo "SELECT id, barcode, name FROM items WHERE calories_per_100g IS NULL ORDER BY id;" | turso db shell fridgescanner 2>/dev/null | tail -n +2)

# Count items
TOTAL=$(echo "$ITEMS" | wc -l)
echo "Found $TOTAL items without nutrition data"
echo ""

UPDATED=0
FOUND=0
FAILED=0
COUNT=0

while IFS= read -r line; do
  # Skip empty lines
  if [ -z "$line" ]; then
    continue
  fi

  COUNT=$((COUNT + 1))

  # Parse the line
  ID=$(echo "$line" | awk '{print $1}')
  BARCODE=$(echo "$line" | awk '{print $2}')
  NAME=$(echo "$line" | cut -d' ' -f3-)

  printf "[$COUNT/$TOTAL] Fetching nutrition for: $NAME... "

  # Fetch from Open Food Facts
  RESPONSE=$(curl -s "https://world.openfoodfacts.org/api/v0/product/$BARCODE.json" --max-time 3)
  STATUS=$(echo "$RESPONSE" | jq -r '.status' 2>/dev/null)

  if [ "$STATUS" = "1" ]; then
    # Extract nutrition data
    CALORIES=$(echo "$RESPONSE" | jq -r '.product.nutriments["energy-kcal_100g"] // null' 2>/dev/null)
    FAT=$(echo "$RESPONSE" | jq -r '.product.nutriments["fat_100g"] // null' 2>/dev/null)
    CARBS=$(echo "$RESPONSE" | jq -r '.product.nutriments["carbohydrates_100g"] // null' 2>/dev/null)
    PROTEIN=$(echo "$RESPONSE" | jq -r '.product.nutriments["proteins_100g"] // null' 2>/dev/null)
    FIBER=$(echo "$RESPONSE" | jq -r '.product.nutriments["fiber_100g"] // null' 2>/dev/null)
    SERVING=$(echo "$RESPONSE" | jq -r '.product.serving_size // null' 2>/dev/null)
    NUTRISCORE=$(echo "$RESPONSE" | jq -r '.product.nutrition_grades // null' 2>/dev/null)

    if [ "$CALORIES" != "null" ] && [ ! -z "$CALORIES" ]; then
      # Update the item
      UPDATE_SQL="UPDATE items SET calories_per_100g = $CALORIES, fat_per_100g = $([ "$FAT" = "null" ] && echo "NULL" || echo "$FAT"), carbohydrates_per_100g = $([ "$CARBS" = "null" ] && echo "NULL" || echo "$CARBS"), protein_per_100g = $([ "$PROTEIN" = "null" ] && echo "NULL" || echo "$PROTEIN"), fiber_per_100g = $([ "$FIBER" = "null" ] && echo "NULL" || echo "$FIBER"), serving_size = $([ "$SERVING" = "null" ] && echo "NULL" || echo "'$SERVING'"), nutri_score = $([ "$NUTRISCORE" = "null" ] && echo "NULL" || echo "'$NUTRISCORE'") WHERE id = $ID;"

      echo "$UPDATE_SQL" | turso db shell fridgescanner > /dev/null 2>&1

      UPDATED=$((UPDATED + 1))
      FOUND=$((FOUND + 1))
      echo "✅ ${CALORIES} kcal"
    else
      FAILED=$((FAILED + 1))
      echo "⏭️  No nutrition data"
    fi
  else
    FAILED=$((FAILED + 1))
    echo "❌ Not found"
  fi

  # Rate limit
  sleep 0.5
done <<< "$ITEMS"

echo ""
echo "📊 Backfill Complete!"
echo "   ✅ Updated: $UPDATED"
echo "   ⏭️  No data: $FAILED"
if [ $COUNT -gt 0 ]; then
  PERCENT=$(( (FOUND * 100) / COUNT ))
  echo "   🎯 Success rate: ${PERCENT}%"
fi
