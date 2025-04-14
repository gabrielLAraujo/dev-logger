'use client';

import { Button } from '@/components/ui/button';

interface WorkScheduleHeaderProps {
  onApplyToAll: () => void;
}

export default function WorkScheduleHeader({ onApplyToAll }: WorkScheduleHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-medium text-gray-900">Horários de Trabalho</h2>
      <Button
        type="button"
        variant="secondary"
        onClick={onApplyToAll}
      >
        Aplicar a todos os dias úteis
      </Button>
    </div>
  );
} 