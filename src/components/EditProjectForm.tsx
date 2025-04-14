'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import WorkScheduleForm from './WorkScheduleForm';
import { Project, WorkSchedule } from '@prisma/client';
import { toast } from 'sonner';
import RepositoryList from './RepositoryList';
import Link from 'next/link';

interface Repository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  language: string | null;
  default_branch: string;
}

interface EditProjectFormProps {
  project: Project & {
    WorkSchedule: WorkSchedule[];
  };
}

export default function EditProjectForm({ project }: EditProjectFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRepos, setSelectedRepos] = useState<Repository[]>([]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      description: formData.get('description'),
      repositories: selectedRepos.map(repo => repo.full_name),
    };

    try {
      toast.loading('Atualizando projeto...');
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || 'Erro ao atualizar projeto');
        throw new Error(error.error || 'Erro ao atualizar projeto');
      }

      router.push(`/projects/${project.id}`);
      router.refresh();
      toast.success('Projeto atualizado com sucesso!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar projeto';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href={`/projects/${project.id}`} className="text-indigo-600 hover:text-indigo-900 text-sm font-medium mb-2 inline-block">
              ← Voltar para o Projeto
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Editar Projeto</h1>
            <p className="mt-1 text-sm text-gray-500">
              Atualize as informações do projeto e os horários de trabalho
            </p>
          </div>
          <button
            type="submit"
            form="project-form"
            disabled={loading || selectedRepos.length === 0}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-4">
            {error}
          </div>
        )}

        <form id="project-form" onSubmit={handleSubmit}>
          {/* Seção 1: Repositórios e Horário de Trabalho lado a lado */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Coluna da esquerda: Repositórios */}
            <div>
              <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 h-full">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">Repositórios</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Selecione os repositórios do projeto
                    </p>
                  </div>
                  {selectedRepos.length > 0 && (
                    <span className="text-sm text-gray-500">
                      {selectedRepos.length} repositório{selectedRepos.length > 1 ? 's' : ''} selecionado{selectedRepos.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <div className="h-[calc(100%-4rem)] overflow-hidden">
                  <RepositoryList
                    onSelect={setSelectedRepos}
                    selectedRepos={selectedRepos.map(repo => repo.full_name)}
                    multiple={true}
                    organization={project.organization}
                  />
                </div>
              </div>
            </div>

            {/* Coluna da direita: Horário de Trabalho */}
            <div>
              <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 h-full">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">Horário de Trabalho</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Configure os horários para cada dia da semana
                    </p>
                  </div>
                </div>
                <WorkScheduleForm
                  projectId={project.id}
                  initialSchedules={project.WorkSchedule}
                  onSuccess={() => router.refresh()}
                />
              </div>
            </div>
          </div>

          {/* Seção 2: Informações Básicas */}
          <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Informações Básicas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Projeto
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  defaultValue={project.name}
                  required
                  placeholder="Digite o nome do projeto"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  id="description"
                  name="description"
                  defaultValue={project.description || ''}
                  rows={4}
                  placeholder="Descreva o projeto (opcional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 