import { DayOfWeek, WorkSchedule, DAY_NAMES } from '@/types/work-schedule';

interface WorkScheduleRowProps {
  day: DayOfWeek;
  schedule: WorkSchedule | null;
  onWorkDayChange: (day: DayOfWeek, isWorkDay: boolean) => void;
  onTimeChange: (day: DayOfWeek, field: 'startTime' | 'endTime', value: string) => void;
}

export default function WorkScheduleRow({ day, schedule, onWorkDayChange, onTimeChange }: WorkScheduleRowProps) {
  if (!schedule) return null;

  return (
    <tr>
      <td className="px-4 py-2">{DAY_NAMES[day]}</td>
      <td className="px-4 py-2">
        <input
          type="checkbox"
          checked={schedule.isWorkDay}
          onChange={(e) => onWorkDayChange(day, e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
      </td>
      <td className="px-4 py-2">
        <input
          type="time"
          value={schedule.startTime}
          onChange={(e) => onTimeChange(day, 'startTime', e.target.value)}
          disabled={!schedule.isWorkDay}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
        />
      </td>
      <td className="px-4 py-2">
        <input
          type="time"
          value={schedule.endTime}
          onChange={(e) => onTimeChange(day, 'endTime', e.target.value)}
          disabled={!schedule.isWorkDay}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
        />
      </td>
    </tr>
  );
} 