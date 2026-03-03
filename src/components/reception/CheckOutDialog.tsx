import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useReservationMutations, useRoomCharges, type Room, type Reservation } from '@/hooks/useReception';
import { LogOut } from 'lucide-react';

interface CheckOutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: Room;
  reservation?: Reservation;
}

export function CheckOutDialog({ open, onOpenChange, room, reservation }: CheckOutDialogProps) {
  const { t } = useLanguage();
  const { checkOut } = useReservationMutations();
  const { data: charges } = useRoomCharges(reservation?.id);

  const totalCharges = (charges || []).reduce((sum, c) => sum + c.amount, 0);

  const handleCheckOut = () => {
    if (!reservation) return;
    checkOut.mutate(reservation.id, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('reception.checkOut')} — {t('reception.room')} {room.room_number}</DialogTitle>
        </DialogHeader>

        {reservation ? (
          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-muted">
              <p className="font-medium">{reservation.guest?.first_name} {reservation.guest?.last_name}</p>
              <p className="text-sm text-muted-foreground">
                {reservation.check_in_date} → {reservation.check_out_date}
              </p>
            </div>

            {(charges || []).length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">{t('reception.charges')}</h4>
                {charges!.map(c => (
                  <div key={c.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{c.description}</span>
                    <span>{c.amount.toFixed(2)} DKK</span>
                  </div>
                ))}
                <div className="flex justify-between font-medium pt-2 border-t border-border">
                  <span>{t('reception.total')}</span>
                  <span>{totalCharges.toFixed(2)} DKK</span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 text-sm">
              <span className="capitalize">{t('reception.paymentStatus')}: </span>
              <span className="font-medium capitalize">{reservation.payment_status}</span>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">{t('reception.noReservation')}</p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          <Button variant="destructive" onClick={handleCheckOut} disabled={!reservation || checkOut.isPending}>
            <LogOut className="h-4 w-4 mr-2" />
            {t('reception.checkOut')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
