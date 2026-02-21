

# Cluster Occupied Tables Together

## Problem
Currently, the assignment logic fills from the bottom up but can scatter guests across non-adjacent rows -- e.g., one table in row 9, the next in row 7, leaving empty rows in between. The restaurant should feel "full in one area" rather than having isolated guests spread out.

## Solution
Change the assignment priority so that **proximity to already-occupied rows** is the strongest factor (after capacity fit). Instead of simply preferring "any occupied row," the algorithm will prefer the row **closest** to an existing occupied table. This naturally clusters all reservations into a contiguous block starting from the bottom.

### New Sort Priority
1. **Smallest capacity that fits** (unchanged)
2. **Closest to an occupied row** -- measured by minimum row distance to any already-occupied row. Tables in an occupied row get distance 0. Tables 1 row away get distance 1, etc. Smaller distance wins.
3. **Prefer higher row numbers** (bottom-to-top) -- used as tiebreaker and for the very first assignment
4. **Deprioritize B37** (unchanged)

### Example Behavior
- First reservation goes to row 9 (bottom-to-top default)
- Second reservation: row 9 (distance 0) or row 8 (distance 1) preferred over row 3 (distance 6)
- As rows 8 and 9 fill, row 7 becomes the next closest, keeping everyone clustered

## Technical Details

### File Modified
**`src/components/tableplan/FloorPlan.tsx`** -- Update the candidate sorting inside `assignTablesToReservations()`:

```typescript
// Helper: minimum distance from a row to any occupied row
const rowDistance = (row: number): number => {
  if (occupiedRows.size === 0) return 0;
  let min = Infinity;
  for (const r of occupiedRows) {
    min = Math.min(min, Math.abs(row - r));
  }
  return min;
};

// Sort candidates
.sort((a, b) => {
  // 1. Smallest capacity that fits
  const capDiff = a.capacity - b.capacity;
  if (capDiff !== 0) return capDiff;
  // 2. Closest to occupied rows (cluster together)
  const distDiff = rowDistance(a.row) - rowDistance(b.row);
  if (distDiff !== 0) return distDiff;
  // 3. Prefer higher row numbers (bottom-to-top)
  if (a.row !== b.row) return b.row - a.row;
  // 4. Deprioritize B37
  if (a.id === 'B37') return 1;
  if (b.id === 'B37') return -1;
  return 0;
})
```

This single change replaces the "prefer any occupied row" logic with distance-based clustering, keeping all occupied tables in a tight group.

