

# Unified Plan: Reception & Housekeeping Modules + Department-Scoped Roles

This is the combined implementation of both previously approved plans into a single execution.

---

## Phase 1: Database Foundation

### New Enums
```sql
CREATE TYPE public.department AS ENUM ('reception', 'housekeeping', 'restaurant');
CREATE TYPE public.department_role AS ENUM ('manager', 'receptionist', 'hk_worker', 'staff');
CREATE TYPE public.room_type AS ENUM ('single', 'double', 'twin', 'suite', 'family');
CREATE TYPE public.room_status AS ENUM ('available', 'occupied', 'checkout', 'maintenance', 'reserved');
CREATE TYPE public.payment_status AS ENUM ('pending', 'partial', 'paid', 'refunded');
CREATE TYPE public.charge_type AS ENUM ('room', 'minibar', 'restaurant', 'laundry', 'other');
CREATE TYPE public.hk_status AS ENUM ('dirty', 'in_progress', 'clean', 'inspected');
CREATE TYPE public.hk_priority AS ENUM ('normal', 'urgent', 'vip');
CREATE TYPE public.hk_task_type AS ENUM ('checkout_clean', 'stay_over', 'deep_clean', 'turndown');
CREATE TYPE public.maintenance_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE public.maintenance_status AS ENUM ('open', 'in_progress', 'resolved');
```

### New Tables (8 total)

1. **`user_departments`** -- Links users to departments with roles
   - `user_id`, `department`, `department_role`, unique on `(user_id, department)`

2. **`rooms`** -- Master room registry (shared by Reception & Housekeeping)
   - `room_number` (unique), `floor`, `room_type`, `status`, `capacity`, `amenities` (jsonb), `is_active`, `notes`

3. **`guests`** -- Guest profiles
   - `first_name`, `last_name`, `email`, `phone`, `nationality`, `passport_number`, `notes`, `visit_count`

4. **`reservations`** -- Bookings
   - `guest_id` FK, `room_id` FK, `check_in_date`, `check_out_date`, `status` (confirmed/checked_in/checked_out/cancelled/no_show), `adults`, `children`, `rate_per_night`, `total_amount`, `payment_status`, `source`, `special_requests`, `assigned_by`

5. **`room_charges`** -- Folio line items
   - `reservation_id` FK, `description`, `amount`, `charge_type`, `charged_by`

6. **`housekeeping_tasks`** -- Daily room cleaning status
   - `room_id` FK, `task_date`, `status` (hk_status), `priority`, `assigned_to`, `started_at`, `completed_at`, `inspected_by`, `inspected_at`, `notes`, `task_type`, unique on `(room_id, task_date)`

7. **`housekeeping_logs`** -- Audit trail
   - `task_id` FK, `action`, `performed_by`, `details`

8. **`maintenance_requests`** -- Issues found during cleaning
   - `room_id` FK, `reported_by`, `description`, `priority`, `status`, `resolved_by`, `resolved_at`, `photos` (jsonb)

### Security Definer Functions
```sql
has_department(user_id, department) → boolean
is_department_manager(user_id, department) → boolean
```

### RLS Strategy
- **`rooms`**: All authenticated SELECT; reception/housekeeping department members can UPDATE; reception managers can INSERT/DELETE
- **`guests`, `reservations`, `room_charges`**: Reception department SELECT/INSERT/UPDATE; reception managers DELETE; admins full access
- **`housekeeping_tasks`**: Housekeeping + reception can SELECT; housekeeping members can UPDATE own assigned; housekeeping managers full write
- **`maintenance_requests`**: Housekeeping can SELECT/INSERT; housekeeping managers can UPDATE/DELETE
- **`user_departments`**: Managers/admins can SELECT all; admins can INSERT/UPDATE/DELETE

### Realtime
Enable `supabase_realtime` for all 8 new tables.

### Data Migration
- Existing users with `manager` global role → assigned to `restaurant` department as `manager`
- Existing users with `staff` global role → assigned to `restaurant` department as `staff`
- Admins bypass departments entirely

---

## Phase 2: Auth & Access Control Updates

### `src/hooks/useAuth.tsx`
- Fetch `user_departments` alongside `user_roles`
- Expose: `departments: { department, department_role }[]`, `hasDepartment(dept)`, `isDepartmentManager(dept)`

### `src/components/auth/ProtectedRoute.tsx`
- Add `requireDepartment?: string` prop
- If set, check `hasDepartment()` or `isAdmin` before allowing access

### `src/components/layout/AppShell.tsx`
- Filter sidebar nav items by department membership:
  - Reception dept → Dashboard, Reception
  - Housekeeping dept → Dashboard, Housekeeping
  - Restaurant dept → Dashboard, Table Plan, Inventory, Products, Import, Orders, Reports
  - Admins → everything
- New icons: `BedDouble` (Reception), `SprayCan` (Housekeeping)

### `src/App.tsx`
- Add routes: `/reception` wrapped in `requireDepartment="reception"`, `/housekeeping` wrapped in `requireDepartment="housekeeping"`

---

## Phase 3: User Management Updates

### `supabase/functions/manage-users/index.ts`
- New actions: `assignDepartment`, `removeDepartment`
- `createUser` accepts `departments: { department, department_role }[]`

