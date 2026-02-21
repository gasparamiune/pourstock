

# Fix: Prevent Row 1 from Anchoring the Cluster

## Problem
When a large party is assigned to B34 (the only 8-top, row 1), the current `rowDistance` function returns 0 for all other row-1 tables (B8, B18, B28). This makes them more attractive than tables near the bottom, dragging the whole cluster to the back of the restaurant.

## Root Cause
The `rowDistance` helper uses **minimum distance** to any occupied row. So one outlier table in row 1 makes all row-1 tables distance 0, beating row-9 tables at distance 8.

## Solution
Replace minimum distance with **average distance** to all occupied rows. This way, if 3 tables are occupied in rows 7-9 and 1 outlier is in row 1, a candidate in row 8 scores ~0.75 average distance while a candidate in row 1 scores ~7.0 average distance. The cluster stays near the majority.

## Technical Details

### File Modified
**`src/components/tableplan/FloorPlan.tsx`** -- Update the `rowDistance` helper inside `assignTablesToReservations()`:

```typescript
// Before (minimum distance -- one outlier anchors the cluster)
const rowDistance = (row: number): number => {
  if (occupiedRows.size === 0) return 0;
  let min = Infinity;
  for (const r of occupiedRows) {
    min = Math.min(min, Math.abs(row - r));
  }
  return min;
};

// After (average distance -- cluster follows the majority)
const rowDistance = (row: number): number => {
  if (occupiedRows.size === 0) return 0;
  let sum = 0;
  for (const r of occupiedRows) {
    sum += Math.abs(row - r);
  }
  return sum / occupiedRows.size;
};
```

This is a single-line change (swap `min` logic for `sum/size` logic). No other files or sorting logic needs to change -- the rest of the sort priorities (capacity, bottom-to-top tiebreak, B37 last) remain identical.

### Why This Works
- First few reservations: `occupiedRows` is empty or small, so bottom-to-top preference (step 3) dominates and fills from row 9 upward.
- Large party goes to B34 (row 1) because it's the only 8-top -- unavoidable.
- Next 2-person reservation: average distance to rows 9+1 = row 8 scores (1+7)/2=4, row 1 scores (8+0)/2=4, but the row-DESC tiebreaker picks row 8. As more bottom rows fill, the average strongly favors staying near the bottom cluster.
