'use client';

import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, isAfter, isBefore, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ExportButton from './ExportButton';
import { improveCommitMessage } from '@/lib/huggingface';
import { toast } from 'react-hot-toast';

interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      date: string;
      name: string;
    };
  };
  html_url: string;
}

interface WorkSchedule {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isWorkDay: boolean;
}

interface ProjectReportProps {
  projectName: string;
  WorkSchedule: WorkSchedule[];
  repositories: string[];
  projectId: string;
}

export default function ProjectReport({ projectName, WorkSchedule, repositories, projectId }: ProjectReportProps) {
  const [spreadCommits, setSpreadCommits] = useState(false);
  const [improveCommitMessages, setImproveCommitMessages] = useState(false);
  const [commits, setCommits] = useState<GitHubCommit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isImprovingMessages, setIsImprovingMessages] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const fetchCommitsFromGitHub = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Buscar o token do GitHub do usuário
      const userSettingsResponse = await fetch('/api/user/settings');
      if (!userSettingsResponse.ok) {
        throw new Error('Erro ao buscar configurações do usuário');
      }
      
      const userSettings = await userSettingsResponse.json();
      if (!userSettings.githubToken) {
        throw new Error('Token do GitHub não configurado');
      }

      // Buscar commits de cada repositório
      const allCommits: GitHubCommit[] = [];
      
      for (const repo of repositories) {
        try {
          const [owner, repoName] = repo.split('/');
          const response = await fetch(
            `https://api.github.com/repos/${owner}/${repoName}/commits?per_page=100`,
            {
              headers: {
                Authorization: `Bearer ${userSettings.githubToken}`,
                Accept: 'application/vnd.github.v3+json',
              },
            }
          );

          if (!response.ok) {
            console.error(`Erro ao buscar commits do repositório ${repo}:`, await response.text());
            continue;
          }

          const repoCommits = await response.json();
          allCommits.push(...repoCommits);
        } catch (error) {
          console.error(`Erro ao buscar commits do repositório ${repo}:`, error);
        }
      }

      // Ordenar commits por data (mais recentes primeiro)
      allCommits.sort((a, b) => 
        new Date(b.commit.author.date).getTime() - new Date(a.commit.author.date).getTime()
      );

      setCommits(allCommits);
    } catch (error) {
      console.error('Erro ao buscar commits:', error);
      setError(error instanceof Error ? error.message : 'Erro ao buscar commits');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCommitsFromGitHub();
    // Atualizar commits a cada 5 minutos
    const interval = setInterval(fetchCommitsFromGitHub, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [repositories]);

  // Obter o primeiro e último dia do mês atual
  const today = new Date();
  const firstDayOfMonth = startOfMonth(today);
  const lastDayOfMonth = endOfMonth(today);

  // Gerar array com todos os dias do mês
  const daysOfMonth = eachDayOfInterval({
    start: firstDayOfMonth,
    end: lastDayOfMonth,
  });

  // Mapear os commits por data
  const commitsByDate = commits.reduce((acc, commit) => {
    const date = format(new Date(commit.commit.author.date), 'dd/MM/yyyy');
    if (!acc[date]) {
      acc[date] = [];
    }
    // Filtrar informações sensíveis e comentários
    const message = commit.commit.message
      .split('\n')[0] // Pegar apenas a primeira linha (título do commit)
      .replace(/password|senha|token|key|api[_-]?key|secret|credencial/i, '[INFORMAÇÃO REMOVIDA]')
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL REMOVIDO]')
      .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, '[CPF REMOVIDO]')
      .replace(/\b\d{2}\.?\d{4,5}-?\d{4}\b/g, '[TELEFONE REMOVIDO]');
    
    acc[date].push(message);
    return acc;
  }, {} as Record<string, string[]>);

  // Função para verificar se um dia é um dia de trabalho
  const isWorkDay = (date: Date) => {
    const workSchedule = WorkSchedule.find(schedule => 
      schedule.dayOfWeek === date.getDay() && schedule.isWorkDay
    );
    return !!workSchedule;
  };

  // Função para distribuir os commits entre os dias de trabalho
  const distributeCommits = () => {
    const workDays = daysOfMonth.filter(isWorkDay);
    
    // Filtrar commits apenas do mês atual
    const currentMonthCommits = Object.entries(commitsByDate)
      .filter(([date]) => {
        const [day, month, year] = date.split('/');
        const commitDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return commitDate >= firstDayOfMonth && commitDate <= lastDayOfMonth;
      })
      .reduce((acc, [date, commits]) => {
        acc[date] = commits;
        return acc;
      }, {} as Record<string, string[]>);

    const allCommits = Object.values(currentMonthCommits).flat();
    const distributedCommits: Record<string, string[]> = {};

    // Inicializar todos os dias de trabalho com arrays vazios
    workDays.forEach(date => {
      const formattedDate = format(date, 'dd/MM/yyyy');
      distributedCommits[formattedDate] = [];
    });

    // Distribuir os commits entre os dias de trabalho
    if (workDays.length > 0 && allCommits.length > 0) {
      let currentDayIndex = 0;
      allCommits.forEach((commit) => {
        const date = workDays[currentDayIndex];
        const formattedDate = format(date, 'dd/MM/yyyy');
        distributedCommits[formattedDate].push(commit);
        currentDayIndex = (currentDayIndex + 1) % workDays.length;
      });
    }

    return distributedCommits;
  };

  // Função para formatar os commits com quebra de linha
  const formatCommits = (commits: string[]) => {
    return commits.join('\n');
  };

  // Gerar a planilha
  const spreadsheet = daysOfMonth
    .filter(date => isWorkDay(date))
    .map(date => {
      const formattedDate = format(date, 'dd/MM/yyyy');
      const dayOfWeek = format(date, 'EEEE', { locale: ptBR });
      const workSchedule = WorkSchedule.find(schedule => 
        schedule.dayOfWeek === date.getDay() && schedule.isWorkDay
      );
      
      let commitsForDay: string[] = [];
      
      if (spreadCommits) {
        commitsForDay = distributeCommits()[formattedDate] || [];
      } else {
        commitsForDay = commitsByDate[formattedDate] || [];
      }

      return {
        dayOfWeek,
        date: formattedDate,
        startTime: workSchedule?.startTime || '07:00',
        endTime: workSchedule?.endTime || '17:00',
        description: formatCommits(commitsForDay) || 'Sem commits',
      };
    });

  // Função para melhorar todas as mensagens de commit
  const improveAllCommitMessages = async () => {
    if (!improveCommitMessages) return;
    
    setIsImprovingMessages(true);
    setError(null);
    
    try {
      const improvedCommits = [...commits];
      const totalCommits = improvedCommits.length;
      let processedCount = 0;
      let successCount = 0;
      let errorCount = 0;
      
      // Inicializar o progresso
      setProgress({ current: 0, total: totalCommits });
      
      // Processar commits em lotes para melhorar a experiência do usuário
      const batchSize = 3; // Reduzido para evitar problemas de rate limiting
      for (let i = 0; i < improvedCommits.length; i += batchSize) {
        const batch = improvedCommits.slice(i, i + batchSize);
        
        // Processar cada commit no lote atual
        await Promise.all(batch.map(async (commit, index) => {
          try {
            const originalMessage = commit.commit.message;
            
            // Verificar se a mensagem já contém a instrução (para evitar duplicação)
            if (originalMessage.includes("Melhore a seguinte mensagem de commit")) {
              // Se já contiver a instrução, usar a mensagem original
              console.warn("Mensagem já contém instrução, usando mensagem original");
              successCount++;
            } else {
              const improvedMessage = await improveCommitMessage(originalMessage);
              
              // Verificar se a mensagem melhorada é diferente da original
              if (improvedMessage !== originalMessage) {
                improvedCommits[i + index] = {
                  ...commit,
                  commit: {
                    ...commit.commit,
                    message: improvedMessage
                  }
                };
                successCount++;
              } else {
                console.warn("Mensagem não foi melhorada, mantendo original");
              }
            }
          } catch (err) {
            console.error(`Erro ao melhorar mensagem ${i + index}:`, err);
            errorCount++;
          }
          
          processedCount++;
          // Atualizar o progresso
          setProgress({ current: processedCount, total: totalCommits });
        }));
        
        // Atualizar o estado a cada lote para mostrar o progresso
        setCommits([...improvedCommits]);
        
        // Adicionar um pequeno atraso entre os lotes para evitar problemas de rate limiting
        if (i + batchSize < improvedCommits.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Mostrar mensagem de resumo
      if (errorCount > 0) {
        setError(`Melhoramos ${successCount} de ${totalCommits} mensagens. ${errorCount} mensagens não puderam ser melhoradas.`);
      } else if (successCount > 0) {
        toast.success(`Melhoramos ${successCount} de ${totalCommits} mensagens com sucesso!`);
      }
    } catch (error) {
      console.error('Erro ao melhorar mensagens:', error);
      setError('Erro ao melhorar mensagens de commit. Verifique o console para mais detalhes.');
    } finally {
      setIsImprovingMessages(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  // Efeito para melhorar mensagens quando a flag for ativada
  useEffect(() => {
    if (improveCommitMessages && commits.length > 0) {
      improveAllCommitMessages();
    }
  }, [improveCommitMessages]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={spreadCommits}
              onChange={(e) => setSpreadCommits(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Distribuir commits entre os dias de trabalho</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={improveCommitMessages}
              onChange={(e) => setImproveCommitMessages(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              disabled={isImprovingMessages}
            />
            <span className="text-sm text-gray-700">
              {isImprovingMessages ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Melhorando mensagens...
                </span>
              ) : (
                'Melhorar mensagens de commit'
              )}
            </span>
          </label>
          
          <button
            onClick={fetchCommitsFromGitHub}
            disabled={isLoading}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Carregando...
              </>
            ) : (
              <>
                <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Atualizar
              </>
            )}
          </button>
        </div>
        <ExportButton 
          data={spreadsheet} 
          filename={`relatorio-${projectName}-${format(firstDayOfMonth, 'yyyy-MM')}.xlsx`} 
        />
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Erro</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {isImprovingMessages && (
        <div className="rounded-md bg-blue-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="animate-spin h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-blue-800">Processando mensagens</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>Estamos melhorando as mensagens de commit usando IA. Isso pode levar alguns segundos...</p>
                
                {progress.total > 0 && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-blue-600 mb-1">
                      <span>Progresso: {progress.current} de {progress.total} mensagens</span>
                      <span>{Math.round((progress.current / progress.total) * 100)}%</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                        style={{ width: `${(progress.current / progress.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
        {isLoading ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 text-center">
            <div className="flex justify-center">
              <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <p className="mt-2 text-gray-500">Carregando commits do GitHub...</p>
          </div>
        ) : spreadsheet.length === 0 ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 text-center">
            <p className="text-gray-500">Nenhum dia de trabalho encontrado para este mês.</p>
            <p className="text-sm text-gray-400 mt-2">Configure os horários de trabalho para os dias da semana.</p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dia da Semana
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Início
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fim
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descrição
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {spreadsheet.map((row, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {row.dayOfWeek}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {row.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {row.startTime}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {row.endTime}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {row.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 