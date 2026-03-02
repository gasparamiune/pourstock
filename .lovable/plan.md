
# Real-Time Live Updates Across the Entire App

## Problem
Currently, data is only fetched once on page load. When multiple staff members use the app simultaneously (common during service), changes made on one device don't appear on others until a manual refresh.

## Solution
Enable Supabase Realtime on all key tables and add live subscriptions throughout the app. Each data hook will listen for database changes and automatically refetch when updates occur.

## Database Migration

Enable Realtime broadcasting for all relevant tables:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.table_plans;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stock_levels;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stock_movements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.purchase_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.purchase_order_items;
```

Also make `table_plans` shared per date (not per user) so all devices see the same plan:
- Drop the existing unique constraint on `(plan_date, created_by)`
- Add a new unique constraint on `(plan_date)` only
- Update the UPDATE RLS policy to allow any authenticated user to update any plan (not just their own)

## Changes to Existing Hooks

### `src/hooks/useInventoryData.tsx`
Add a realtime subscription to each hook that triggers a refetch when data changes:

- **useProducts**: Subscribe to `postgres_changes` on `products` table, call `refetch` on any event
- **useLocations**: Subscribe to `locations` table changes
- **useStockLevels**: Subscribe to `stock_levels` table changes
- **useStockMovements**: Subscribe to `stock_movements` table changes
- **useDashboardData**: Subscribe to `products`, `stock_levels`, and `stock_movements` (multi-table listener)

Pattern for each hook:
```text
useEffect(() => {
  const channel = supabase
    .channel('products-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products' },
      () => refetch()
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}, []);
```

### `src/hooks/useUsers.tsx`
Subscribe to `profiles` and `user_roles` tables. On any change, invalidate the `['users']` React Query cache to trigger a refetch.

### `src/pages/TablePlan.tsx`
- Make the plan shared: upsert by `plan_date` only (remove `created_by` from the conflict key, still store `created_by` as "last editor")
- Reduce auto-save debounce from 2000ms to 500ms
- Add a realtime subscription on `table_plans` filtered to today's date
- Use a `lastSaveRef` timestamp to skip "echo" events (don't overwrite local state with your own save)
- Auto-load today's plan on mount so a second device immediately sees the current state

## New Reusable Hook (optional but clean)

### `src/hooks/useRealtimeSubscription.tsx`
A small utility hook to reduce boilerplate:
```text
useRealtimeSubscription(table, callback, filter?)
```
Each data hook calls this internally.

## Files to Modify

| File | Change |
|------|--------|
| Database migration | Enable realtime on 9 tables, update table_plans constraints and RLS |
| `src/hooks/useInventoryData.tsx` | Add realtime subscriptions to all 6 hooks |
| `src/hooks/useUsers.tsx` | Add realtime subscription for profiles + user_roles |
| `src/pages/TablePlan.tsx` | Shared plan model, 500ms debounce, realtime sync with echo protection, auto-load today |
| `src/hooks/useRealtimeSubscription.tsx` | New -- small reusable hook for subscribing to table changes |

## How It Works in Practice
1. Device A marks a guest as "Arrived" on the table plan -- saved within 500ms
2. Device B receives the realtime event and updates its view instantly
3. Staff member updates stock count on a tablet -- dashboard on the computer updates automatically
4. Manager approves a new user -- the user management page on another device shows the change immediately