### `src/components/users/AddUserDialog.tsx`
- Add multi-department selector: checkboxes for each department + role dropdown per selected department

### `src/components/users/EditUserDialog.tsx`
- Add department editing section

### `src/components/users/UserTable.tsx`
- Show department badges (colored) next to each user

### `src/hooks/useUsers.tsx`
- Fetch `user_departments` alongside profiles/roles
- Add `assignDepartment` and `removeDepartment` mutations

---

## Phase 4: Reception Module

### Color Variables (added to `src/index.css`)
```text
--room-available:   142 71% 45%  (green)
--room-occupied:    199 89% 48%  (blue)
--room-checkout:    38 92% 50%   (amber)
--room-maintenance: 0 72% 51%   (red)
--room-reserved:    280 50% 50%  (purple)
```

### `src/pages/Reception.tsx`
Three tab views:
1. **Room Board** -- Grid of `RoomCard` components, color = status, click to expand, filter by floor/status/type
2. **Today's Overview** -- Split: arrivals (left) with check-in button, departures (right) with check-out button
3. **Guest Directory** -- Searchable table, quick-add guest

### Components (`src/components/reception/`)
- `RoomCard` -- colored card: room number, guest name, dates, status indicator
- `RoomBoard` -- grid layout with filter bar
- `CheckInDialog` -- room assignment, ID checkbox, key card note, special requests
- `CheckOutDialog` -- outstanding charges summary, payment status, minibar check
- `ReservationForm` -- full create/edit booking form
- `GuestForm` -- create/edit guest profile
- `TodayOverview` -- arrivals/departures split panel
- `FolioPanel` -- charges list with add-charge button

### `src/hooks/useReception.tsx`
- Queries: `useRooms`, `useGuests`, `useReservations`, `useRoomCharges`
- Mutations: create/update/delete for each + `checkIn`, `checkOut` composite operations
- Realtime subscriptions on all 4 tables

### Cross-module: Checking out a guest auto-creates a housekeeping task (checkout_clean) for that room

---

## Phase 5: Housekeeping Module

### Color Variables
```text
--hk-dirty:        0 72% 51%   (red)
--hk-in-progress:  38 92% 50%  (amber)
--hk-clean:        142 71% 45% (green)
--hk-inspected:    199 89% 48% (blue)
```

### `src/pages/Housekeeping.tsx`
Two views:
1. **Status Board** -- Grid of `HKRoomCard`, one-tap status progression (dirty→in_progress→clean→inspected), filter by floor/status/staff/priority, bulk-assign staff
2. **My Tasks** -- Filtered to logged-in user's assignments only, simplified checklist cards, "Report Issue" button

### Components (`src/components/housekeeping/`)
- `HKRoomCard` -- colored card with one-tap status button, staff avatar, priority badge
- `HKStatusBoard` -- grid with filters and bulk-assign
- `MyTasksList` -- staff-focused simplified list
- `AssignStaffDialog` -- select staff to assign to rooms, supports bulk
- `MaintenanceReportDialog` -- description, priority, photo upload (Supabase Storage)
- `HKDailySummary` -- stats bar: X dirty, Y in progress, Z clean, W inspected
- `GenerateTasksButton` -- creates today's tasks based on reservations (checkout rooms = checkout_clean, occupied = stay_over)

### `src/hooks/useHousekeeping.tsx`
- Queries: `useHousekeepingTasks`, `useMaintenanceRequests`
- Mutations: update status, assign staff, create/resolve maintenance
- Realtime subscriptions

### Cross-module: When housekeeping marks a room "inspected", reception's Room Board shows it as available

---

## Phase 6: Translations

Update `src/contexts/LanguageContext.tsx` with EN/DA keys for both modules (~80 new translation keys covering room types, statuses, form labels, buttons, etc.)

---

## Files Summary

| Action | Files |
|--------|-------|
| DB Migration | 1 large migration: enums, 8 tables, RLS, functions, realtime, data migration |
| Create | `src/pages/Reception.tsx`, `src/pages/Housekeeping.tsx` |
| Create | `src/hooks/useReception.tsx`, `src/hooks/useHousekeeping.tsx` |
| Create | `src/components/reception/` (8 components) |
| Create | `src/components/housekeeping/` (6 components) |
| Modify | `src/hooks/useAuth.tsx` (add department data) |
| Modify | `src/hooks/useUsers.tsx` (add department mutations) |
| Modify | `src/components/auth/ProtectedRoute.tsx` (add requireDepartment) |
| Modify | `src/components/layout/AppShell.tsx` (dept-filtered nav) |
| Modify | `src/App.tsx` (new routes) |
| Modify | `src/components/users/AddUserDialog.tsx` (dept selector) |
| Modify | `src/components/users/EditUserDialog.tsx` (dept editing) |
| Modify | `src/components/users/UserTable.tsx` (dept badges) |
| Modify | `supabase/functions/manage-users/index.ts` (dept actions) |
| Modify | `src/index.css` (color variables) |
| Modify | `src/contexts/LanguageContext.tsx` (translations) |

## Implementation Order
Phases 1→2→3 first (foundation), then 4 and 5 can be built in sequence. Phase 6 throughout.

