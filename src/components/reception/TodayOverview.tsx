import { useReservations } from '@/hooks/useReception';
import { useReservationMutations } from '@/hooks/useReception';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, LogOut, Loader2 } from 'lucide-react';

export function TodayOverview() {
  const { t } = useLanguage();
  const today = new Date().toISOString().split('T')[0];
  const { data: reservations, isLoading } = useReservations({ from: today, to: today });
  const { checkIn, checkOut } = useReservationMutations();

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const arrivals = (reservations || []).filter(r => r.check_in_date === today && r.status === 'confirmed');
  const departures = (reservations || []).filter(r => r.check_out_date === today && r.status === 'checked_in');

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Arrivals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[hsl(var(--room-available))]">
            {t('reception.arrivals')} ({arrivals.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {arrivals.length === 0 && (
            <p className="text-muted-foreground text-sm">{t('reception.noArrivals')}</p>
          )}
          {arrivals.map(res => (
            <div key={res.id} className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <div>
                <p className="font-medium">{res.guest?.first_name} {res.guest?.last_name}</p>
                <p className="text-xs text-muted-foreground">{t('reception.room')} {res.room?.room_number} • {res.adults + res.children} {t('reception.guests')}</p>
              </div>
              <Button size="sm" onClick={() => checkIn.mutate(res.id)} disabled={checkIn.isPending}>
                <CheckCircle className="h-4 w-4 mr-1" />
                {t('reception.checkIn')}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Departures */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[hsl(var(--room-checkout))]">
            {t('reception.departures')} ({departures.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {departures.length === 0 && (
            <p className="text-muted-foreground text-sm">{t('reception.noDepartures')}</p>
          )}
          {departures.map(res => (
            <div key={res.id} className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <div>
                <p className="font-medium">{res.guest?.first_name} {res.guest?.last_name}</p>
                <p className="text-xs text-muted-foreground">{t('reception.room')} {res.room?.room_number}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => checkOut.mutate(res.id)} disabled={checkOut.isPending}>
                <LogOut className="h-4 w-4 mr-1" />
                {t('reception.checkOut')}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
