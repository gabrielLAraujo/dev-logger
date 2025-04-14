import { useState } from 'react';
import { useRouter } from 'next/navigation';
import RepositoryList from './RepositoryList';

interface Repository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  description: string | null;
  html_url: string;
  default_branch: string;
}

interface WorkSchedule {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isWorkDay: boolean;
}

export default function CreateProjectForm() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedRepos, setSelectedRepos] = useState<Repository[]>([]);
  const [workSchedule, setWorkSchedule] = useState<WorkSchedule[]>([
    { dayOfWeek: 1, startTime: '09:00', endTime: '18:00', isWorkDay: true },
    { dayOfWeek: 2, startTime: '09:00', endTime: '18:00', isWorkDay: true },
    { dayOfWeek: 3, startTime: '09:00', endTime: '18:00', isWorkDay: true },
    { dayOfWeek: 4, startTime: '09:00', endTime: '18:00', isWorkDay: true },
    { dayOfWeek: 5, startTime: '09:00', endTime: '18:00', isWorkDay: true },
    { dayOfWeek: 6, startTime: '09:00', endTime: '18:00', isWorkDay: false },
    { dayOfWeek: 0, startTime: '09:00', endTime: '18:00', isWorkDay: false },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleWorkDayChange = (dayIndex: number, isWorkDay: boolean) => {
    const newSchedule = [...workSchedule];
    newSchedule[dayIndex] = { ...newSchedule[dayIndex], isWorkDay };
    setWorkSchedule(newSchedule);
  };

  const handleTimeChange = (dayIndex: number, field: 'startTime' | 'endTime', value: string) => {
    const newSchedule = [...workSchedule];
    newSchedule[dayIndex] = { ...newSchedule[dayIndex], [field]: value };
    setWorkSchedule(newSchedule);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (selectedRepos.length === 0) {
      setError('Selecione pelo menos um repositório');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          repositories: selectedRepos.map(repo => repo.full_name),
          workSchedule: workSchedule.filter(day => day.isWorkDay),
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao criar projeto');
      }

      const data = await response.json();
      router.push('/projects');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar projeto');
      console.error('Erro ao criar projeto:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const weekDays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          <strong className="font-medium">Erro: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Nome do Projeto
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Descrição
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Selecione os Repositórios
        </label>
        <RepositoryList
          onSelect={setSelectedRepos}
          selectedRepos={selectedRepos.map(repo => repo.full_name)}
          multiple={true}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Horário de Trabalho
        </label>
        <div className="space-y-3 bg-white p-4 rounded-lg border border-gray-200">
          {workSchedule.map((day, index) => (
            <div key={day.dayOfWeek} className="flex items-center space-x-4">
              <div className="w-24">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={day.isWorkDay}
                    onChange={(e) => handleWorkDayChange(index, e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{weekDays[index]}</span>
                </label>
              </div>
              {day.isWorkDay && (
                <div className="flex items-center space-x-2">
                  <input
                    type="time"
                    value={day.startTime}
                    onChange={(e) => handleTimeChange(index, 'startTime', e.target.value)}
                    className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  <span className="text-gray-500">até</span>
                  <input
                    type="time"
                    value={day.endTime}
                    onChange={(e) => handleTimeChange(index, 'endTime', e.target.value)}
                    className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading || selectedRepos.length === 0}
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isLoading ? 'Criando...' : 'Criar Projeto'}
        </button>
      </div>
    </form>
  );
} 