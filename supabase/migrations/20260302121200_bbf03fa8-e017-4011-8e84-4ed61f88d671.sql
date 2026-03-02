
-- Add phone_number and is_approved columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_approved boolean NOT NULL DEFAULT false;

-- Drop existing admin-only policies on profiles that we're replacing
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Recreate with is_manager_or_admin()
CREATE POLICY "Managers and admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (is_manager_or_admin());

CREATE POLICY "Managers and admins can update any profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (is_manager_or_admin());

CREATE POLICY "Managers and admins can delete profiles"
ON public.profiles FOR DELETE
TO authenticated
USING (is_manager_or_admin());

CREATE POLICY "Managers and admins can insert profiles"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (is_manager_or_admin());

-- Drop existing admin-only policies on user_roles that we're replacing
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- Recreate with is_manager_or_admin()
CREATE POLICY "Managers and admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (is_manager_or_admin());

CREATE POLICY "Managers and admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (is_manager_or_admin());

-- Auto-approve existing users
UPDATE public.profiles SET is_approved = true;
