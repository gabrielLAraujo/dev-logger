'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Plus, Settings, LogOut } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
interface Project {
  id: string;
  name: string;
  description: string | null;
}

export default function ProjectsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch('/api/projects');
        if (!response.ok) {
          throw new Error('Falha ao carregar projetos');
        }
        const data = await response.json();
        setProjects(data);
      } catch (error) {
        console.error('Erro ao carregar projetos:', error);
        setError('Erro ao carregar projetos. Por favor, tente novamente.');
      } finally {
        setIsLoading(false);
      }
    };

    if (session) {
      fetchProjects();
    }
  }, [session]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="mx-auto max-w-7xl">
          <header className="mb-8 flex items-center justify-between">
            <Skeleton className="h-8 w-32" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </header>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="flex h-32 cursor-pointer items-center justify-center border-dashed">
              <div className="flex flex-col items-center gap-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-4 w-24" />
              </div>
            </Card>
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                    <div className="flex flex-wrap gap-2">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Projetos</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {session?.user?.name}
            </span>
            {session?.user?.image && (
              <img
                src={session.user.image}
                alt={session.user.name || 'Avatar'}
                className="h-8 w-8 rounded-full"
              />
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card
            onClick={() => router.push('/projects/new')}
            className="flex h-32 cursor-pointer items-center justify-center border-dashed hover:bg-muted"
          >
            <div className="flex flex-col items-center gap-2">
              <Plus className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Novo Projeto</span>
            </div>
          </Card>

          {projects.map((project) => (
            <Card
              key={project.id}
              onClick={() => router.push(`/projects/${project.id}`)}
              className="cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium">{project.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {project.description || 'Sem descrição'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation();
                    router.push(`/projects/${project.id}/settings`);
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
} 