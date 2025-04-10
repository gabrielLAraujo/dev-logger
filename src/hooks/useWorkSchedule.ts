import { useState } from 'react';
import { WorkSchedule } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

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
      toast.error('Selecione pelo menos um dia útil primeiro.');
      return;
    }

    const startTime = (document.getElementById(`startTime-${firstSchedule.dayOfWeek}`) as HTMLInputElement).value;
    const endTime = (document.getElementById(`endTime-${firstSchedule.dayOfWeek}`) as HTMLInputElement).value;

    if (!startTime || !endTime) {
      setError('Defina os horários do primeiro dia útil primeiro.');
      toast.error('Defina os horários do primeiro dia útil primeiro.');
      return;
    }

    if (startTime >= endTime) {
      setError('O horário de início deve ser menor que o horário de término.');
      toast.error('O horário de início deve ser menor que o horário de término.');
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

    try {
      // Validar horários usando o estado atual
      const invalidSchedules = schedulesByDay.filter(schedule => {
        if (!schedule.isWorkDay) return false;
        return schedule.startTime >= schedule.endTime;
      });

      if (invalidSchedules.length > 0) {
        const errorMessage = 'O horário de início deve ser menor que o horário de término em todos os dias úteis.';
        setError(errorMessage);
        toast.error(errorMessage);
        setLoading(false);
        return;
      }

      toast.loading('Salvando horários de trabalho...');
      
      // Garantir que todos os campos necessários estejam presentes
      const schedulesToSave = schedulesByDay.map(schedule => ({
        dayOfWeek: schedule.dayOfWeek,
        isWorkDay: schedule.isWorkDay,
        startTime: schedule.startTime || '09:00',
        endTime: schedule.endTime || '18:00',
      }));
      
      // Enviar todos os horários de uma vez
      const response = await fetch(`/api/projects/${projectId}/work-schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ schedules: schedulesToSave }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao salvar horários de trabalho');
      }

      // Atualiza o estado local com os horários retornados da API
      const savedSchedules = await response.json();
      setSchedulesByDay(savedSchedules.map((schedule: WorkSchedule) => ({
        dayOfWeek: schedule.dayOfWeek,
        isWorkDay: schedule.isWorkDay,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
      })));

      onSuccess?.();
      router.refresh();
      toast.success('Horários de trabalho salvos com sucesso!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao salvar horários de trabalho';
      setError(errorMessage);
      toast.error(errorMessage);
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