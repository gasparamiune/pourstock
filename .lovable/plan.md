

# Plan: Unavailable Table Display + Translations

## Changes

### 1. `TableCard.tsx` — Special render for unavailable tables
When `reservation.reservationType === 'unavailable'`, render a minimal card:
- Show only the table number badge (top-left) and a centered message using `t('tablePlan.tableUnavailableMessage')`
- No icon bar, no guest count, no type pill, no name, no notes, no service buttons
- Keep the zinc/grey styling from `cutleryUtils`

### 2. `ReservationDetailDialog.tsx` — Unavailable detail view
When opening an unavailable table's detail dialog:
- Show only the message `t('tablePlan.tableUnavailableMessage')` and a button "Make available" / "Gør tilgængelig" that calls `onRemove()`
- No edit button, no other fields

### 3. `AddReservationDialog.tsx` — Fix hardcoded Danish
Change the hardcoded `'Utilgængelig'` guest name in `handleMarkAsUnavailable` to use the translation key or a neutral marker (e.g. empty string — the card won't show it anyway).

### 4. `LanguageContext.tsx` — Add translations
- `tablePlan.tableUnavailableMessage`: "This table was marked as unavailable" / "Dette bord er markeret som utilgængeligt"
- `tablePlan.makeAvailable`: "Make available" / "Gør tilgængelig"

### Files changed
| File | Changes |
|------|---------|
| `src/components/tableplan/TableCard.tsx` | Add `isUnavailable` branch with minimal render |
| `src/components/tableplan/ReservationDetailDialog.tsx` | Unavailable-specific dialog content |
| `src/components/tableplan/AddReservationDialog.tsx` | Remove hardcoded Danish string |
| `src/contexts/LanguageContext.tsx` | Add 2 new translation keys |

