'use client';

import { useState, useEffect } from 'react';
import { format, parseISO, startOfMonth, endOfMonth, subMonths, addMonths, isWithinInterval, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import ActivityTable from './ActivityTable';
import ActivityKanban from './ActivityKanban';
import type { WorkSchedule } from '@prisma/client';
import type { DailyActivity as PrismaDailyActivity } from '@prisma/client';

type Status = 'pendente' | 'em_andamento' | 'concluido';

interface DailyActivity {
  id: string;
  description: string;
  date: string;
  status: Status;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

interface DailyActivityState {
  id: string;
  description: string;
  date: string;
  status: Status;
}

interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
  html_url: string;
}

interface Commit {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

interface ProjectReportProps {
  projectName: string;
  workSchedule: WorkSchedule[];
  repositories: string[];
  projectId: string;
  startDate: string;
  endDate: string;
}

interface DailyActivityResponse {
  id: string;
  description: string;
  date: string;
  status: Status;
}

export default function ProjectReport({ projectName, workSchedule, repositories, projectId }: Omit<ProjectReportProps, 'startDate' | 'endDate'>) {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [commits, setCommits] = useState<{ [key: string]: Commit[] }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dailyActivities, setDailyActivities] = useState<DailyActivityState[]>([]);
  const [hasGitHubToken, setHasGitHubToken] = useState<boolean | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [shouldSpreadCommits, setShouldSpreadCommits] = useState(false);

  const startDate = startOfMonth(selectedMonth).toISOString();
  const endDate = endOfMonth(selectedMonth).toISOString();

  const handlePreviousMonth = () => {
    setSelectedMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setSelectedMonth(prev => addMonths(prev, 1));
  };

  const isWorkDay = (date: Date): boolean => {
    return workSchedule.some(schedule => {
      const startTime = new Date(`1970-01-01T${schedule.startTime}`);
      const endTime = new Date(`1970-01-01T${schedule.endTime}`);
      
      return schedule.isWorkDay && 
             schedule.dayOfWeek === date.getDay() &&
             startTime <= endTime;
    });
  };

  const filterWorkDays = (date: Date): boolean => {
    return isWorkDay(date);
  };

  const checkGitHubToken = async () => {
    try {
      const response = await fetch('/api/user/settings', {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        setHasGitHubToken(false);
        return false;
      }
      
      const data = await response.json();
      const hasToken = !!data.githubToken;
      setHasGitHubToken(hasToken);
      return hasToken;
    } catch (error) {
      console.error('Erro ao verificar token do GitHub:', error);
      setHasGitHubToken(false);
      return false;
    }
  };

  const syncCommits = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/sync-commits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Falha ao sincronizar commits');
      }

      await fetchCommits();
      toast.success('Commits sincronizados com sucesso!');
    } catch (error) {
      console.error('Erro ao sincronizar commits:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao sincronizar commits';
      toast.error(errorMessage);
    } finally {
      setIsSyncing(false);
    }
  };

  const fetchCommits = async () => {
    try {
      const cacheKey = `commits-${projectId}-${startDate}-${endDate}`;
      const cachedData = sessionStorage.getItem(cacheKey);
      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        const now = Date.now();
        if (now - timestamp < 5 * 60 * 1000) {
          setCommits(data);
          return;
        }
      }

      const response = await fetch(`/api/projects/${projectId}/commits?startDate=${startDate}&endDate=${endDate}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Falha ao buscar commits');
      }
      
      const data = await response.json();
      const commitsByDate: Record<string, Commit[]> = {};

      data.forEach((commit: GitHubCommit) => {
        try {
          const commitDate = new Date(commit.commit.author.date);
          if (isNaN(commitDate.getTime())) {
            console.warn('Data inválida encontrada:', commit.commit.author.date);
            return;
          }
          
          const dateKey = format(commitDate, 'yyyy-MM-dd');
          
          if (!commitsByDate[dateKey]) {
            commitsByDate[dateKey] = [];
          }
          
          commitsByDate[dateKey].push({
            sha: commit.sha,
            message: commit.commit.message,
            author: commit.commit.author.name,
            date: commit.commit.author.date,
            url: commit.html_url
          });
        } catch (error) {
          console.warn('Erro ao processar commit:', error);
        }
      });

      sessionStorage.setItem(cacheKey, JSON.stringify({
        data: commitsByDate,
        timestamp: Date.now()
      }));

      setCommits(commitsByDate);
    } catch (error) {
      console.error('Erro ao buscar commits:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar commits';
      setError(errorMessage);
      toast.error('Erro ao buscar commits. Por favor, verifique se o token do GitHub está configurado e se os repositórios estão corretos.');
    }
  };

  const formatDate = (date: Date): string => {
    return format(date, 'yyyy-MM-dd');
  };

  const fetchDailyActivities = async () => {
    try {
      const cacheKey = `activities-${projectId}`;
      const cachedData = sessionStorage.getItem(cacheKey);
      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        const now = Date.now();
        if (now - timestamp < 5 * 60 * 1000) {
          setDailyActivities(data);
          return;
        }
      }

      const response = await fetch(`/api/projects/${projectId}/daily-activities`);
      if (!response.ok) {
        throw new Error('Erro ao buscar atividades');
      }
      const data: PrismaDailyActivity[] = await response.json();
      const formattedActivities: DailyActivityState[] = data.map((activity) => ({
        id: activity.id,
        description: activity.description,
        date: format(new Date(activity.date), 'yyyy-MM-dd'),
        status: activity.status as Status
      }));

      sessionStorage.setItem(cacheKey, JSON.stringify({
        data: formattedActivities,
        timestamp: Date.now()
      }));

      setDailyActivities(formattedActivities);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast.error('Erro ao carregar atividades');
    }
  };

  useEffect(() => {
    if (projectId) {
      const loadData = async () => {
        setIsLoading(true);
        try {
          const hasToken = await checkGitHubToken();
          
          const promises = [fetchDailyActivities()];
          if (hasToken) {
            promises.push(fetchCommits());
          }
          
          await Promise.all(promises);
        } catch (error) {
          console.error('Erro ao carregar dados:', error);
        } finally {
          setIsLoading(false);
        }
      };
      
      loadData();
    }
  }, [projectId, selectedMonth]);

  useEffect(() => {
    if (projectId && hasGitHubToken) {
      const interval = setInterval(syncCommits, 15 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [projectId, hasGitHubToken]);

  const handleStatusChange = async (activityId: string, newStatus: Status) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/daily-activities/${activityId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar status');
      }

      setDailyActivities(prevActivities => 
        prevActivities.map(activity => 
          activity.id === activityId 
            ? { ...activity, status: newStatus } 
            : activity
        )
      );

      if (newStatus === 'concluido') {
        const currentActivity = dailyActivities.find(a => a.id === activityId);
        if (currentActivity) {
          const currentDate = new Date(currentActivity.date);
          
          const previousActivities = dailyActivities.filter(activity => {
            const activityDate = new Date(activity.date);
            return activityDate < currentDate && activity.status !== 'concluido';
          });

          if (previousActivities.length > 0) {
            if (confirm(`Existem ${previousActivities.length} atividades anteriores não concluídas. Deseja marcá-las como concluídas também?`)) {
              for (const activity of previousActivities) {
                await fetch(`/api/projects/${projectId}/daily-activities/${activity.id}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ status: 'concluido' }),
                });
              }

              setDailyActivities(prevActivities =>
                prevActivities.map(activity =>
                  previousActivities.some(pa => pa.id === activity.id)
                    ? { ...activity, status: 'concluido' }
                    : activity
                )
              );

              toast.success(`${previousActivities.length} atividades anteriores foram marcadas como concluídas`);
            }
          }
        }
      }

      toast.success('Status atualizado com sucesso');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/daily-activities/${activityId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir atividade');
      }

      // Atualiza o estado local removendo a atividade excluída
      setDailyActivities(prevActivities => 
        prevActivities.filter(activity => activity.id !== activityId)
      );

      toast.success('Atividade excluída com sucesso');
    } catch (error) {
      console.error('Erro ao excluir atividade:', error);
      toast.error('Erro ao excluir atividade');
    }
  };

  const handleExport = () => {
    try {
      // Prepara os dados para exportação
      const rows = [
        ['Dia da Semana', 'Data', 'Início', 'Fim', 'Descrição']
      ];

      // Cria um array com todos os dias do mês
      const firstDay = startOfMonth(selectedMonth);
      const lastDay = endOfMonth(selectedMonth);
      const allDays: Date[] = [];
      let currentDay = firstDay;

      // Coleta todos os dias do mês e identifica os dias úteis
      const workDays: Date[] = [];
      while (currentDay <= lastDay) {
        // Verifica se o dia tem horário de trabalho cadastrado
        const schedule = workSchedule.find(s => s.dayOfWeek === currentDay.getDay());
        if (schedule?.isWorkDay && schedule.startTime && schedule.endTime) {
          allDays.push(currentDay);
          if (isWorkDay(currentDay)) {
            workDays.push(currentDay);
          }
        }
        currentDay = addDays(currentDay, 1);
      }

      // Agrupa todas as entradas por data
      const entriesByDate: { [date: string]: Array<{ description: string; status: string; type: string }> } = {};

      // Adiciona atividades ao agrupamento
      dailyActivities.forEach(activity => {
        const date = format(parseISO(activity.date), 'yyyy-MM-dd');
        if (!entriesByDate[date]) {
          entriesByDate[date] = [];
        }
        entriesByDate[date].push({
          description: activity.description,
          status: activity.status,
          type: 'Atividade'
        });
      });

      // Adiciona commits ao agrupamento
      if (shouldSpreadCommits && workDays.length > 0) {
        // Coleta todos os commits do mês
        const allCommits = Object.entries(commits).flatMap(([_, dateCommits]) => dateCommits);
        
        // Distribui os commits entre os dias úteis
        allCommits.forEach((commit, index) => {
          const workDayIndex = index % workDays.length;
          const workDay = workDays[workDayIndex];
          const dateStr = format(workDay, 'yyyy-MM-dd');
          
          if (!entriesByDate[dateStr]) {
            entriesByDate[dateStr] = [];
          }
          
          entriesByDate[dateStr].push({
            description: commit.message,
            status: 'commit',
            type: 'Commit'
          });
        });
      } else {
        // Mantém os commits em suas datas originais
        Object.entries(commits).forEach(([date, dateCommits]) => {
          if (!entriesByDate[date]) {
            entriesByDate[date] = [];
          }
          dateCommits.forEach(commit => {
            entriesByDate[date].push({
              description: commit.message,
              status: 'commit',
              type: 'Commit'
            });
          });
        });
      }

      // Adiciona uma linha para cada dia do mês que tem horário de trabalho
      allDays.forEach(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const diaDaSemana = format(date, 'EEEE', { locale: ptBR });
        const dataFormatada = format(date, 'dd/MM/yyyy');
        
        // Encontra o horário de trabalho para este dia da semana
        const schedule = workSchedule.find(s => s.dayOfWeek === date.getDay());
        
        // Só adiciona a linha se houver horário de trabalho cadastrado
        if (schedule?.isWorkDay && schedule.startTime && schedule.endTime) {
          // Pega as descrições do dia, se houver
          const entries = entriesByDate[dateStr] || [];
          const descricoes = entries.length > 0 
            ? entries.map(entry => {
                if (entry.type === 'Atividade') {
                  return `${entry.description} (${entry.status})`;
                }
                return `Commit: ${entry.description}`;
              }).join(' | ')
            : '-';
          
          rows.push([
            diaDaSemana,
            dataFormatada,
            schedule.startTime,
            schedule.endTime,
            descricoes
          ]);
        }
      });

      // Cria o conteúdo CSV
      const csvContent = rows
        .map(row => row.map(cell => `"${cell}"`).join(';'))
        .join('\r\n');

      // Adiciona BOM para suporte a caracteres especiais
      const csvWithBOM = '\uFEFF' + csvContent;

      // Cria o blob e o link para download
      const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      // Cria o elemento de link
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio-${projectName}-${format(new Date(), 'dd-MM-yyyy')}.csv`;
      
      // Adiciona o link ao documento, clica nele e depois remove
      document.body.appendChild(link);
      link.click();
      
      // Limpa o URL e remove o link
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);

      toast.success('Relatório exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      toast.error('Erro ao exportar relatório');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg">
        <p className="text-red-800">{error}</p>
        {error.includes('Token do GitHub não configurado') && (
          <div className="mt-4">
            <a 
              href="/settings" 
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Configurar token do GitHub →
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-semibold text-gray-800">Atividades do Projeto</h2>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handlePreviousMonth}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <span className="text-sm font-medium min-w-[140px] text-center">
            {format(selectedMonth, "MMMM 'de' yyyy", { locale: ptBR })}
          </span>
          
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="flex gap-2">
          <div className="flex items-center gap-2 mr-4">
            <input
              type="checkbox"
              id="spreadCommits"
              checked={shouldSpreadCommits}
              onChange={(e) => setShouldSpreadCommits(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="spreadCommits" className="text-sm text-gray-700">
              Distribuir commits
            </label>
          </div>

          <button
            onClick={handleExport}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-full shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exportar Dados
          </button>

          <button
            onClick={syncCommits}
            disabled={isSyncing}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isSyncing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sincronizando...
              </>
            ) : (
              <>
                <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Sincronizar Commits
              </>
            )}
          </button>
        </div>
      </div>

      <ActivityKanban 
        activities={dailyActivities}
        onStatusChange={handleStatusChange}
        onDeleteActivity={handleDeleteActivity}
        selectedMonth={selectedMonth}
        projectId={projectId}
        onActivityAdded={fetchDailyActivities}
      />

      <ActivityTable 
        commits={commits}
        activities={dailyActivities}
        isWorkDay={isWorkDay}
        selectedMonth={selectedMonth}
      />
    </div>
  );
} 