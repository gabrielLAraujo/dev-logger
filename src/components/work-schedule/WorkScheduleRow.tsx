'use client';

import { WorkSchedule } from '@prisma/client';
import { DayOfWeek } from '@/types/work-schedule';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WorkScheduleRowProps {
  day: DayOfWeek;
  schedule: WorkSchedule | null;
  onWorkDayChange: (day: DayOfWeek, isWorkDay: boolean) => void;
  onTimeChange: (day: DayOfWeek, field: 'startTime' | 'endTime', value: string) => void;
}

export default function WorkScheduleRow({
  day,
  schedule,
  onWorkDayChange,
  onTimeChange,
}: WorkScheduleRowProps) {
  const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const dayName = dayNames[day];

  return (
    <tr>
      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
        {dayName}
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
        <input
          type="checkbox"
          checked={schedule?.isWorkDay || false}
          onChange={(e) => onWorkDayChange(day, e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
        <input
          type="time"
          value={schedule?.startTime || '09:00'}
          onChange={(e) => onTimeChange(day, 'startTime', e.target.value)}
          disabled={!schedule?.isWorkDay}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
        />
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
        <input
          type="time"
          value={schedule?.endTime || '18:00'}
          onChange={(e) => onTimeChange(day, 'endTime', e.target.value)}
          disabled={!schedule?.isWorkDay}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
        />
      </td>
    </tr>
  );
} 