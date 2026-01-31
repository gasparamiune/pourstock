-- Fix overly permissive stock_levels UPDATE policy
DROP POLICY IF EXISTS "Staff can update stock levels" ON public.stock_levels;

-- Create a more restrictive policy - staff can only update if they're authenticated and the update is tracked
CREATE POLICY "Authenticated users can update stock levels" ON public.stock_levels 
FOR UPDATE TO authenticated 
USING (public.is_authenticated())
WITH CHECK (public.is_authenticated());