'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import WorkScheduleForm from './WorkScheduleForm';
import { Project, WorkSchedule } from '@prisma/client';

interface EditProjectFormProps {
  project: Project & {
    WorkSchedule: WorkSchedule[];
  };
}

export default function EditProjectForm({ project }: EditProjectFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      description: formData.get('description'),
      repositories: formData.get('repositories')?.toString().split(',').map(repo => repo.trim()),
    };

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao atualizar projeto');
      }

      router.push(`/projects/${project.id}`);
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao atualizar projeto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Editar Projeto</h1>
            <p className="mt-2 text-sm text-gray-500">
              Atualize as informações do projeto e os horários de trabalho
            </p>
          </div>
          <button
            type="submit"
            form="project-form"
            disabled={loading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
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
                    defaultValue={project.name}
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
                    defaultValue={project.description || ''}
                    rows={4}
                    placeholder="Descreva o projeto (opcional)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="repositories" className="block text-sm font-medium text-gray-700 mb-1">
                    Repositórios
                  </label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      id="repositories"
                      name="repositories"
                      defaultValue={project.repositories.join(', ')}
                      placeholder="exemplo: usuario/repo1, usuario/repo2"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                    <p className="text-sm text-gray-500">
                      Separe os repositórios por vírgula. Exemplo: usuario/repo1, usuario/repo2
                    </p>
                  </div>
                </div>
              </div>
            </form>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Horário de Trabalho</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Configure os horários de trabalho para cada dia da semana
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
      </div>
    </div>
  );
} 