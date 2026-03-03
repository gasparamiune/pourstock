import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import type { HousekeepingTask } from '@/hooks/useHousekeeping';
import { ArrowRight, AlertTriangle } from 'lucide-react';

const statusColors: Record<string, string> = {
  dirty: 'bg-[hsl(var(--hk-dirty))] text-white',
  in_progress: 'bg-[hsl(var(--hk-in-progress))] text-black',
  clean: 'bg-[hsl(var(--hk-clean))] text-white',
  inspected: 'bg-[hsl(var(--hk-inspected))] text-white',
};

const nextStatusLabel: Record<string, string> = {
  dirty: 'housekeeping.startCleaning',
  in_progress: 'housekeeping.markClean',
  clean: 'housekeeping.markInspected',
};

interface HKRoomCardProps {
  task: HousekeepingTask;
  onProgress: () => void;
}

export function HKRoomCard({ task, onProgress }: HKRoomCardProps) {
  const { t } = useLanguage();
  const canProgress = task.status !== 'inspected';

  return (
    <div className={cn(
      "relative rounded-xl p-3 transition-all duration-200 border border-white/10 shadow-lg min-h-[110px] flex flex-col justify-between",
      statusColors[task.status] || 'bg-muted'
    )}>
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold">{task.room?.room_number || '—'}</span>
        {task.priority === 'urgent' && <AlertTriangle className="h-4 w-4" />}
        {task.priority === 'vip' && (
          <Badge className="bg-white/20 text-xs">VIP</Badge>
        )}
      </div>

      <div className="text-xs opacity-80 capitalize mt-1">
        {t(`housekeeping.taskType.${task.task_type}`)}
      </div>

      {canProgress && (
        <button
          onClick={onProgress}
          className="mt-2 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 active:scale-95 transition-all text-xs font-medium"
        >
          <span>{t(nextStatusLabel[task.status] || '')}</span>
          <ArrowRight className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
