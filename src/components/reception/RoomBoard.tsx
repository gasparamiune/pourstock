import { useState } from 'react';
import { useRooms, useReservations, useReservationMutations, type Room } from '@/hooks/useReception';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { RoomCard } from './RoomCard';
import { CheckInDialog } from './CheckInDialog';
import { CheckOutDialog } from './CheckOutDialog';
import { Loader2, Plus } from 'lucide-react';

export function RoomBoard() {
  const { t } = useLanguage();
  const { data: rooms, isLoading } = useRooms();
  const { data: reservations } = useReservations();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [floorFilter, setFloorFilter] = useState<string>('all');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [dialogType, setDialogType] = useState<'checkin' | 'checkout' | null>(null);

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const filteredRooms = (rooms || []).filter(room => {
    if (statusFilter !== 'all' && room.status !== statusFilter) return false;
    if (floorFilter !== 'all' && room.floor.toString() !== floorFilter) return false;
    return true;
  });

  const floors = [...new Set((rooms || []).map(r => r.floor))].sort();

  // Map room to its active reservation
  const roomReservationMap = new Map<string, any>();
  (reservations || []).forEach(res => {
    if (res.status === 'confirmed' || res.status === 'checked_in') {
      roomReservationMap.set(res.room_id, res);
    }
  });

  const handleRoomAction = (room: Room) => {
    setSelectedRoom(room);
    if (room.status === 'occupied') {
      setDialogType('checkout');
    } else if (room.status === 'available' || room.status === 'reserved') {
      setDialogType('checkin');
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder={t('reception.allStatuses')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')}</SelectItem>
            <SelectItem value="available">{t('reception.available')}</SelectItem>
            <SelectItem value="occupied">{t('reception.occupied')}</SelectItem>
            <SelectItem value="checkout">{t('reception.checkout')}</SelectItem>
            <SelectItem value="maintenance">{t('reception.maintenance')}</SelectItem>
            <SelectItem value="reserved">{t('reception.reserved')}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={floorFilter} onValueChange={setFloorFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder={t('reception.allFloors')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')}</SelectItem>
            {floors.map(f => (
              <SelectItem key={f} value={f.toString()}>{t('reception.floor')} {f}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Room Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {filteredRooms.map(room => (
          <RoomCard
            key={room.id}
            room={room}
            reservation={roomReservationMap.get(room.id)}
            onClick={() => handleRoomAction(room)}
          />
        ))}
      </div>

      {filteredRooms.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          {t('reception.noRooms')}
        </div>
      )}

      {/* Dialogs */}
      {selectedRoom && dialogType === 'checkin' && (
        <CheckInDialog
          open={true}
          onOpenChange={() => { setSelectedRoom(null); setDialogType(null); }}
          room={selectedRoom}
          reservation={roomReservationMap.get(selectedRoom.id)}
        />
      )}

      {selectedRoom && dialogType === 'checkout' && (
        <CheckOutDialog
          open={true}
          onOpenChange={() => { setSelectedRoom(null); setDialogType(null); }}
          room={selectedRoom}
          reservation={roomReservationMap.get(selectedRoom.id)}
        />
      )}
    </div>
  );
}
