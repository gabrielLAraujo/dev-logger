import { useState, useEffect } from 'react';
import { Loading } from '@/components/ui/loading';
import { useToast } from '@/contexts/ToastContext';
import { Skeleton } from '@/components/ui/skeleton';

interface WorkSchedule {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isWorkDay: boolean;
}

interface WorkScheduleFormProps {
  projectId: string;
  onSave?: () => void;
}

interface DayOfWeek {
  value: number;
  label: string;
  defaultWorkDay: boolean;
}

const DAYS_OF_WEEK: DayOfWeek[] = [
  { value: 0, label: 'Domingo', defaultWorkDay: false },
  { value: 1, label: 'Segunda-feira', defaultWorkDay: true },
  { value: 2, label: 'Terça-feira', defaultWorkDay: true },
  { value: 3, label: 'Quarta-feira', defaultWorkDay: true },
  { value: 4, label: 'Quinta-feira', defaultWorkDay: true },
  { value: 5, label: 'Sexta-feira', defaultWorkDay: true },
  { value: 6, label: 'Sábado', defaultWorkDay: false }
];

export default function WorkScheduleForm({ projectId, onSave }: WorkScheduleFormProps) {
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchSchedules();
  }, [projectId]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${projectId}/work-schedule`);
      if (!response.ok) throw new Error('Erro ao carregar horários');
      const data = await response.json();
      
      // Se não houver horários, cria um padrão
      if (data.length === 0) {
        const defaultSchedules = DAYS_OF_WEEK.map(day => ({
          dayOfWeek: day.value,
          startTime: '09:00',
          endTime: '18:00',
          isWorkDay: day.defaultWorkDay
        }));
        
        // Salva os horários padrão
        const savePromises = defaultSchedules.map(schedule => 
          fetch(`/api/work-schedule`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              projectId,
              dayOfWeek: schedule.dayOfWeek,
              startTime: schedule.startTime,
              endTime: schedule.endTime,
              isWorkDay: schedule.isWorkDay
            })
          })
        );

        await Promise.all(savePromises);
        setSchedules(defaultSchedules);
      } else {
        // Garante que todos os dias da semana estejam presentes
        const completeSchedules = DAYS_OF_WEEK.map(day => {
          const existingSchedule = data.find((s: WorkSchedule) => s.dayOfWeek === day.value);
          return existingSchedule || {
            dayOfWeek: day.value,
            startTime: '09:00',
            endTime: '18:00',
            isWorkDay: day.defaultWorkDay
          };
        });
        setSchedules(completeSchedules);
      }
    } catch (error) {
      setError('Erro ao carregar horários de trabalho');
      console.error('Erro:', error);
      showToast('Erro ao carregar horários de trabalho', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleChange = (index: number, field: keyof WorkSchedule, value: any) => {
    const newSchedules = [...schedules];
    newSchedules[index] = {
      ...newSchedules[index],
      [field]: value
    };
    setSchedules(newSchedules);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);

      // Atualiza todos os horários de uma vez usando a API PUT
      const response = await fetch(`/api/projects/${projectId}/work-schedule`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          schedules: schedules.map(schedule => ({
            dayOfWeek: schedule.dayOfWeek,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            isWorkDay: schedule.isWorkDay
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar horários');
      }

      showToast('Horários de trabalho salvos com sucesso!', 'success');
      if (onSave) onSave();
    } catch (error) {
      setError('Erro ao salvar horários de trabalho');
      console.error('Erro:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {DAYS_OF_WEEK.map((day) => (
          <div key={day.value} className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow">
            <div className="w-32">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-5 w-24" />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-5 w-6" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {DAYS_OF_WEEK.map((day) => (
          <div key={day.value} className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow">
            <div className="w-32">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={schedules[day.value]?.isWorkDay}
                  onChange={(e) => handleScheduleChange(day.value, 'isWorkDay', e.target.checked)}
                  className="form-checkbox h-5 w-5 text-blue-600"
                />
                <span className="text-gray-700">{day.label}</span>
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="time"
                value={schedules[day.value]?.startTime}
                onChange={(e) => handleScheduleChange(day.value, 'startTime', e.target.value)}
                disabled={!schedules[day.value]?.isWorkDay}
                className="form-input rounded-md border-gray-300 disabled:opacity-50"
              />
              <span className="text-gray-500">até</span>
              <input
                type="time"
                value={schedules[day.value]?.endTime}
                onChange={(e) => handleScheduleChange(day.value, 'endTime', e.target.value)}
                disabled={!schedules[day.value]?.isWorkDay}
                className="form-input rounded-md border-gray-300 disabled:opacity-50"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? (
            <Loading size="sm" />
          ) : (
            'Salvar Horários'
          )}
        </button>
      </div>
    </form>
  );
} 