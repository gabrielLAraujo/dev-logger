'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Download, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/contexts/ToastContext';

interface Project {
  id: string;
  name: string;
  description: string | null;
}

export default function ExportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { showToast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchProjects();
    }
  }, [status, router]);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (!response.ok) {
        throw new Error('Falha ao carregar projetos');
      }
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
      showToast('Erro ao carregar projetos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (projectId: string, distributed: boolean = false) => {
    try {
      setExporting(projectId);
      const response = await fetch(`/api/projects/${projectId}/export${distributed ? '-distributed' : ''}`);
      if (!response.ok) {
        throw new Error('Falha ao exportar dados');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio${distributed ? '-distribuido' : ''}-${format(new Date(), 'yyyy-MM')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast('Exportação concluída com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      showToast('Erro ao exportar dados', 'error');
    } finally {
      setExporting(null);
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <h1 className="text-2xl font-bold">Exportar Relatório do Mês Atual</h1>
          <p className="text-muted-foreground mt-2">
            Selecione um projeto para exportar o relatório do mês de {format(new Date(), 'MMMM', { locale: ptBR })}.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="p-6">
              <div className="flex flex-col h-full">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{project.name}</h3>
                  {project.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {project.description}
                    </p>
                  )}
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    onClick={() => handleExport(project.id)}
                    disabled={!!exporting}
                    className="flex-1"
                  >
                    {exporting === project.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Exportando...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Exportar CSV
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => handleExport(project.id, true)}
                    disabled={!!exporting}
                    variant="outline"
                    className="flex-1"
                  >
                    {exporting === project.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Exportando...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Exportar Distribuído
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-96 mb-8" />
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array(6).fill(0).map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48 mb-4" />
              <Skeleton className="h-10 w-full" />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
} 