import React from 'react';

interface DayCardProps {
  dayName: string;
  dayIndex: number;
  isWorkDay: boolean;
  startTime: string;
  endTime: string;
  onWorkDayChange: (dayIndex: number, isWorkDay: boolean) => void;
  onTimeChange: (dayIndex: number, field: 'startTime' | 'endTime', value: string) => void;
}

export default function DayCard({
  dayName,
  dayIndex,
  isWorkDay,
  startTime,
  endTime,
  onWorkDayChange,
  onTimeChange,
}: DayCardProps) {
  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium text-gray-900">
          {dayName}
        </h3>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            name={`isWorkDay-${dayIndex}`}
            id={`isWorkDay-${dayIndex}`}
            checked={isWorkDay}
            onChange={(e) => onWorkDayChange(dayIndex, e.target.checked)}
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
            htmlFor={`startTime-${dayIndex}`}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Início
          </label>
          <input
            type="time"
            name={`startTime-${dayIndex}`}
            id={`startTime-${dayIndex}`}
            value={startTime}
            onChange={(e) => onTimeChange(dayIndex, 'startTime', e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label
            htmlFor={`endTime-${dayIndex}`}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Fim
          </label>
          <input
            type="time"
            name={`endTime-${dayIndex}`}
            id={`endTime-${dayIndex}`}
            value={endTime}
            onChange={(e) => onTimeChange(dayIndex, 'endTime', e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
      </div>
    </div>
  );
} 