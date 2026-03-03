
-- =============================================
-- Phase 1: Unified Hotel Operations Foundation
-- =============================================

-- 1. NEW ENUMS
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
CREATE TYPE public.reservation_status AS ENUM ('confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show');

-- 2. TABLES

-- 2a. user_departments
CREATE TABLE public.user_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  department public.department NOT NULL,
  department_role public.department_role NOT NULL DEFAULT 'staff',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, department)
);

-- 2b. rooms
CREATE TABLE public.rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number text NOT NULL UNIQUE,
  floor integer NOT NULL DEFAULT 1,
  room_type public.room_type NOT NULL DEFAULT 'double',
  status public.room_status NOT NULL DEFAULT 'available',
  capacity integer NOT NULL DEFAULT 2,
  amenities jsonb DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2c. guests
CREATE TABLE public.guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone text,
  nationality text,
  passport_number text,
  notes text,
  visit_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2d. reservations
CREATE TABLE public.reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id uuid NOT NULL REFERENCES public.guests(id) ON DELETE RESTRICT,
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE RESTRICT,
  check_in_date date NOT NULL,
  check_out_date date NOT NULL,
  status public.reservation_status NOT NULL DEFAULT 'confirmed',
  adults integer NOT NULL DEFAULT 1,
  children integer NOT NULL DEFAULT 0,
  rate_per_night numeric,
  total_amount numeric,
  payment_status public.payment_status NOT NULL DEFAULT 'pending',
  source text,
  special_requests text,
  assigned_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2e. room_charges
CREATE TABLE public.room_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  description text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  charge_type public.charge_type NOT NULL DEFAULT 'other',
  charged_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2f. housekeeping_tasks
CREATE TABLE public.housekeeping_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  task_date date NOT NULL DEFAULT CURRENT_DATE,
  status public.hk_status NOT NULL DEFAULT 'dirty',
  priority public.hk_priority NOT NULL DEFAULT 'normal',
  task_type public.hk_task_type NOT NULL DEFAULT 'stay_over',
  assigned_to uuid,
  started_at timestamptz,
  completed_at timestamptz,
  inspected_by uuid,
  inspected_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_id, task_date)
);

-- 2g. housekeeping_logs
CREATE TABLE public.housekeeping_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.housekeeping_tasks(id) ON DELETE CASCADE,
  action text NOT NULL,
  performed_by uuid NOT NULL,
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2h. maintenance_requests
CREATE TABLE public.maintenance_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  reported_by uuid NOT NULL,
  description text NOT NULL,
  priority public.maintenance_priority NOT NULL DEFAULT 'medium',
  status public.maintenance_status NOT NULL DEFAULT 'open',
  resolved_by uuid,
  resolved_at timestamptz,
  photos jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. UPDATED_AT TRIGGERS
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_guests_updated_at BEFORE UPDATE ON public.guests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_housekeeping_tasks_updated_at BEFORE UPDATE ON public.housekeeping_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_maintenance_requests_updated_at BEFORE UPDATE ON public.maintenance_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. SECURITY DEFINER FUNCTIONS
CREATE OR REPLACE FUNCTION public.has_department(_user_id uuid, _department public.department)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_departments
    WHERE user_id = _user_id AND department = _department
  )
$$;

CREATE OR REPLACE FUNCTION public.is_department_manager(_user_id uuid, _department public.department)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_departments
    WHERE user_id = _user_id
      AND department = _department
      AND department_role = 'manager'
  )
$$;

-- 5. ENABLE RLS ON ALL NEW TABLES
ALTER TABLE public.user_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.housekeeping_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.housekeeping_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;

-- 6. RLS POLICIES

-- user_departments
CREATE POLICY "Users can view own departments" ON public.user_departments
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Managers and admins can view all departments" ON public.user_departments
  FOR SELECT USING (public.is_manager_or_admin());
CREATE POLICY "Admins can manage departments" ON public.user_departments
  FOR ALL USING (public.is_admin());

-- rooms
CREATE POLICY "Authenticated users can view rooms" ON public.rooms
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Reception or HK can update rooms" ON public.rooms
  FOR UPDATE USING (
    public.is_admin()
    OR public.has_department(auth.uid(), 'reception')
    OR public.has_department(auth.uid(), 'housekeeping')
  );
CREATE POLICY "Reception managers or admins can insert rooms" ON public.rooms
  FOR INSERT WITH CHECK (
    public.is_admin()
    OR public.is_department_manager(auth.uid(), 'reception')
  );
CREATE POLICY "Reception managers or admins can delete rooms" ON public.rooms
  FOR DELETE USING (
    public.is_admin()
    OR public.is_department_manager(auth.uid(), 'reception')
  );

-- guests
CREATE POLICY "Reception can view guests" ON public.guests
  FOR SELECT USING (
    public.is_admin()
    OR public.has_department(auth.uid(), 'reception')
  );
CREATE POLICY "Reception can insert guests" ON public.guests
  FOR INSERT WITH CHECK (
    public.is_admin()
    OR public.has_department(auth.uid(), 'reception')
  );
CREATE POLICY "Reception can update guests" ON public.guests
  FOR UPDATE USING (
    public.is_admin()
    OR public.has_department(auth.uid(), 'reception')
  );
CREATE POLICY "Reception managers can delete guests" ON public.guests
  FOR DELETE USING (
    public.is_admin()
    OR public.is_department_manager(auth.uid(), 'reception')
  );

