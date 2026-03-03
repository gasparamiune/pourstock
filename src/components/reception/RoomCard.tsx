import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Room, Reservation } from '@/hooks/useReception';
import { BedDouble, User } from 'lucide-react';

const statusColors: Record<string, string> = {
  available: 'bg-[hsl(var(--room-available))] text-white',
  occupied: 'bg-[hsl(var(--room-occupied))] text-white',
  checkout: 'bg-[hsl(var(--room-checkout))] text-black',
  maintenance: 'bg-[hsl(var(--room-maintenance))] text-white',
  reserved: 'bg-[hsl(var(--room-reserved))] text-white',
};

const statusDot: Record<string, string> = {
  available: 'bg-[hsl(var(--room-available))]',
  occupied: 'bg-[hsl(var(--room-occupied))]',
  checkout: 'bg-[hsl(var(--room-checkout))]',
  maintenance: 'bg-[hsl(var(--room-maintenance))]',
  reserved: 'bg-[hsl(var(--room-reserved))]',
};

interface RoomCardProps {
  room: Room;
  reservation?: Reservation;
  onClick: () => void;
}

export function RoomCard({ room, reservation, onClick }: RoomCardProps) {
  const { t } = useLanguage();
  const guestName = reservation?.guest
    ? `${reservation.guest.first_name} ${reservation.guest.last_name}`
    : null;

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative rounded-xl p-3 text-left transition-all duration-200 hover:scale-105 active:scale-95 border border-white/10 shadow-lg min-h-[100px] flex flex-col justify-between",
        statusColors[room.status] || 'bg-muted'
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold">{room.room_number}</span>
        <BedDouble className="h-4 w-4 opacity-70" />
      </div>

      <div className="mt-1 space-y-1">
        {guestName && (
          <div className="flex items-center gap-1 text-xs opacity-90">
            <User className="h-3 w-3" />
            <span className="truncate">{guestName}</span>
          </div>
        )}
        <div className="text-xs opacity-70 capitalize">
          {t(`reception.${room.status}`)}
        </div>
      </div>
    </button>
  );
}
