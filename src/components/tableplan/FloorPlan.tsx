import { TableCard, type TableDef, type Reservation } from './TableCard';
import { useLanguage } from '@/contexts/LanguageContext';

// Restaurant layout matching the actual floor plan
const TABLE_LAYOUT: TableDef[] = [
  // Row 1
  { id: 'B7',  capacity: 4, row: 1, col: 1 },
  { id: 'B17', capacity: 2, row: 1, col: 2 },
  { id: 'B27', capacity: 2, row: 1, col: 3 },
  // Row 2
  { id: 'B6',  capacity: 4, row: 2, col: 1 },
  { id: 'B16', capacity: 2, row: 2, col: 2 },
  { id: 'B26', capacity: 2, row: 2, col: 3 },
  { id: 'B31', capacity: 2, row: 2, col: 4 },
  // Row 3
  { id: 'B5',  capacity: 4, row: 3, col: 1 },
  { id: 'B15', capacity: 2, row: 3, col: 2 },
  { id: 'B25', capacity: 2, row: 3, col: 3 },
  // Row 4
  { id: 'B4',  capacity: 4, row: 4, col: 1 },
  { id: 'B14', capacity: 2, row: 4, col: 2 },
  { id: 'B32', capacity: 6, row: 4, col: 3 },
  // Row 5
  { id: 'B3',  capacity: 6, row: 5, col: 1 },
  { id: 'B13', capacity: 6, row: 5, col: 2 },
  { id: 'B23', capacity: 6, row: 5, col: 3 },
  // Row 6
  { id: 'B2',  capacity: 4, row: 6, col: 1 },
  { id: 'B12', capacity: 2, row: 6, col: 2 },
  { id: 'B22', capacity: 2, row: 6, col: 3 },
  { id: 'B33', capacity: 2, row: 6, col: 4 },
  // Row 7
  { id: 'B1',  capacity: 4, row: 7, col: 1 },
  { id: 'B11', capacity: 2, row: 7, col: 2 },
  { id: 'B21', capacity: 2, row: 7, col: 3 },
  // Row 8
  { id: 'B35', capacity: 4, row: 8, col: 1 },
  { id: 'B36', capacity: 2, row: 8, col: 2 },
  { id: 'B37', capacity: 2, row: 8, col: 3 },
];

export function assignTablesToReservations(reservations: Reservation[]): Map<string, Reservation> {
  const assignments = new Map<string, Reservation>();
  const usedTables = new Set<string>();

  // Sort: largest parties first
  const sorted = [...reservations].sort((a, b) => b.guestCount - a.guestCount);

  for (const res of sorted) {
    // Find smallest available table that fits
    const candidates = TABLE_LAYOUT
      .filter(t => !usedTables.has(t.id) && t.capacity >= res.guestCount)
      .sort((a, b) => a.capacity - b.capacity);

    if (candidates.length > 0) {
      assignments.set(candidates[0].id, res);
      usedTables.add(candidates[0].id);
    }
  }

  return assignments;
}

interface FloorPlanProps {
  reservations: Reservation[];
}

export function FloorPlan({ reservations }: FloorPlanProps) {
  const { t } = useLanguage();
  const assignments = assignTablesToReservations(reservations);

  const totalGuests = reservations.reduce((s, r) => s + r.guestCount, 0);
  const occupied = assignments.size;
  const total = TABLE_LAYOUT.length;

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-muted-foreground">3-ret</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-sky-500" />
          <span className="text-muted-foreground">2-ret</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-muted" />
          <span className="text-muted-foreground">{t('tablePlan.free')}</span>
        </div>
        <div className="ml-auto text-muted-foreground">
          {occupied}/{total} {t('tablePlan.tablesOccupied')} · {totalGuests} {t('tablePlan.guests')}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 8 }, (_, rowIdx) => {
          const row = rowIdx + 1;
          return Array.from({ length: 4 }, (_, colIdx) => {
            const col = colIdx + 1;
            const table = TABLE_LAYOUT.find(t => t.row === row && t.col === col);
            if (!table) {
              return <div key={`${row}-${col}`} className="min-h-[110px]" />;
            }
            return (
              <TableCard
                key={table.id}
                table={table}
                reservation={assignments.get(table.id)}
              />
            );
          });
        }).flat()}
      </div>
    </div>
  );
}
