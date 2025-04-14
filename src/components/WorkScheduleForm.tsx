'use client';

import { WorkSchedule } from '@prisma/client';
import { Button } from '@/components/ui/button';
import Alert from '@/components/ui/Alert';
import WorkScheduleHeader from '@/components/work-schedule/WorkScheduleHeader';
import WorkScheduleGrid from '@/components/work-schedule/WorkScheduleGrid';
import { useWorkSchedule } from '@/hooks/useWorkSchedule';
import { DayOfWeek } from '@/types/work-schedule';

interface WorkScheduleFormProps {
  projectId: string;
  initialSchedules?: WorkSchedule[];
  onSuccess?: () => void;
}

export default function WorkScheduleForm({ projectId, initialSchedules = [], onSuccess }: WorkScheduleFormProps) {
  const weekDays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  
  const {
    loading,
    error,
    schedulesByDay,
    handleWorkDayChange,
    handleTimeChange,
    handleApplyToAll,
    handleSubmit,
  } = useWorkSchedule({
    projectId,
    initialSchedules,
    onSuccess,
  });

  return (
    <div className="space-y-4">
      {error && <Alert type="error" message={error} />}

      <WorkScheduleHeader onApplyToAll={handleApplyToAll} />

      <form onSubmit={handleSubmit}>
        <WorkScheduleGrid
          schedulesByDay={schedulesByDay.reduce((acc, schedule) => ({
            ...acc,
            [schedule.dayOfWeek]: schedule
          }), {} as Record<DayOfWeek, WorkSchedule | null>)}
          onWorkDayChange={handleWorkDayChange}
          onTimeChange={handleTimeChange}
        />

        <div className="mt-6 flex justify-end">
          <Button
            type="submit"
            variant="default"
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Salvar horários'}
          </Button>
        </div>
      </form>
    </div>
  );
} 