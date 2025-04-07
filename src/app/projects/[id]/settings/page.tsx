'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import WorkScheduleForm from '@/components/WorkScheduleForm';
import { useToast } from '@/contexts/ToastContext';

interface Project {
  id: string;
  name: string;
  description: string | null;
  repositories: string[];
}

export default function ProjectSettingsPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { showToast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`/api/projects/${params.id}`);
        if (!response.ok) {
          throw new Error('Falha ao carregar projeto');
        }
        const data = await response.json();
        setProject(data);
      } catch (error) {
        console.error('Erro ao carregar projeto:', error);
        setError('Erro ao carregar projeto. Por favor, tente novamente.');
      } finally {
        setIsLoading(false);
      }
    };

    if (session) {
      fetchProject();
    }
  }, [session, params.id]);

  const handleSave = () => {
    showToast('Configurações salvas com sucesso!', 'success');
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="mx-auto max-w-4xl">
          <header className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-32" />
            </div>
          </header>

          <div className="space-y-6">
            <Card className="p-6">
              <Skeleton className="h-6 w-48 mb-4" />
              <div className="space-y-4">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <div key={i} className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow">
                    <Skeleton className="h-5 w-5 rounded" />
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-5 w-6" />
                    <Skeleton className="h-9 w-24" />
                  </div>
                ))}
              </div>
            </Card>
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

  if (!project) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
          <p>Projeto não encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/projects/${params.id}`)}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Configurações do Projeto</h1>
          </div>
        </header>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Horários de Trabalho</h2>
            <WorkScheduleForm projectId={params.id} onSave={handleSave} />
          </Card>
        </div>
      </div>
    </div>
  );
} 