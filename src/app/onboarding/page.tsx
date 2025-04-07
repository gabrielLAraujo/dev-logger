'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  private: boolean;
}

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      console.log('Usuário autenticado:', session?.user?.name);
      fetchRepositories();
    }
  }, [status, router, session]);

  const fetchRepositories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/github/repositories');
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erro ao buscar repositórios:', errorData);
        throw new Error(errorData.error || 'Falha ao buscar repositórios');
      }
      
      const data = await response.json();
      setRepositories(data);
    } catch (err) {
      console.error('Erro ao buscar repositórios:', err);
      setError(err instanceof Error ? err.message : 'Não foi possível carregar seus repositórios. Tente novamente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRepoToggle = (repoFullName: string) => {
    setSelectedRepos(prev => {
      if (prev.includes(repoFullName)) {
        return prev.filter(repo => repo !== repoFullName);
      } else {
        return [...prev, repoFullName];
      }
    });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          monitoredRepos: selectedRepos,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Falha ao salvar configurações');
      }
      
      router.push('/dashboard');
    } catch (err) {
      console.error('Erro ao salvar configurações:', err);
      setError('Não foi possível salvar suas configurações. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando seus repositórios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Bem-vindo ao Dev Logger</h1>
          <p className="mt-2 text-lg text-gray-600">
            Selecione os repositórios que você deseja monitorar
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Seus Repositórios</h2>
            
            {repositories.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhum repositório encontrado.</p>
                <button
                  onClick={fetchRepositories}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Tentar novamente
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {repositories.map((repo) => (
                  <div
                    key={repo.id}
                    className="flex items-center p-4 border rounded-md hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      id={`repo-${repo.id}`}
                      checked={selectedRepos.includes(repo.full_name)}
                      onChange={() => handleRepoToggle(repo.full_name)}
                      className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor={`repo-${repo.id}`}
                      className="ml-3 flex-1 cursor-pointer"
                    >
                      <div className="flex items-center">
                        <span className="font-medium">{repo.name}</span>
                        {repo.private && (
                          <span className="ml-2 px-2 py-0.5 text-xs bg-gray-200 text-gray-700 rounded">
                            Privado
                          </span>
                        )}
                      </div>
                      {repo.description && (
                        <p className="text-sm text-gray-500 mt-1">{repo.description}</p>
                      )}
                    </label>
                    <a
                      href={repo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-4 text-indigo-600 hover:text-indigo-800"
                    >
                      Ver no GitHub
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
            <button
              onClick={fetchRepositories}
              className="text-indigo-600 hover:text-indigo-800"
            >
              Atualizar lista
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || selectedRepos.length === 0}
              className={`px-4 py-2 bg-indigo-600 text-white rounded-md ${
                isSaving || selectedRepos.length === 0
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-indigo-700'
              }`}
            >
              {isSaving ? 'Salvando...' : 'Continuar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 