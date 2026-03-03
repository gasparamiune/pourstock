import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';

const DEPARTMENTS = ['reception', 'housekeeping', 'restaurant'] as const;
const DEPT_ROLES: Record<string, string[]> = {
  reception: ['manager', 'receptionist', 'staff'],
  housekeeping: ['manager', 'hk_worker', 'staff'],
  restaurant: ['manager', 'staff'],
};

interface DeptSelection {
  department: string;
  department_role: string;
}

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { email: string; password: string; fullName: string; phone?: string; role: string; departments?: DeptSelection[] }) => void;
  isLoading: boolean;
}

export function AddUserDialog({ open, onOpenChange, onSubmit, isLoading }: AddUserDialogProps) {
  const { t } = useLanguage();
  const { isAdmin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('staff');
  const [selectedDepts, setSelectedDepts] = useState<DeptSelection[]>([]);

  const toggleDept = (dept: string, checked: boolean) => {
    if (checked) {
      setSelectedDepts([...selectedDepts, { department: dept, department_role: 'staff' }]);
    } else {
      setSelectedDepts(selectedDepts.filter(d => d.department !== dept));
    }
  };

  const setDeptRole = (dept: string, deptRole: string) => {
    setSelectedDepts(selectedDepts.map(d => d.department === dept ? { ...d, department_role: deptRole } : d));
  };

  const handleSubmit = () => {
    if (!email || !password || !fullName) return;
    onSubmit({
      email,
      password,
      fullName,
      phone: phone || undefined,
      role,
      departments: selectedDepts.length > 0 ? selectedDepts : undefined,
    });
    setEmail('');
    setPassword('');
    setFullName('');
    setPhone('');
    setRole('staff');
    setSelectedDepts([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('users.addUser')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>{t('users.fullName')}</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" />
          </div>
          <div>
            <Label>{t('users.email')}</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@hotel.dk" />
          </div>
          <div>
            <Label>{t('users.phone')}</Label>
            <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+45 12345678" />
          </div>
          <div>
            <Label>{t('users.tempPassword')}</Label>
            <Input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Temporary password" />
          </div>
          <div>
            <Label>{t('users.role')}</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                {isAdmin && <SelectItem value="admin">Admin</SelectItem>}
              </SelectContent>
            </Select>
          </div>

          {/* Department assignment */}
          <div>
            <Label>{t('users.departments')}</Label>
            <div className="mt-2 space-y-3">
              {DEPARTMENTS.map(dept => {
                const isChecked = selectedDepts.some(d => d.department === dept);
                const selection = selectedDepts.find(d => d.department === dept);
                return (
                  <div key={dept} className="flex items-center gap-3">
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={(checked) => toggleDept(dept, !!checked)}
                    />
                    <span className="text-sm capitalize min-w-[100px]">{t(`dept.${dept}`)}</span>
                    {isChecked && (
                      <Select value={selection?.department_role || 'staff'} onValueChange={(v) => setDeptRole(dept, v)}>
                        <SelectTrigger className="w-36 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DEPT_ROLES[dept].map(r => (
                            <SelectItem key={r} value={r} className="capitalize">{r.replace('_', ' ')}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleSubmit} disabled={isLoading || !email || !password || !fullName}>
            {isLoading ? t('common.loading') : t('common.add')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
