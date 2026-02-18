import { cn } from '@/lib/utils';
import { AlertTriangle, Users, UtensilsCrossed, DoorOpen } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export interface Reservation {
  time: string;
  guestCount: number;
  dishCount: number;
  guestName: string;
  roomNumber: string;
  notes: string;
}

export interface TableDef {
  id: string;
  capacity: number;
  row: number;
  col: number;
}

interface TableCardProps {
  table: TableDef;
  reservation?: Reservation;
}

export function TableCard({ table, reservation }: TableCardProps) {
  const { t } = useLanguage();
  const isFree = !reservation;
  const hasNotes = reservation?.notes && reservation.notes.trim().length > 0;
  const is3Dish = reservation?.dishCount === 3;

  return (
    <div
      className={cn(
        "relative rounded-xl p-3 transition-all duration-300 flex flex-col gap-1.5 min-h-[110px]",
        isFree && "border-2 border-dashed border-muted-foreground/20 bg-muted/30",
        !isFree && is3Dish && "border-2 border-amber-500/60 bg-gradient-to-br from-amber-500/10 to-amber-600/5 shadow-lg shadow-amber-500/10",
        !isFree && !is3Dish && "border-2 border-sky-500/60 bg-gradient-to-br from-sky-500/10 to-sky-600/5 shadow-lg shadow-sky-500/10",
      )}
    >
      {/* Table number badge */}
      <div className={cn(
        "absolute -top-2.5 left-3 px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide",
        isFree && "bg-muted text-muted-foreground",
        !isFree && is3Dish && "bg-amber-500 text-white",
        !isFree && !is3Dish && "bg-sky-500 text-white",
      )}>
        {table.id}
      </div>

      {/* Capacity indicator */}
      <div className="text-[10px] text-muted-foreground self-end">
        {table.capacity}p
      </div>

      {isFree ? (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-sm text-muted-foreground/50 font-medium">{t('tablePlan.free')}</span>
        </div>
      ) : (
        <div className="flex flex-col gap-1 flex-1">
          {/* Guest count & dishes */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-sm font-semibold text-foreground">
              <Users className="h-3.5 w-3.5" />
              <span>{reservation.guestCount}</span>
            </div>
            <div className={cn(
              "flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-md",
              is3Dish ? "bg-amber-500/20 text-amber-300" : "bg-sky-500/20 text-sky-300"
            )}>
              <UtensilsCrossed className="h-3 w-3" />
              <span>{reservation.dishCount}-ret</span>
            </div>
          </div>

          {/* Guest name or room */}
          <div className="text-xs text-foreground/80 truncate">
            {reservation.guestName && (
              <span className="font-medium">{reservation.guestName}</span>
            )}
            {reservation.roomNumber && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <DoorOpen className="h-3 w-3" />
                {t('tablePlan.room')} {reservation.roomNumber}
              </span>
            )}
          </div>

          {/* Notes badge */}
          {hasNotes && (
            <div className="flex items-start gap-1 mt-auto">
              <div className="flex items-center gap-1 text-[10px] bg-destructive/20 text-destructive px-1.5 py-0.5 rounded-md leading-tight animate-pulse">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                <span className="line-clamp-2">{reservation.notes}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
