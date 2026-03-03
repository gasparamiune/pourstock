import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'admin' | 'manager' | 'staff';
type Department = 'reception' | 'housekeeping' | 'restaurant';
type DepartmentRole = 'manager' | 'receptionist' | 'hk_worker' | 'staff';

interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  phone_number: string | null;
  is_approved: boolean;
}

interface UserDepartment {
  department: Department;
  department_role: DepartmentRole;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  departments: UserDepartment[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isManager: boolean;
  isStaff: boolean;
  hasDepartment: (dept: Department) => boolean;
  isDepartmentManager: (dept: Department) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [departments, setDepartments] = useState<UserDepartment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setRoles([]);
          setDepartments([]);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchUserData(userId: string) {
    try {
      // Fetch profile, roles, and departments in parallel
      const [profileRes, rolesRes, deptRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', userId).single(),
        supabase.from('user_roles').select('role').eq('user_id', userId),
        supabase.from('user_departments').select('department, department_role').eq('user_id', userId),
      ]);

      if (profileRes.data) {
        setProfile(profileRes.data as Profile);
      }

      if (rolesRes.data) {
        setRoles(rolesRes.data.map(r => r.role as AppRole));
      }

      if (deptRes.data) {
        setDepartments(deptRes.data as UserDepartment[]);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching user data:', error);
      }
    } finally {
      setLoading(false);
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { full_name: fullName },
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setRoles([]);
    setDepartments([]);
  };

  const isAdmin = roles.includes('admin');
  const isManager = roles.includes('manager') || isAdmin;
  const isStaff = roles.includes('staff') || isManager;

  const hasDepartment = useCallback((dept: Department) => {
    if (isAdmin) return true;
    return departments.some(d => d.department === dept);
  }, [departments, isAdmin]);

  const isDepartmentManager = useCallback((dept: Department) => {
    if (isAdmin) return true;
    return departments.some(d => d.department === dept && d.department_role === 'manager');
  }, [departments, isAdmin]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        roles,
        departments,
        loading,
        signIn,
        signUp,
        signOut,
        isAdmin,
        isManager,
        isStaff,
        hasDepartment,
        isDepartmentManager,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
