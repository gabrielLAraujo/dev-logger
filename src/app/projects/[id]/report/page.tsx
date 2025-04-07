'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GitBranch, GitCommit, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';

interface Commit {
  id: string;
  message: string;
  date: string;
  repository: string;
  url: string;
}

interface DailyReport {
  date: string;
  commits: Commit[];
  totalHours: number;
  isWorkDay: boolean;
}

interface WorkSchedule {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isWorkDay: boolean;
}

export default function ProjectReportPage() {
  const { id } = useParams();
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);
  const [workSchedule, setWorkSchedule] = useState<WorkSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkSchedule = async () => {
      try {
        const response = await fetch(`/api/projects/${id}/work-schedule`);
        if (!response.ok) {
          throw new Error('Falha ao carregar horário de trabalho');
        }
        const data = await response.json();
        setWorkSchedule(data);
      } catch (error) {
        console.error('Erro ao carregar horário de trabalho:', error);
        setError('Erro ao carregar horário de trabalho');
      }
    };

    if (id) {
      fetchWorkSchedule();
    }
  }, [id]);

  useEffect(() => {
    const fetchCommits = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log('Buscando commits para o projeto:', id);
        
        // Primeiro, buscar os repositórios associados ao projeto
        const projectResponse = await fetch(`/api/projects/${id}`);
        if (!projectResponse.ok) {
          throw new Error('Falha ao buscar informações do projeto');
        }
        const projectData = await projectResponse.json();
        const projectRepositories = projectData.repositories || [];
        
        if (projectRepositories.length === 0) {
          setDailyReports([]);
          return;
        }
        
        console.log('Repositórios do projeto:', projectRepositories);
        
        // Buscar commits apenas para os repositórios do projeto
        const response = await fetch(`/api/github/commits?repositories=${projectRepositories.join(',')}`);
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Erro ao buscar commits:', errorData);
          throw new Error(errorData.error || 'Falha ao buscar commits');
        }
        
        const commits: Commit[] = await response.json();
        console.log(`Encontrados ${commits.length} commits`);
        
        // Agrupa commits por dia
        const reportsByDay = commits.reduce((acc, commit) => {
          const date = format(parseISO(commit.date), 'yyyy-MM-dd');
          if (!acc[date]) {
            const commitDate = parseISO(commit.date);
            const dayOfWeek = commitDate.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
            const schedule = workSchedule.find(s => s.dayOfWeek === dayOfWeek);
            
            acc[date] = {
              date,
              commits: [],
              totalHours: schedule ? calculateWorkHours(commitDate, schedule) : 0,
              isWorkDay: schedule?.isWorkDay || false
            };
          }
          acc[date].commits.push(commit);
          return acc;
        }, {} as Record<string, DailyReport>);

        const sortedReports = Object.values(reportsByDay).sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        
        console.log(`Gerados ${sortedReports.length} relatórios diários`);
        setDailyReports(sortedReports);
      } catch (error) {
        console.error('Erro ao carregar commits:', error);
        setError('Erro ao carregar commits. Por favor, tente novamente.');
      } finally {
        setIsLoading(false);
      }
    };

    if (id && workSchedule.length > 0) {
      fetchCommits();
    }
  }, [id, workSchedule]);

  const calculateWorkHours = (date: Date, schedule: WorkSchedule): number => {
    if (!schedule.isWorkDay) return 0;
    
    const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
    const [endHour, endMinute] = schedule.endTime.split(':').map(Number);
    
    const start = new Date(date);
    start.setHours(startHour, startMinute, 0, 0);
    
    const end = new Date(date);
    end.setHours(endHour, endMinute, 0, 0);
    
    const diffMs = end.getTime() - start.getTime();
    return diffMs / (1000 * 60 * 60);
  };

  const formatDate = (date: Date) => {
    return format(date, 'dd/MM/yyyy');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="mx-auto max-w-7xl">
          <header className="mb-8">
            <Skeleton className="h-8 w-48" />
          </header>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-8 w-8" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-8">
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-muted">
                    <tr>
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <th key={i} className="px-6 py-3">
                          <Skeleton className="h-4 w-20" />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3].map((i) => (
                      <tr key={i}>
                        {[1, 2, 3, 4, 5, 6].map((j) => (
                          <td key={j} className="px-6 py-4">
                            <Skeleton className="h-4 w-full" />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <h1 className="text-2xl font-bold">Relatório do Projeto</h1>
        </header>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <StatCard 
            title="Total de Commits" 
            value={dailyReports.reduce((acc, report) => acc + report.commits.length, 0)} 
            icon={GitCommit} 
            loading={isLoading} 
          />
          <StatCard 
            title="Dias com Commits" 
            value={dailyReports.length} 
            icon={GitBranch} 
            loading={isLoading} 
          />
          <StatCard 
            title="Média de Commits por Dia" 
            value={dailyReports.length > 0 
              ? (dailyReports.reduce((acc, report) => acc + report.commits.length, 0) / dailyReports.length).toFixed(1)
              : 0
            } 
            icon={GitCommit} 
            loading={isLoading} 
          />
        </div>

        <div className="mt-8">
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-muted">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-foreground uppercase tracking-wider">
                      Data
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-foreground uppercase tracking-wider">
                      Dia da Semana
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-foreground uppercase tracking-wider">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        Horas Trabalhadas
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-foreground uppercase tracking-wider">
                      <div className="flex items-center">
                        <GitCommit className="h-4 w-4 mr-2" />
                        Commits
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-foreground uppercase tracking-wider">
                      <div className="flex items-center">
                        <GitCommit className="h-4 w-4 mr-2" />
                        Detalhes
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-foreground uppercase tracking-wider">
                      <div className="flex items-center">
                        <GitBranch className="h-4 w-4 mr-2" />
                        Repositório
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-background divide-y divide-gray-200">
                  {dailyReports.length > 0 ? (
                    dailyReports.map((report, index) => (
                      <tr key={index} className="hover:bg-muted/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                          {formatDate(parseISO(report.date))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                          {format(parseISO(report.date), 'EEEE', { locale: ptBR })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                          {report.isWorkDay ? `${report.totalHours.toFixed(2)}h` : 'Não é dia útil'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                          {report.commits.length}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">
                          <div className="space-y-2">
                            {report.commits.map((commit, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <span className="font-medium min-w-[48px]">{format(parseISO(commit.date), 'HH:mm')}</span>
                                <a
                                  href={commit.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline flex-1"
                                >
                                  {commit.message}
                                </a>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-foreground">
                          <div className="space-y-2">
                            {report.commits.map((commit, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <GitBranch className="h-4 w-4 text-muted-foreground" />
                                <span>{commit.repository}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-muted-foreground">
                        Nenhum commit encontrado para este projeto.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
} 