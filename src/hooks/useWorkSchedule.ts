import { useState } from 'react';
import { WorkSchedule } from '@prisma/client';
import { useRouter } from 'next/navigation';

interface UseWorkScheduleProps {
  projectId: string;
  initialSchedules?: WorkSchedule[];
  onSuccess?: () => void;
}

interface Schedule {
  dayOfWeek: number;
  isWorkDay: boolean;
  startTime: string;
  endTime: string;
}

export function useWorkSchedule({ projectId, initialSchedules = [], onSuccess }: UseWorkScheduleProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schedulesByDay, setSchedulesByDay] = useState<Schedule[]>(
    initialSchedules.length > 0 
      ? initialSchedules.map((schedule) => ({
          ...schedule,
          isWorkDay: schedule.isWorkDay ?? (schedule.dayOfWeek > 0 && schedule.dayOfWeek < 6),
          startTime: schedule.startTime || '09:00',
          endTime: schedule.endTime || '18:00',
        }))
      : [
          { dayOfWeek: 0, startTime: '09:00', endTime: '18:00', isWorkDay: false }, // Domingo
          { dayOfWeek: 1, startTime: '09:00', endTime: '18:00', isWorkDay: true },  // Segunda
          { dayOfWeek: 2, startTime: '09:00', endTime: '18:00', isWorkDay: true },  // Terça
          { dayOfWeek: 3, startTime: '09:00', endTime: '18:00', isWorkDay: true },  // Quarta
          { dayOfWeek: 4, startTime: '09:00', endTime: '18:00', isWorkDay: true },  // Quinta
          { dayOfWeek: 5, startTime: '09:00', endTime: '18:00', isWorkDay: true },  // Sexta
          { dayOfWeek: 6, startTime: '09:00', endTime: '18:00', isWorkDay: false }, // Sábado
        ]
  );

  const handleWorkDayChange = (dayIndex: number, isWorkDay: boolean) => {
    setSchedulesByDay(prev => prev.map(schedule => 
      schedule.dayOfWeek === dayIndex ? { ...schedule, isWorkDay } : schedule
    ));
  };

  const handleTimeChange = (dayIndex: number, field: 'startTime' | 'endTime', value: string) => {
    setSchedulesByDay(prev => prev.map(schedule => 
      schedule.dayOfWeek === dayIndex ? { ...schedule, [field]: value } : schedule
    ));
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const schedules = Array.from({ length: 7 }, (_, index) => ({
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
              throw new Error(`Erro ao salvar horário para o dia ${schedule.dayOfWeek}`);
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

  return {
    loading,
    error,
    schedulesByDay,
    handleWorkDayChange,
    handleTimeChange,
    handleApplyToAll,
    handleSubmit,
  };
} 