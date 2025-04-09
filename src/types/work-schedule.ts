export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const DAY_NAMES: Record<DayOfWeek, string> = {
  0: 'Domingo',
  1: 'Segunda',
  2: 'Terça',
  3: 'Quarta',
  4: 'Quinta',
  5: 'Sexta',
  6: 'Sábado',
};

export interface WorkSchedule {
  id: string;
  projectId: string;
  dayOfWeek: DayOfWeek;
  isWorkDay: boolean;
  startTime: string;
  endTime: string;
} 