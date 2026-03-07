import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Increment this version string every time you publish meaningful updates
const CURRENT_VERSION = '2026-03-07-v2';

const UPDATES = [
  '👋 Velkommen Mohammad & Emilie til PourStock!',
  '🎯 Ny ikon-bar på bordkort — Kaffe, Vin, Velkomst, Flag synligt med ét blik',
  '📄 Smart PDF-udtræk — ikoner opdages automatisk fra Køkkenlisten',
  '🏨 Reception kan nu se alle borde og rette værelsenumre',
  '🏴 Nyt Flag-ikon tilføjet som selvstændig funktion',
  '📝 Navngiv din bordplan — eller brug datoen fra Køkkenlisten',
  '🖨️ Forbedret print-layout — fulde noter, ingen afklipning',
  '⬅️ "Tilbage"-knap erstatter "Ny upload"',
];

interface UpdateAlertProps {
  userName?: string | null;
  userId?: string | null;
}

export function UpdateAlert({ userName, userId }: UpdateAlertProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) return;

    const checkVersion = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('last_update_seen')
        .eq('user_id', userId)
        .single();

      if (data && (data as any).last_update_seen !== CURRENT_VERSION) {
        setTimeout(() => {
          toast({
            title: '🆕 En ny opdatering er kommet!',
            description: 'Klik for at se hvad der er nyt.',
          });
          setOpen(true);
        }, 800);
      } else if (!data) {
        setTimeout(() => setOpen(true), 800);
      }
    };
    checkVersion();

    // Re-check on window focus (handles "app already open" scenario)
    const handleFocus = () => checkVersion();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
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
              {userName ? `Velkommen tilbage, ${userName.split(' ')[0]}!` : 'Velkommen tilbage!'}
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            Her er de seneste opdateringer til PourStock.
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
          Forstået, lad os gå!
        </Button>
      </DialogContent>
    </Dialog>
  );
}
