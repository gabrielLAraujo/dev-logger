'use client';

import { Project, WorkSchedule } from '@prisma/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import WorkScheduleForm from './WorkScheduleForm';
import DeleteProjectModal from './DeleteProjectModal';

interface Commit {
  sha: string;
  commit: {
    message: string;
    author: {
      date: string;
    };
  };
  html_url: string;
}

interface ProjectDetailsProps {
  project: Project & {
    WorkSchedule: WorkSchedule[];
  };
}

export default function ProjectDetails({ project }: ProjectDetailsProps) {
  const router = useRouter();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [commits, setCommits] = useState<Commit[]>([]);

  const syncCommits = async () => {
    setIsSyncing(true);
    setError('');

    try {
      toast.loading('Sincronizando commits...');
      const response = await fetch(`/api/projects/${project.id}/sync-commits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao sincronizar commits');
      }
      
      // Após sincronizar, buscar os commits atualizados
      await fetchCommits();
      toast.success('Commits sincronizados com sucesso!');
    } catch (error) {
      console.error('Erro ao sincronizar commits:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao sincronizar commits';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSyncing(false);
    }
  };

  const fetchCommits = async () => {
    setError('');

    try {
      const response = await fetch(`/api/projects/${project.id}/commits`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar commits');
      }
      
      if (!Array.isArray(data)) {
        throw new Error('Formato de resposta inválido');
      }
      
      setCommits(data);
    } catch (error) {
      console.error('Erro ao buscar commits:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar commits';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  useEffect(() => {
    fetchCommits();
    // Sincronizar commits a cada 5 minutos
    const interval = setInterval(syncCommits, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [project.id]);

  const handleDelete = async () => {
    setLoading(true);
    setError('');

    try {
      toast.loading('Excluindo projeto...');
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao excluir projeto');
      }

      router.push('/projects');
      router.refresh();
      toast.success('Projeto excluído com sucesso!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao excluir projeto';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setIsDeleteModalOpen(false);
    }
  };

  // Pegar os 5 commits mais recentes
  const recentCommits = commits.slice(0, 5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Coluna da Esquerda: Informações do Projeto e Repositórios */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <div className="flex space-x-2">
              <button
                onClick={() => router.push(`/projects/${project.id}/edit`)}
                className="p-2 text-gray-600 hover:text-indigo-600"
                title="Editar Projeto"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="p-2 text-gray-600 hover:text-red-600"
                title="Excluir Projeto"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>

          {project.description && (
            <p className="text-gray-600 mb-4">{project.description}</p>
          )}

          <div className="space-y-2">
            <h2 className="text-lg font-medium text-gray-900">Repositórios</h2>
            {project.repositories.length > 0 ? (
              project.repositories.map((repo, index) => (
                <a
                  key={index}
                  href={`https://github.com/${repo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 bg-gray-50 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  {repo}
                </a>
              ))
            ) : (
              <p className="text-gray-500 text-sm">Nenhum repositório cadastrado.</p>
            )}
          </div>
        </div>

        {/* Últimos Commits */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-medium text-gray-900">Últimos Commits</h2>
              <span className="text-xs text-gray-500">(5 mais recentes)</span>
            </div>
            <div className="flex items-center space-x-2">
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
                    Sincronizar
                  </>
                )}
              </button>
            </div>
          </div>
          {error && (
            <div className="mb-4 p-2 text-sm text-red-700 bg-red-100 rounded-md">
              {error}
            </div>
          )}
          {recentCommits.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhum commit encontrado.</p>
          ) : (
            <div className="space-y-2">
              {recentCommits.map((commit) => (
                <a
                  key={commit.sha}
                  href={commit.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block border-b border-gray-200 pb-2 last:border-0 hover:bg-gray-50 transition-colors rounded-md p-2 -mx-2"
                >
                  <p className="text-sm font-medium text-gray-900 truncate">{commit.commit.message}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-500">
                      {format(new Date(commit.commit.author.date), "d 'de' MMMM", {
                        locale: ptBR,
                      })}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(commit.commit.author.date), "HH:mm", {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </a>
              ))}
              <button
                onClick={() => router.push(`/projects/${project.id}/reports`)}
                className="w-full mt-2 text-sm text-indigo-600 hover:text-indigo-900 text-center"
              >
                Ver todos os commits →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Coluna da Direita: Horário de Trabalho */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Horário de Trabalho</h2>
          <WorkScheduleForm
            projectId={project.id}
            initialSchedules={project.WorkSchedule}
            onSuccess={() => router.refresh()}
          />
        </div>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      <DeleteProjectModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        projectName={project.name}
      />
    </div>
  );
} 