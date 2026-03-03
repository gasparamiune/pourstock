import { useMyTasks, useHousekeepingMutations } from '@/hooks/useHousekeeping';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusOrder = ['dirty', 'in_progress', 'clean', 'inspected'];

const statusBg: Record<string, string> = {
  dirty: 'border-[hsl(var(--hk-dirty))]/30',
  in_progress: 'border-[hsl(var(--hk-in-progress))]/30',
  clean: 'border-[hsl(var(--hk-clean))]/30',
  inspected: 'border-[hsl(var(--hk-inspected))]/30',
};

export function MyTasksList() {
  const { t } = useLanguage();
  const { data: tasks, isLoading } = useMyTasks();
  const { updateTaskStatus } = useHousekeepingMutations();

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const handleProgress = (taskId: string, currentStatus: string) => {
    const idx = statusOrder.indexOf(currentStatus);
    if (idx < statusOrder.length - 1) {
      updateTaskStatus.mutate({ taskId, status: statusOrder[idx + 1] });
    }
  };

  if (!tasks || tasks.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {t('housekeeping.noAssignedTasks')}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map(task => (
        <Card key={task.id} className={cn("border-l-4", statusBg[task.status])}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="font-bold text-lg">{t('reception.room')} {task.room?.room_number}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs capitalize">{t(`housekeeping.${task.status}`)}</Badge>
                <span className="text-xs text-muted-foreground capitalize">{t(`housekeeping.taskType.${task.task_type}`)}</span>
                {task.priority !== 'normal' && (
                  <Badge className="text-xs capitalize bg-destructive/10 text-destructive">{task.priority}</Badge>
                )}
              </div>
            </div>

            {task.status !== 'inspected' && (
              <Button size="sm" onClick={() => handleProgress(task.id, task.status)}>
                {t(`housekeeping.${task.status === 'dirty' ? 'startCleaning' : task.status === 'in_progress' ? 'markClean' : 'markInspected'}`)}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
