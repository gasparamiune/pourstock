

# Table Plan: Bug Fix + Full Editability

## Part 1: Bug Fix -- Table 15 chosen over Table 35

### Root Cause
The sorting prioritizes **smallest capacity first**. Table B15 (2p, row 4) beats B35 (4p, row 9) because 2 < 4, even though B35 is at the bottom where we want guests. The distance tiebreaker never triggers because the capacity difference is non-zero. Additionally, when `occupiedRows` is empty (first assignment), `rowDistance` returns 0 for every row, providing no bottom-preference signal.

### Fix
Two changes in `FloorPlan.tsx`:

1. **Seed the distance function**: When no tables are occupied yet, return `9 - row` so bottom rows score lower (better). This bootstraps the "start from row 9" behavior.
2. **Swap sort priority**: Check distance **before** capacity. This ensures tables near the cluster (or the bottom) are preferred, and among equidistant tables, the smallest capacity wins.

This means: first reservation always goes to row 9 (B35/B36). Subsequent ones cluster nearby. A 4-top with 2 guests is acceptable -- better than isolating someone in row 4.

## Part 2: Full Editability Features

### A. State Lifted to TablePlan Page
Currently `FloorPlan` calls `assignTablesToReservations` internally and renders the result. For editability, the assignment state (which reservation sits where) needs to be **lifted to the parent** (`TablePlan.tsx`) so the user can modify it. A new state object `assignments` will hold the editable map of table-to-reservation and merge groups.

### B. Drag-and-Drop Reservations
- Each occupied `TableCard` becomes **draggable** (HTML5 drag-and-drop).
- Each free `TableCard` becomes a **drop target**.
- Dropping a reservation on a free table moves it there. Dropping on an occupied table swaps the two.
- Visual feedback: drop target highlights on hover during drag.

### C. Merge Tables with "+" Button
- When hovering between two adjacent tables (same row), a **"+" button** appears in the gap.
- Clicking it merges the two tables into a single merged group spanning both columns.
- Merged tables display as "number1+number2" with combined capacity.
- A small "unmerge" button appears on merged cards to split them back.
- Merging works regardless of whether tables are occupied or free.

### D. Click Free Table: Add Reservation Dialog
- Clicking a free (unoccupied) table opens a **dialog/modal** with a form to manually add a reservation.
- Fields: guest name, guest count, room number, reservation type (2-ret/3-ret/4-ret/a-la-carte/bordreservation), notes.
- On submit, the reservation is added to that table and the plan updates.

### E. Click Occupied Table: Reservation Summary Dialog
- Clicking an occupied table opens a **dialog** showing all reservation details (name, room, type, guest count, notes).
- Includes an "Edit" button to modify the reservation in-place.
- Includes a "Remove" button to free the table.

## Technical Details

### Files Modified

**`src/pages/TablePlan.tsx`**
- Add state for editable assignments: `assignments` (singles map + merges array + unassigned reservations list).
- After PDF parsing, call `assignTablesToReservations` once to seed the initial state, then all further changes are manual edits.
- Pass callbacks to `FloorPlan`: `onMove`, `onMerge`, `onUnmerge`, `onAddReservation`, `onRemoveReservation`, `onEditReservation`.

**`src/components/tableplan/FloorPlan.tsx`**
- Fix `rowDistance` and sort order (Part 1).
- Export `TABLE_LAYOUT` and `assignTablesToReservations` for use by the parent.
- Accept `assignments` as props instead of computing internally.
- Accept edit callbacks as props.
- Render "+" merge buttons between adjacent same-row tables using absolute-positioned elements in the grid gaps.
- Add drag-and-drop event handlers (`onDragStart`, `onDragOver`, `onDrop`) on each `TableCard`.

**`src/components/tableplan/TableCard.tsx`**
- Add `onClick` prop for opening dialogs.
- Add `draggable` and drag event props.
- Add visual states: `isDragOver` highlight, `isDragging` opacity.

**`src/components/tableplan/AddReservationDialog.tsx`** (new file)
- Modal with form fields for manual reservation entry.
- Uses existing UI components (Dialog, Input, Select).

**`src/components/tableplan/ReservationDetailDialog.tsx`** (new file)
- Modal showing full reservation details with Edit and Remove actions.

**`src/components/tableplan/MergeButton.tsx`** (new file)
- Small "+" button component rendered between adjacent tables.
- Appears on hover, triggers merge callback on click.

### New Translation Keys
Both EN and DA translations will be added for: merge, unmerge, add reservation, edit, remove, form labels (guest name, guest count, room number, type, notes, save, cancel).

### How Drag-and-Drop Works
- Uses HTML5 native drag-and-drop (no extra library needed).
- `dataTransfer` carries the source table ID.
- On drop: parent callback updates the assignments map (swap or move).
- CSS classes toggle for drag-over visual feedback.

### How Merge Buttons Work
- The grid rendering loop checks if two consecutive cells in a row are both visible (not already merged into something else).
- If so, a small absolute-positioned "+" button is rendered between them.
- On click, the parent merges the two tables: creates a new `MergeGroup` entry, removes individual assignments if any, and re-renders the spanning card.

