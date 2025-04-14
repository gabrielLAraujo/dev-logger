export interface DailyActivity {
  id: string;
  date: string;
  description: string;
  status: 'pendente' | 'em_andamento' | 'concluido';
  projectId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
} 