-- reservations
CREATE POLICY "Reception can view reservations" ON public.reservations
  FOR SELECT USING (
    public.is_admin()
    OR public.has_department(auth.uid(), 'reception')
  );
CREATE POLICY "Reception can insert reservations" ON public.reservations
  FOR INSERT WITH CHECK (
    public.is_admin()
    OR public.has_department(auth.uid(), 'reception')
  );
CREATE POLICY "Reception can update reservations" ON public.reservations
  FOR UPDATE USING (
    public.is_admin()
    OR public.has_department(auth.uid(), 'reception')
  );
CREATE POLICY "Reception managers can delete reservations" ON public.reservations
  FOR DELETE USING (
    public.is_admin()
    OR public.is_department_manager(auth.uid(), 'reception')
  );

-- room_charges
CREATE POLICY "Reception can view charges" ON public.room_charges
  FOR SELECT USING (
    public.is_admin()
    OR public.has_department(auth.uid(), 'reception')
  );
CREATE POLICY "Reception can insert charges" ON public.room_charges
  FOR INSERT WITH CHECK (
    public.is_admin()
    OR public.has_department(auth.uid(), 'reception')
  );
CREATE POLICY "Reception can update charges" ON public.room_charges
  FOR UPDATE USING (
    public.is_admin()
    OR public.has_department(auth.uid(), 'reception')
  );
CREATE POLICY "Reception managers can delete charges" ON public.room_charges
  FOR DELETE USING (
    public.is_admin()
    OR public.is_department_manager(auth.uid(), 'reception')
  );

-- housekeeping_tasks
CREATE POLICY "HK and reception can view tasks" ON public.housekeeping_tasks
  FOR SELECT USING (
    public.is_admin()
    OR public.has_department(auth.uid(), 'housekeeping')
    OR public.has_department(auth.uid(), 'reception')
  );
CREATE POLICY "HK can insert tasks" ON public.housekeeping_tasks
  FOR INSERT WITH CHECK (
    public.is_admin()
    OR public.has_department(auth.uid(), 'housekeeping')
    OR public.has_department(auth.uid(), 'reception')
  );
CREATE POLICY "HK members can update own or managers all" ON public.housekeeping_tasks
  FOR UPDATE USING (
    public.is_admin()
    OR public.is_department_manager(auth.uid(), 'housekeeping')
    OR (public.has_department(auth.uid(), 'housekeeping') AND assigned_to = auth.uid())
  );
CREATE POLICY "HK managers can delete tasks" ON public.housekeeping_tasks
  FOR DELETE USING (
    public.is_admin()
    OR public.is_department_manager(auth.uid(), 'housekeeping')
  );

-- housekeeping_logs
CREATE POLICY "HK can view logs" ON public.housekeeping_logs
  FOR SELECT USING (
    public.is_admin()
    OR public.has_department(auth.uid(), 'housekeeping')
  );
CREATE POLICY "HK can insert logs" ON public.housekeeping_logs
  FOR INSERT WITH CHECK (
    public.is_admin()
    OR public.has_department(auth.uid(), 'housekeeping')
  );

-- maintenance_requests
CREATE POLICY "HK can view maintenance" ON public.maintenance_requests
  FOR SELECT USING (
    public.is_admin()
    OR public.has_department(auth.uid(), 'housekeeping')
  );
CREATE POLICY "HK can report maintenance" ON public.maintenance_requests
  FOR INSERT WITH CHECK (
    public.is_admin()
    OR public.has_department(auth.uid(), 'housekeeping')
  );
CREATE POLICY "HK managers can update maintenance" ON public.maintenance_requests
  FOR UPDATE USING (
    public.is_admin()
    OR public.is_department_manager(auth.uid(), 'housekeeping')
  );
CREATE POLICY "HK managers can delete maintenance" ON public.maintenance_requests
  FOR DELETE USING (
    public.is_admin()
    OR public.is_department_manager(auth.uid(), 'housekeeping')
  );

-- 7. REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_departments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.guests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_charges;
ALTER PUBLICATION supabase_realtime ADD TABLE public.housekeeping_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.housekeeping_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.maintenance_requests;

-- 8. DATA MIGRATION: Assign existing users to restaurant department
INSERT INTO public.user_departments (user_id, department, department_role)
SELECT ur.user_id, 'restaurant'::public.department,
  CASE ur.role
    WHEN 'manager' THEN 'manager'::public.department_role
    WHEN 'staff' THEN 'staff'::public.department_role
    ELSE 'staff'::public.department_role
  END
FROM public.user_roles ur
WHERE ur.role IN ('manager', 'staff')
ON CONFLICT (user_id, department) DO NOTHING;

-- 9. INDEXES
CREATE INDEX idx_user_departments_user_id ON public.user_departments(user_id);
CREATE INDEX idx_rooms_status ON public.rooms(status);
CREATE INDEX idx_rooms_floor ON public.rooms(floor);
CREATE INDEX idx_reservations_dates ON public.reservations(check_in_date, check_out_date);
CREATE INDEX idx_reservations_status ON public.reservations(status);
CREATE INDEX idx_reservations_guest ON public.reservations(guest_id);
CREATE INDEX idx_reservations_room ON public.reservations(room_id);
CREATE INDEX idx_housekeeping_tasks_date ON public.housekeeping_tasks(task_date);
CREATE INDEX idx_housekeeping_tasks_assigned ON public.housekeeping_tasks(assigned_to);
CREATE INDEX idx_maintenance_requests_room ON public.maintenance_requests(room_id);
CREATE INDEX idx_maintenance_requests_status ON public.maintenance_requests(status);
