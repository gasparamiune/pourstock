

# New Table Assignment Algorithm

Replace the current distance-based clustering algorithm with a simple, deterministic front-to-back filling strategy that matches how the restaurant actually operates.

---

## New Rules

### Table 34 (B34) -- Blocked
- B34 is internally blocked. It is only available when 20+ tables are already occupied.

### Assignment Order (biggest reservations first)

**Step 1: Sort reservations by guest count descending** (same as now)

**Step 2: For each reservation, pick a table based on guest count:**

**3-4 guests** (need a 4-seat table):
- Priority order: B35, B1, B2, B3 (front rows, column 1)
- Then: B4, B14, B32 (round 6-seat tables, only if column-1 tables are full)
- Then: B5, B6, B7, B8 (back rows, column 1)

**5-6 guests** (need a round 6-seat table):
- Priority order: B4, B14, B32
- If all occupied: try merging 2 adjacent tables (front-to-back)

**7-8 guests**:
- Try merging first (front-to-back)
- B34 only if 20+ tables occupied

**2 guests** (need a 2-seat table):
- Priority order: B36, B37, B21, B11, B22, B12, B23, B13, B25, B15, B26, B16, B27, B17, B28, B18, B31, B33
- This fills columns 2-4 from the front (row 9) to the back (row 1)

**1 guest**: Same as 2 guests

**Merge fallback**: When no single table fits, try merging 2-4 adjacent non-round tables, preferring front rows (row 9 first, then row 8, etc.)

---

## Technical Changes

### File: `src/components/tableplan/FloorPlan.tsx`

Replace the `assignTablesToReservations` and `findMergeGroup` functions entirely with the new algorithm:

```text
assignTablesToReservations(reservations):
  sort by guestCount descending
  usedTables = Set()
  
  for each reservation:
    if guestCount >= 7:
      try merges front-to-back
      if usedTables.size >= 20: also try B34
    else if guestCount >= 5:
      try [B4, B14, B32] (first available)
      else try merges front-to-back
    else if guestCount >= 3:
      try [B35, B1, B2, B3] (first available)
      then [B4, B14, B32]
      then [B5, B6, B7, B8]
    else (1-2 guests):
      try 2-seat tables front-to-back:
      [B36, B37, B21, B11, B22, B12, B23, B13, ...]
```

The `findMergeGroup` function is updated to prefer front rows (row 9 first) instead of using distance-based scoring.

No other files need changes -- the algorithm output format (`Assignments { singles, merges }`) stays identical.
