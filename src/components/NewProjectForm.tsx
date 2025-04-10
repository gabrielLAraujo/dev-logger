'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import WorkScheduleForm from './WorkScheduleForm';
import RepositoryList from './RepositoryList';
import { toast } from 'sonner';

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
  const [error, setError] = useState<string | null>(null);
  const [apiErrors, setApiErrors] = useState<Array<{ field: string; message: string }>>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [selectedRepos, setSelectedRepos] = useState<Repository[]>([]);
  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    description?: string;
    repositories?: string;
  }>({});
  const [touchedFields, setTouchedFields] = useState<{
    name: boolean;
    description: boolean;
  }>({
    name: false,
    description: false,
  });

  const validateField = (name: string, value: string) => {
    if (name === 'name') {
      if (!value || value.trim().length === 0) {
        return 'O nome do projeto é obrigatório';
      } else if (value.length > 100) {
        return 'O nome do projeto não pode ter mais de 100 caracteres';
      }
    } else if (name === 'description' && value.length > 500) {
      return 'A descrição não pode ter mais de 500 caracteres';
    }
    return '';
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTouchedFields(prev => ({ ...prev, [name]: true }));
    
    const error = validateField(name, value);
    setValidationErrors(prev => ({
      ...prev,
      [name]: error,
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (touchedFields[name as keyof typeof touchedFields]) {
      const error = validateField(name, value);
      setValidationErrors(prev => ({
        ...prev,
        [name]: error,
      }));
    }
  };

  const validateForm = (formData: FormData) => {
    const errors: { name?: string; description?: string; repositories?: string } = {};
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    const nameError = validateField('name', name);
    if (nameError) errors.name = nameError;

    if (description) {
      const descriptionError = validateField('description', description);
      if (descriptionError) errors.description = descriptionError;
    }

    if (selectedRepos.length === 0) {
      errors.repositories = 'Selecione pelo menos um repositório';
    }

    setValidationErrors(errors);
    return {
      success: Object.keys(errors).length === 0,
      data: {
        name: name.trim(),
        description: description ? description.trim() : null,
        repositories: selectedRepos.map(repo => repo.full_name),
      },
      errors: Object.keys(errors).map(field => ({
        field,
        message: errors[field as keyof typeof errors] || '',
      })),
    };
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setApiErrors([]);

    const formData = new FormData(e.currentTarget);
    const validationResult = validateForm(formData);

    if (!validationResult.success) {
      setApiErrors(validationResult.errors);
      setLoading(false);
      return;
    }

    const data = validationResult.data;

    try {
      toast.loading('Criando projeto...');
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.details) {
          setApiErrors(result.details);
          setError(result.error || 'Erro ao criar projeto');
          toast.error(result.error || 'Erro ao criar projeto');
        } else {
          throw new Error(result.error || 'Erro ao criar projeto');
        }
        return;
      }

      setProjectId(result.id);
      router.refresh();
      toast.success('Projeto criado com sucesso!');
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
        toast.error(error.message);
      } else {
        setError('Ocorreu um erro inesperado ao criar o projeto');
        toast.error('Ocorreu um erro inesperado ao criar o projeto');
      }
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
            <p className="font-medium">Erro ao criar projeto</p>
            <p className="text-sm">{error}</p>
            {apiErrors.length > 0 && (
              <ul className="mt-2 list-disc list-inside text-sm">
                {apiErrors.map((err, index) => (
                  <li key={index}>{err.message}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {(validationErrors.name || validationErrors.repositories) && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md mb-6">
            <p className="font-medium">Por favor, corrija os seguintes erros:</p>
            <ul className="list-disc list-inside text-sm mt-1">
              {validationErrors.name && <li>{validationErrors.name}</li>}
              {validationErrors.repositories && <li>{validationErrors.repositories}</li>}
            </ul>
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
                    className={`w-full px-4 py-2 border ${
                      validationErrors.name && touchedFields.name
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                    } rounded-md shadow-sm sm:text-sm`}
                    onBlur={handleBlur}
                    onChange={handleChange}
                  />
                  {validationErrors.name && touchedFields.name && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
                  )}
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
                    className={`w-full px-4 py-2 border ${
                      validationErrors.description && touchedFields.description
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                    } rounded-md shadow-sm sm:text-sm`}
                    onBlur={handleBlur}
                    onChange={handleChange}
                  />
                  {validationErrors.description && touchedFields.description && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.description}</p>
                  )}
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