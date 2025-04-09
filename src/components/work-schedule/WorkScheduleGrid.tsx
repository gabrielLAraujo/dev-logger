'use client';

import { WorkSchedule } from '@prisma/client';
import { DayOfWeek } from '@/types/work-schedule';
import WorkScheduleRow from './WorkScheduleRow';

interface WorkScheduleGridProps {
  schedulesByDay: Record<DayOfWeek, WorkSchedule | null>;
  onWorkDayChange: (day: DayOfWeek, isWorkDay: boolean) => void;
  onTimeChange: (day: DayOfWeek, field: 'startTime' | 'endTime', value: string) => void;
}

export default function WorkScheduleGrid({
  schedulesByDay,
  onWorkDayChange,
  onTimeChange,
}: WorkScheduleGridProps) {
  const days: DayOfWeek[] = [0, 1, 2, 3, 4, 5, 6];

  return (
    <div className="mt-4">
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                Dia
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Dia Útil
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Início
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Fim
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {days.map((day) => (
              <WorkScheduleRow
                key={day}
                day={day}
                schedule={schedulesByDay[day]}
                onWorkDayChange={onWorkDayChange}
                onTimeChange={onTimeChange}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 