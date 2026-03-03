import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useReservationMutations, type Room, type Reservation } from '@/hooks/useReception';
import { CheckCircle } from 'lucide-react';

interface CheckInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: Room;
  reservation?: Reservation;
}

export function CheckInDialog({ open, onOpenChange, room, reservation }: CheckInDialogProps) {
  const { t } = useLanguage();
  const { checkIn } = useReservationMutations();

  const handleCheckIn = () => {
    if (!reservation) return;
    checkIn.mutate(reservation.id, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('reception.checkIn')} — {t('reception.room')} {room.room_number}</DialogTitle>
        </DialogHeader>

        {reservation ? (
          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-muted">
              <p className="font-medium">{reservation.guest?.first_name} {reservation.guest?.last_name}</p>
              <p className="text-sm text-muted-foreground">
                {reservation.check_in_date} → {reservation.check_out_date}
              </p>
              <p className="text-sm text-muted-foreground">
                {reservation.adults} {t('reception.adults')}{reservation.children > 0 ? `, ${reservation.children} ${t('reception.children')}` : ''}
              </p>
              {reservation.special_requests && (
                <p className="text-sm mt-2 text-primary">{reservation.special_requests}</p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">{t('reception.noReservation')}</p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleCheckIn} disabled={!reservation || checkIn.isPending}>
            <CheckCircle className="h-4 w-4 mr-2" />
            {t('reception.checkIn')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
