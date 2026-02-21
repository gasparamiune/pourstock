

# Table Plan Enhancements

## Summary
This plan covers all the collected requirements in one go: expanding reservation types, updating table assignment logic, adding cutlery/table setting info per reservation type, and adding a preparation summary panel showing total cutlery and glassware needed.

---

## 1. Expand Reservation Types

Currently the system only handles `dishCount` (2 or 3). We will replace this with a `reservationType` field that supports:
- **2-ret** (2-course menu)
- **3-ret** (3-course menu)
- **4-ret** (4-course menu)
- **A la carte**
- **Bordreservation** (table-only reservation, no food pre-ordered)

### Changes
- **`Reservation` interface** in `TableCard.tsx`: Add `reservationType: '2-ret' | '3-ret' | '4-ret' | 'a-la-carte' | 'bordreservation'` field alongside the existing `dishCount` (kept for backward compatibility).
- **Edge function prompt** (`parse-table-plan/index.ts`): Update the AI extraction prompt to identify all 5 types and return the `reservationType` string.
- **`TableCard.tsx`**: Update color-coding to handle all 5 types (e.g. amber for 3-ret, sky for 2-ret, emerald for 4-ret, violet for a la carte, slate for bordreservation).
- **`FloorPlan.tsx` legend**: Add legend entries for all 5 types.

---

## 2. Table Assignment: Bottom-to-Top, Avoid B37

Currently tables are assigned by smallest-fit only. The new logic will:
1. Sort reservations by party size (largest first) -- unchanged.
2. When multiple tables of the same capacity are available, prefer tables with **higher row numbers first** (bottom of the restaurant = rows 7, 8 before rows 1, 2).
3. Among equal candidates, **deprioritize B37** by sorting it last.

### Changes
- **`assignTablesToReservations()`** in `FloorPlan.tsx`: Update the candidate sorting to use `(capacity, -row, id === 'B37')` as the sort key so bottom tables fill first and B37 is used only when no alternative exists.

---

## 3. Cutlery / Table Setting per Reservation Type

Each reservation type requires specific cutlery:

```text
Type             | Forks | Steak Knives | Butter Knives | Spoons
-----------------+-------+--------------+---------------+-------
2-ret            |   2   |      1       |       1       |   0
3-ret            |   2   |      1       |       1       |   1
4-ret            |   3   |      1       |       2       |   1
A la carte       |   2   |      1       |       1       |   1
Bordreservation  |   2   |      1       |       1       |   1
```

(A la carte and bordreservation default to the 3-ret setting.)

### Changes
- **New utility** `getCutleryForType()` in a new file `src/components/tableplan/cutleryUtils.ts`: Returns the cutlery counts per guest based on reservation type.

---

## 4. Preparation Summary Panel

A new card displayed **below the floor plan** (not on individual table cards) showing totals for the evening:

- **Cutlery totals**: Sum of forks, steak knives, butter knives, and spoons across all reservations (per-guest count multiplied by guest count).
- **Glassware totals**: 1 water glass, 1 white wine glass, and 1 red wine glass per guest.

The panel will be a clean card with icon rows showing each item and its total count.

### Changes
- **New component** `src/components/tableplan/PreparationSummary.tsx`: Takes the reservations array, computes totals using `getCutleryForType()`, and renders a summary card.
- **`TablePlan.tsx`**: Render `<PreparationSummary>` below `<FloorPlan>` when reservations are present.
- **Translations**: Add labels for cutlery items (forks, knives, spoons) and glassware (water, white wine, red wine) in both English and Danish.

---

## Technical Details

### Files Created
- `src/components/tableplan/cutleryUtils.ts` -- Cutlery mapping per reservation type
- `src/components/tableplan/PreparationSummary.tsx` -- Summary card component

### Files Modified
- `src/components/tableplan/TableCard.tsx` -- Add `reservationType` to interface, update color-coding for 5 types
- `src/components/tableplan/FloorPlan.tsx` -- Update assignment logic (bottom-to-top, avoid B37), update legend for 5 types
- `src/pages/TablePlan.tsx` -- Add `PreparationSummary` below the floor plan
- `supabase/functions/parse-table-plan/index.ts` -- Update AI prompt to extract `reservationType` with all 5 options
- `src/contexts/LanguageContext.tsx` -- Add translations for new reservation types, cutlery, and glassware labels

### Color Scheme for Reservation Types
- **2-ret**: Sky/blue (existing)
- **3-ret**: Amber/gold (existing)
- **4-ret**: Emerald/green
- **A la carte**: Violet/purple
- **Bordreservation**: Slate/gray with solid border (distinct from "free" tables which use dashed border)

### Preparation Summary Layout
```text
+---------------------------------------------------+
|  Preparation Summary                              |
+---------------------------------------------------+
|  Cutlery                    |  Glassware           |
|  Fork icon        x 48     |  Water glass   x 24  |
|  Steak knife icon x 24     |  White wine    x 24  |
|  Butter knife icon x 28    |  Red wine      x 24  |
|  Spoon icon       x 18     |                      |
+---------------------------------------------------+
```
