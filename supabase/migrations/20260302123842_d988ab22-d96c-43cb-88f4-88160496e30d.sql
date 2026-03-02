
-- Enable realtime on all key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.table_plans;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stock_levels;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stock_movements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.purchase_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.purchase_order_items;

-- Make table_plans shared per date (not per user)
-- Drop existing unique constraint on (plan_date, created_by)
ALTER TABLE public.table_plans DROP CONSTRAINT IF EXISTS table_plans_plan_date_created_by_key;

-- Add unique constraint on plan_date only (one shared plan per day)
ALTER TABLE public.table_plans ADD CONSTRAINT table_plans_plan_date_key UNIQUE (plan_date);

-- Update RLS: allow any authenticated user to update any plan (shared editing)
DROP POLICY IF EXISTS "Authenticated users can update their own plans" ON public.table_plans;
CREATE POLICY "Authenticated users can update table plans"
  ON public.table_plans
  FOR UPDATE
  USING (is_authenticated());

-- Also allow any authenticated user to insert (not just creator check)
DROP POLICY IF EXISTS "Authenticated users can create table plans" ON public.table_plans;
CREATE POLICY "Authenticated users can create table plans"
  ON public.table_plans
  FOR INSERT
  WITH CHECK (is_authenticated());
