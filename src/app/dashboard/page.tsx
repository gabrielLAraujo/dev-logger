'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { GitBranch, GitCommit, GitPullRequest, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
}

interface Commit {
  id: string;
  message: string;
  date: string;
  repository: string;
  url: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      console.log('Usuário não autenticado, redirecionando para o login...');
      window.location.href = '/login';
    }
  }, [status]);

  useEffect(() => {
    if (status === 'authenticated') {
      console.log('Usuário autenticado, buscando dados...');
      console.log('Dados da sessão:', session);
      fetchRepositories();
    }
  }, [status, session]);

  const fetchRepositories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/github/repositories');
      if (!response.ok) {
        throw new Error('Falha ao buscar repositórios');
      }
      const data = await response.json();
      setRepositories(data);
    } catch (error) {
      console.error('Erro ao buscar repositórios:', error);
      setError('Erro ao buscar repositórios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepositories();
  }, [fetchRepositories]);

  const fetchCommits = async (repo: Repository) => {
    try {
      console.log(`Buscando commits do repositório: ${repo.full_name}`);
      
      const response = await fetch(`/api/github/commits?repo=${repo.full_name}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erro ao buscar commits:', errorData);
        throw new Error(errorData.error || 'Falha ao buscar commits');
      }
      
      const data = await response.json();
      console.log(`Encontrados ${data.length} commits`);
      setCommits(data);
    } catch (error) {
      console.error('Erro ao buscar commits:', error);
      setError('Não foi possível carregar os commits');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = () => {
    router.push('/projects/new');
  };

  if (status === 'loading') {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Erro</h2>
          <p className="text-red-500">{error}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button onClick={handleCreateProject} className="flex items-center">
          <Plus className="mr-2 h-4 w-4" />
          Novo Projeto
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <StatCard
          title="Commits"
          value={commits.length}
          icon={GitCommit}
          loading={loading}
        />
        <StatCard
          title="Pull Requests"
          value="0"
          icon={GitPullRequest}
          loading={loading}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Commits Recentes</h2>
          {loading ? (
            <div className="space-y-2">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-5 w-32" />
                </div>
              ))}
            </div>
          ) : commits.length > 0 ? (
            <ul className="space-y-2">
              {commits.slice(0, 5).map((commit) => (
                <li key={commit.id} className="flex items-center justify-between">
                  <a
                    href={commit.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    {commit.message}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p>Nenhum commit encontrado.</p>
          )}
        </Card>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="container mx-auto p-4">
      <Skeleton className="h-8 w-48 mb-6" />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {Array(3).fill(0).map((_, i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-8 w-16" />
          </Card>
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="space-y-2">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-5 w-32" />
              </div>
            ))}
          </div>
        </Card>
        
        <Card className="p-6">
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="space-y-2">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
} 