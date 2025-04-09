'use client';

import { WorkSchedule } from '@prisma/client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface WorkScheduleFormProps {
  projectId: string;
  initialSchedules?: WorkSchedule[];
  onSuccess?: () => void;
}

export default function WorkScheduleForm({ projectId, initialSchedules = [], onSuccess }: WorkScheduleFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schedulesByDay, setSchedulesByDay] = useState(initialSchedules.map((schedule) => ({
    ...schedule,
    isWorkDay: schedule.isWorkDay ?? (schedule.dayOfWeek > 0 && schedule.dayOfWeek < 6),
    startTime: schedule.startTime || '09:00',
    endTime: schedule.endTime || '18:00',
  })));

  const weekDays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const schedules = weekDays.map((_, index) => ({
      dayOfWeek: index,
      startTime: formData.get(`startTime-${index}`) as string,
      endTime: formData.get(`endTime-${index}`) as string,
      isWorkDay: formData.has(`isWorkDay-${index}`),
    }));

    try {
      // Validar horários
      const invalidSchedules = schedules.filter(schedule => {
        if (!schedule.isWorkDay) return false;
        const startTime = (document.getElementById(`startTime-${schedule.dayOfWeek}`) as HTMLInputElement).value;
        const endTime = (document.getElementById(`endTime-${schedule.dayOfWeek}`) as HTMLInputElement).value;
        return startTime >= endTime;
      });

      if (invalidSchedules.length > 0) {
        setError('O horário de início deve ser menor que o horário de término em todos os dias úteis.');
        setLoading(false);
        return;
      }

      // Criar os novos horários
      const results = await Promise.all(
        schedules.map((schedule) =>
          fetch(`/api/projects/${projectId}/work-schedule`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(schedule),
          }).then(res => {
            if (!res.ok) {
              throw new Error(`Erro ao salvar horário para ${weekDays[schedule.dayOfWeek]}`);
            }
            return res.json();
          })
        )
      );

      onSuccess?.();
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao salvar horários de trabalho');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToAll = () => {
    const firstSchedule = schedulesByDay[1]; // Começa do índice 1 (Segunda-feira)
    if (!firstSchedule.isWorkDay) {
      setError('Selecione pelo menos um dia útil primeiro.');
      return;
    }

    const startTime = (document.getElementById(`startTime-${firstSchedule.dayOfWeek}`) as HTMLInputElement).value;
    const endTime = (document.getElementById(`endTime-${firstSchedule.dayOfWeek}`) as HTMLInputElement).value;

    if (!startTime || !endTime) {
      setError('Defina os horários do primeiro dia útil primeiro.');
      return;
    }

    if (startTime >= endTime) {
      setError('O horário de início deve ser menor que o horário de término.');
      return;
    }

    setSchedulesByDay(prev => prev.map(schedule => {
      if (schedule.dayOfWeek === 0 || schedule.dayOfWeek === 6) return schedule; // Mantém fim de semana
      return {
        ...schedule,
        isWorkDay: true,
        startTime,
        endTime
      };
    }));
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="flex justify-end mb-4">
        <button
          type="button"
          onClick={handleApplyToAll}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Aplicar horário para todos os dias úteis
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schedulesByDay.map((schedule) => (
            <div
              key={schedule.dayOfWeek}
              className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium text-gray-900">
                  {weekDays[schedule.dayOfWeek]}
                </h3>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name={`isWorkDay-${schedule.dayOfWeek}`}
                    id={`isWorkDay-${schedule.dayOfWeek}`}
                    defaultChecked={schedule.isWorkDay}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    Dia útil
                  </span>
                </label>
              </div>

              <div className="space-y-3">
                <div>
                  <label
                    htmlFor={`startTime-${schedule.dayOfWeek}`}
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Início
                  </label>
                  <input
                    type="time"
                    name={`startTime-${schedule.dayOfWeek}`}
                    id={`startTime-${schedule.dayOfWeek}`}
                    defaultValue={schedule.startTime}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor={`endTime-${schedule.dayOfWeek}`}
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Fim
                  </label>
                  <input
                    type="time"
                    name={`endTime-${schedule.dayOfWeek}`}
                    id={`endTime-${schedule.dayOfWeek}`}
                    defaultValue={schedule.endTime}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Salvando...
              </>
            ) : (
              'Salvar horários'
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 