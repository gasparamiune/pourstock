

# Plan: Refine Table 37 Migration Rule

## Change

One adjustment to the post-assignment swap logic in `FloorPlan.tsx`:

**Current rule**: If B37 is occupied AND exactly 1 reservation is in the back zone → swap B37's reservation to the back zone so the back-zone guest has company, freeing B37.

**New rule**: Only perform that swap if the back-zone reservation is the **last reservation being assigned** in the entire batch. If there are still more reservations queued after it, do NOT migrate B37 — the back zone will naturally get more guests and B37 can stay occupied.

This means:
- Front fills up → B37 gets assigned as the last front table
- If there are more reservations to assign after B37, they go to back zone normally. B37 stays put. Back zone gets multiple guests naturally.
- If B37 is the second-to-last reservation and the very last one goes to back zone (creating 1 isolated guest there), THEN swap B37 to back zone so the isolated guest has company, freeing B37.
- If there are 2+ reservations going to back zone after B37, no swap needed — back zone already has company.

## Implementation

In `assignTablesToReservations`, during the post-processing pass:
- Track whether the last-assigned reservation went to the back zone
- Only trigger the B37↔back swap if: B37 is occupied AND exactly 1 back-zone reservation AND that back-zone reservation was the final one assigned

## File

| File | Change |
|------|--------|
| `src/components/tableplan/FloorPlan.tsx` | Adjust migration pass condition to check if back-zone assignment was the last reservation |

