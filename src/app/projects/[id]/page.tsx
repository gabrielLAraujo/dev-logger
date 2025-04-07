'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';
import { GitBranch, Settings, BarChart, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import WorkScheduleForm from '@/components/WorkScheduleForm';
import { useToast } from '@/contexts/ToastContext';

interface Project {
  id: string;
  name: string;
  description: string;
  repositories: string[];
  createdAt: string;
  updatedAt: string;
}

interface WorkSchedule {
  id: string;
  projectId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isWorkDay: boolean;
}

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/projects/${id}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Falha ao carregar projeto');
        }
        
        const data = await response.json();
        setProject(data);
      } catch (error) {
        console.error('Erro ao carregar projeto:', error);
        setError('Erro ao carregar projeto. Por favor, tente novamente.');
        showToast('Erro ao carregar projeto', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchProject();
    }
  }, [id, showToast]);

  const handleDeleteProject = async () => {
    if (!confirm('Tem certeza que deseja excluir este projeto?')) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao excluir projeto');
      }

      showToast('Projeto excluído com sucesso!', 'success');
      router.push('/projects');
    } catch (error) {
      console.error('Erro ao excluir projeto:', error);
      setError('Erro ao excluir projeto. Por favor, tente novamente.');
      showToast('Erro ao excluir projeto', 'error');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="mx-auto max-w-7xl">
          <header className="mb-8">
            <Skeleton className="h-8 w-64" />
          </header>
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6">
              <Skeleton className="h-6 w-48 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-4" />
              <Skeleton className="h-10 w-full" />
            </Card>
            <Card className="p-6">
              <Skeleton className="h-6 w-48 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="mx-auto max-w-7xl">
          <header className="mb-8">
            <h1 className="text-2xl font-bold">Erro</h1>
          </header>
          <Card className="p-6">
            <p className="text-red-500">{error}</p>
            <Button 
              onClick={() => router.push('/projects')} 
              className="mt-4"
            >
              Voltar para Projetos
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="mx-auto max-w-7xl">
          <header className="mb-8">
            <h1 className="text-2xl font-bold">Projeto não encontrado</h1>
          </header>
          <Card className="p-6">
            <p>O projeto solicitado não foi encontrado.</p>
            <Button 
              onClick={() => router.push('/projects')} 
              className="mt-4"
            >
              Voltar para Projetos
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <div className="flex gap-2">
            <Link href={`/projects/${id}/report`}>
              <Button 
                variant="outline" 
                className="flex items-center"
              >
                <BarChart className="mr-2 h-4 w-4" />
                Relatório
              </Button>
            </Link>
            <Link href={`/projects/${id}/settings`}>
              <Button 
                variant="outline" 
                className="flex items-center"
              >
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </Button>
            </Link>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4">Informações do Projeto</h2>
            <p className="mb-4">{project.description || 'Sem descrição'}</p>
            
            <h3 className="text-md font-medium mb-2 flex items-center">
              <GitBranch className="mr-2 h-4 w-4" />
              Repositórios
            </h3>
            <div className="flex flex-wrap gap-2">
              {project.repositories && project.repositories.length > 0 ? (
                project.repositories.map((repo) => (
                  <a
                    key={repo}
                    href={`https://github.com/${repo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary hover:bg-primary/20 transition-colors"
                  >
                    {repo}
                  </a>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum repositório associado</p>
              )}
            </div>
            
            <div className="mt-6">
              <Button 
                variant="destructive" 
                onClick={handleDeleteProject}
                disabled={isLoading}
              >
                Excluir Projeto
              </Button>
            </div>
          </Card>
          
          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4">Horário de Trabalho</h2>
            <WorkScheduleForm 
              projectId={id as string} 
              onSave={() => showToast('Horários de trabalho atualizados com sucesso!', 'success')} 
            />
          </Card>
        </div>
      </div>
    </div>
  );
} 