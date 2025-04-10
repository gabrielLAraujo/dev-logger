import { useState } from 'react';
import { DayOfWeek, DAY_NAMES } from '@/types/work-schedule';
import WorkScheduleRow from './WorkScheduleRow';
import { WorkSchedule as PrismaWorkSchedule } from '@prisma/client';

interface WorkScheduleFormProps {
  projectId: string;
  initialSchedules?: PrismaWorkSchedule[];
  onSave?: () => void;
}

export function WorkScheduleForm({ projectId, initialSchedules = [], onSave }: WorkScheduleFormProps) {
  const [schedules, setSchedules] = useState<PrismaWorkSchedule[]>(() => {
    // Inicializa a grade com todos os dias da semana
    const defaultSchedules: PrismaWorkSchedule[] = Array.from({ length: 7 }, (_, index) => ({
      id: '',
      projectId,
      dayOfWeek: index as DayOfWeek,
      isWorkDay: false,
      startTime: '09:00',
      endTime: '18:00',
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    // Atualiza com os horários existentes
    initialSchedules.forEach(schedule => {
      defaultSchedules[schedule.dayOfWeek] = schedule;
    });

    return defaultSchedules;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScheduleChange = (updatedSchedule: PrismaWorkSchedule) => {
    setSchedules(prev => 
      prev.map(schedule => 
        schedule.dayOfWeek === updatedSchedule.dayOfWeek ? updatedSchedule : schedule
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/work-schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ schedules }),
      });

      if (!response.ok) {
        throw new Error('Falha ao salvar a grade de horários');
      }

      onSave?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar a grade de horários');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dia
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dia de Trabalho
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Início
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fim
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {schedules.map((schedule) => (
              <WorkScheduleRow
                key={schedule.dayOfWeek}
                day={schedule.dayOfWeek as DayOfWeek}
                schedule={schedule}
                onWorkDayChange={(day, isWorkDay) => {
                  const updatedSchedule = { ...schedule, isWorkDay };
                  handleScheduleChange(updatedSchedule);
                }}
                onTimeChange={(day, field, value) => {
                  const updatedSchedule = { ...schedule, [field]: value };
                  handleScheduleChange(updatedSchedule);
                }}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isLoading ? 'Salvando...' : 'Salvar Grade de Horários'}
        </button>
      </div>
    </form>
  );
} 