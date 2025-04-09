'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import WorkScheduleForm from './WorkScheduleForm';
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

export default function NewProjectForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [selectedRepos, setSelectedRepos] = useState<Repository[]>([]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (selectedRepos.length === 0) {
      setError('Selecione pelo menos um repositório');
      setLoading(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      description: formData.get('description'),
      repositories: selectedRepos.map(repo => repo.full_name),
    };

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar projeto');
      }

      const project = await response.json();
      setProjectId(project.id);
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao criar projeto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Novo Projeto</h1>
            <p className="mt-2 text-sm text-gray-500">
              Crie um novo projeto e configure os horários de trabalho
            </p>
          </div>
          <button
            type="submit"
            form="project-form"
            disabled={loading || selectedRepos.length === 0}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Criando...' : 'Criar Projeto'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <form id="project-form" onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Projeto
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    placeholder="Digite o nome do projeto"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    placeholder="Descreva o projeto (opcional)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            </form>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Repositórios</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Selecione os repositórios que fazem parte deste projeto
                  </p>
                </div>
                {selectedRepos.length > 0 && (
                  <span className="text-sm text-gray-500">
                    {selectedRepos.length} repositório{selectedRepos.length > 1 ? 's' : ''} selecionado{selectedRepos.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <RepositoryList
                onSelect={setSelectedRepos}
                selectedRepos={selectedRepos.map(repo => repo.full_name)}
                multiple={true}
              />
            </div>
          </div>
        </div>

        {projectId && (
          <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Horário de Trabalho</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Configure os horários de trabalho para cada dia da semana
                </p>
              </div>
            </div>
            <WorkScheduleForm
              projectId={projectId}
              onSuccess={() => router.push(`/projects/${projectId}`)}
            />
          </div>
        )}
      </div>
    </div>
  );
} 