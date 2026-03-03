import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, X, Pencil, Trash2, KeyRound, Copy } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import type { UserProfile } from '@/hooks/useUsers';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

const deptColors: Record<string, string> = {
  reception: 'bg-[hsl(var(--room-occupied))]/15 text-[hsl(var(--room-occupied))] border-[hsl(var(--room-occupied))]/30',
  housekeeping: 'bg-[hsl(var(--hk-clean))]/15 text-[hsl(var(--hk-clean))] border-[hsl(var(--hk-clean))]/30',
  restaurant: 'bg-primary/15 text-primary border-primary/30',
};

interface UserTableProps {
  users: UserProfile[];
  currentUserId: string;
  onApprove: (userId: string, approved: boolean) => void;
  onUpdateRole: (userId: string, role: string) => void;
  onEdit: (user: UserProfile) => void;
  onDelete: (userId: string) => void;
  onResetPassword: (email: string) => Promise<any>;
}

export function UserTable({ users, currentUserId, onApprove, onUpdateRole, onEdit, onDelete, onResetPassword }: UserTableProps) {
  const { t } = useLanguage();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [deleteTarget, setDeleteTarget] = useState<UserProfile | null>(null);
  const [resetLink, setResetLink] = useState<string | null>(null);

  const handleResetPassword = async (email: string) => {
    const result = await onResetPassword(email);
    if (result?.link) {
      setResetLink(result.link);
    }
  };

  const copyLink = () => {
    if (resetLink) {
      navigator.clipboard.writeText(resetLink);
      toast({ title: 'Link copied to clipboard' });
    }
  };

  return (
    <>
      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('users.fullName')}</TableHead>
              <TableHead>{t('users.email')}</TableHead>
              <TableHead className="hidden md:table-cell">{t('users.phone')}</TableHead>
              <TableHead>{t('users.role')}</TableHead>
              <TableHead className="hidden lg:table-cell">{t('users.departments')}</TableHead>
              <TableHead>{t('users.status')}</TableHead>
              <TableHead className="text-right">{t('users.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const isTargetAdmin = user.role === 'admin';
              const canModify = isAdmin || !isTargetAdmin;
              const isSelf = user.user_id === currentUserId;

              return (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.full_name || '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{user.phone_number || '—'}</TableCell>
                  <TableCell>
                    {canModify && !isSelf ? (
                      <Select value={user.role} onValueChange={(role) => onUpdateRole(user.user_id, role)}>
                        <SelectTrigger className="w-28 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="staff">Staff</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          {isAdmin && <SelectItem value="admin">Admin</SelectItem>}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline" className={cn(
                        "capitalize",
                        user.role === 'admin' && "border-primary text-primary",
                        user.role === 'manager' && "border-[hsl(var(--info))] text-[hsl(var(--info))]"
                      )}>
                        {user.role}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {(user.departments || []).map(d => (
                        <Badge key={d.department} variant="outline" className={cn("text-xs capitalize", deptColors[d.department] || '')}>
                          {t(`dept.${d.department}`)}
                        </Badge>
                      ))}
                      {(!user.departments || user.departments.length === 0) && (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.is_approved ? (
                      <Badge className="bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-[hsl(var(--success))]/20">
                        {t('users.approved')}
                      </Badge>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="border-primary/30 text-primary">
                          {t('users.pending')}
                        </Badge>
                        {canModify && (
                          <>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-[hsl(var(--success))]" onClick={() => onApprove(user.user_id, true)}>
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => onApprove(user.user_id, false)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {canModify && (
                        <>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEdit(user)} title={t('common.edit')}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleResetPassword(user.email!)} title={t('users.resetPassword')} disabled={!user.email}>
                            <KeyRound className="h-4 w-4" />
                          </Button>
                          {!isSelf && (
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget(user)} title={t('common.delete')}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('users.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('users.confirmDeleteDesc')} <strong>{deleteTarget?.full_name || deleteTarget?.email}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) onDelete(deleteTarget.user_id);
                setDeleteTarget(null);
              }}
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset password link */}
      <AlertDialog open={!!resetLink} onOpenChange={() => setResetLink(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('users.resetLinkGenerated')}</AlertDialogTitle>
            <AlertDialogDescription className="break-all text-xs font-mono bg-muted p-3 rounded-lg mt-2">
              {resetLink}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={copyLink}>
              <Copy className="h-4 w-4 mr-2" /> {t('users.copyLink')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
