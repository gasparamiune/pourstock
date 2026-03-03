import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Increment this version string every time you publish meaningful updates
const CURRENT_VERSION = '2026-03-03-v1';

const UPDATES = [
  'Improved table plan layout for large parties (18+ guests)',
  'Added wine menu indicator on table cards',
  'New course timing alerts — visual warning when service is overdue',
  'Undo & redo support in the table plan',
  'Visual shine effect when a new reservation is added',
  'Reception staff can now manage BUFF tables in the table plan',
  'Bug fixes and performance improvements',
];

interface UpdateAlertProps {
  userName?: string | null;
  userId?: string | null;
}

export function UpdateAlert({ userName, userId }: UpdateAlertProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const checkVersion = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('last_update_seen')
        .eq('user_id', userId)
        .single();

      if (data && (data as any).last_update_seen !== CURRENT_VERSION) {
        setTimeout(() => setOpen(true), 800);
      } else if (!data) {
        setTimeout(() => setOpen(true), 800);
      }
    };
    checkVersion();
  }, [userId]);

  const handleDismiss = async () => {
    setOpen(false);
    if (userId) {
      await supabase
        .from('profiles')
        .update({ last_update_seen: CURRENT_VERSION } as any)
        .eq('user_id', userId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-full bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-xl">
              {userName ? `Welcome back, ${userName.split(' ')[0]}!` : 'Welcome back!'}
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            Here are the latest updates on PourStock.
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2.5 my-4">
          {UPDATES.map((update, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm">
              <Check className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
              <span className="text-foreground/90">{update}</span>
            </li>
          ))}
        </ul>

        <Button onClick={handleDismiss} className="w-full">
          Got it, let's go!
        </Button>
      </DialogContent>
    </Dialog>
  );
}
