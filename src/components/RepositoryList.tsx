'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import SearchInput from './SearchInput';

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

interface RepositoryListProps {
  onSelect?: (repositories: Repository[]) => void;
  selectedRepos?: string[];
  multiple?: boolean;
}

export default function RepositoryList({ onSelect, selectedRepos = [], multiple = false }: RepositoryListProps) {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedRepos));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    const fetchRepositories = async () => {
      try {
        const response = await fetch('/api/github/repositories');
        if (!response.ok) {
          const data = await response.json();
          if (response.status === 401) {
            router.push('/auth/signin');
            return;
          }
          throw new Error(data.error || 'Falha ao carregar repositórios');
        }
        const data = await response.json();
        setRepositories(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar repositórios');
        console.error('Erro ao carregar repositórios:', err);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchRepositories();
    }
  }, [session, router]);

  const handleSelect = (repo: Repository) => {
    const newSelected = new Set(selected);
    
    if (multiple) {
      if (newSelected.has(repo.full_name)) {
        newSelected.delete(repo.full_name);
      } else {
        newSelected.add(repo.full_name);
      }
    } else {
      newSelected.clear();
      newSelected.add(repo.full_name);
    }
    
    setSelected(newSelected);
    onSelect?.(repositories.filter(r => newSelected.has(r.full_name)));
  };

  const filteredRepositories = repositories.filter(repo => 
    repo.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    repo.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
        <strong className="font-medium">Erro: </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  if (repositories.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">Nenhum repositório encontrado.</p>
        <button
          onClick={() => router.push('/auth/signin')}
          className="mt-4 text-indigo-600 hover:text-indigo-500"
        >
          Conectar com GitHub →
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Buscar repositórios..."
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto p-1">
        {filteredRepositories.map((repo) => (
          <div
            key={repo.id}
            className={`flex flex-col h-full p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
              selected.has(repo.full_name)
                ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500 ring-opacity-50'
                : 'border-gray-200 hover:border-indigo-300'
            }`}
            onClick={() => handleSelect(repo)}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate hover:text-indigo-600">{repo.name}</h3>
                <p className="text-xs text-gray-500 truncate mt-0.5 hover:text-gray-700">{repo.full_name}</p>
              </div>
              <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
                {repo.private && (
                  <span className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
                    Privado
                  </span>
                )}
                {selected.has(repo.full_name) && (
                  <span className="text-indigo-600">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </div>
            </div>
            
            {repo.description && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-2 flex-grow">{repo.description}</p>
            )}
            
            <div className="flex items-center justify-between text-xs text-gray-500 mt-auto pt-2 border-t border-gray-100">
              <div className="flex items-center space-x-3">
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {repo.default_branch}
                </span>
                {repo.language && (
                  <span className="flex items-center">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 mr-1"></span>
                    {repo.language}
                  </span>
                )}
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {repo.stargazers_count}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {filteredRepositories.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          Nenhum repositório encontrado para "{searchTerm}"
        </div>
      )}
      
      {multiple && selected.size > 0 && (
        <div className="text-sm text-gray-500 text-right">
          {selected.size} repositório{selected.size > 1 ? 's' : ''} selecionado{selected.size > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
} 