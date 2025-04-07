'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Check, Clock, GitBranch, Search } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
}

interface WorkDay {
  dayOfWeek: number;
  dayName: string;
  isWorkDay: boolean;
  startTime: string;
  endTime: string;
}

export default function NewProjectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [filteredRepos, setFilteredRepos] = useState<Repository[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [workDays, setWorkDays] = useState<WorkDay[]>([
    { dayOfWeek: 0, dayName: 'Domingo', isWorkDay: false, startTime: '09:00', endTime: '18:00' },
    { dayOfWeek: 1, dayName: 'Segunda', isWorkDay: true, startTime: '09:00', endTime: '18:00' },
    { dayOfWeek: 2, dayName: 'Terça', isWorkDay: true, startTime: '09:00', endTime: '18:00' },
    { dayOfWeek: 3, dayName: 'Quarta', isWorkDay: true, startTime: '09:00', endTime: '18:00' },
    { dayOfWeek: 4, dayName: 'Quinta', isWorkDay: true, startTime: '09:00', endTime: '18:00' },
    { dayOfWeek: 5, dayName: 'Sexta', isWorkDay: true, startTime: '09:00', endTime: '18:00' },
    { dayOfWeek: 6, dayName: 'Sábado', isWorkDay: false, startTime: '09:00', endTime: '18:00' },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchRepositories();
    }
  }, [status, router]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredRepos(repositories);
    } else {
      const filtered = repositories.filter(repo => 
        repo.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        repo.full_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredRepos(filtered);
    }
  }, [searchTerm, repositories]);

  const fetchRepositories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/github/repositories');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao buscar repositórios');
      }
      
      const data = await response.json();
      setRepositories(data);
      setFilteredRepos(data);
    } catch (error) {
      console.error('Erro ao buscar repositórios:', error);
      setError('Não foi possível carregar os repositórios');
      showToast('Erro ao carregar repositórios', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRepoToggle = (repoFullName: string) => {
    setSelectedRepos(prev => 
      prev.includes(repoFullName)
        ? prev.filter(repo => repo !== repoFullName)
        : [...prev, repoFullName]
    );
  };

  const handleWorkDayToggle = (dayOfWeek: number) => {
    setWorkDays(prev => 
      prev.map(day => 
        day.dayOfWeek === dayOfWeek 
          ? { ...day, isWorkDay: !day.isWorkDay } 
          : day
      )
    );
  };

  const handleTimeChange = (dayOfWeek: number, field: 'startTime' | 'endTime', value: string) => {
    setWorkDays(prev => 
      prev.map(day => 
        day.dayOfWeek === dayOfWeek 
          ? { ...day, [field]: value } 
          : day
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!projectName) {
      setError('O nome do projeto é obrigatório');
      showToast('O nome do projeto é obrigatório', 'error');
      return;
    }
    
    if (selectedRepos.length === 0) {
      setError('Selecione pelo menos um repositório');
      showToast('Selecione pelo menos um repositório', 'error');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Criar o projeto
      const projectResponse = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: projectName,
          description: projectDescription,
          repositories: selectedRepos,
        }),
      });
      
      if (!projectResponse.ok) {
        const errorData = await projectResponse.json();
        throw new Error(errorData.error || 'Falha ao criar projeto');
      }
      
      const project = await projectResponse.json();
      
      // Criar os horários de trabalho
      const workSchedulePromises = workDays
        .filter(day => day.isWorkDay)
        .map(day => 
          fetch('/api/work-schedule', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              projectId: project.id,
              dayOfWeek: day.dayOfWeek,
              startTime: day.startTime,
              endTime: day.endTime,
              isWorkDay: day.isWorkDay,
            }),
          })
        );
      
      await Promise.all(workSchedulePromises);
      
      setSuccess(true);
      showToast('Projeto criado com sucesso!', 'success');
      
      // Redirecionar para o dashboard após 2 segundos
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Erro ao criar projeto:', error);
      setError('Não foi possível criar o projeto. Por favor, tente novamente.');
      showToast('Erro ao criar projeto', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">Novo Projeto</h1>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="mb-4 bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-700">
            Projeto criado com sucesso! Redirecionando para o dashboard...
          </AlertDescription>
        </Alert>
      )}
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <Card className="p-4">
            <h2 className="text-lg font-bold mb-3">Informações do Projeto</h2>
            
            <div className="mb-3">
              <Label htmlFor="projectName">Nome do Projeto</Label>
              <Input
                id="projectName"
                value={projectName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProjectName(e.target.value)}
                placeholder="Nome do projeto"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="projectDescription">Descrição</Label>
              <Textarea
                id="projectDescription"
                value={projectDescription}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setProjectDescription(e.target.value)}
                placeholder="Descrição do projeto (opcional)"
                className="h-24"
              />
            </div>
          </Card>
          
          <Card className="p-4">
            <h2 className="text-lg font-bold mb-3 flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Horário de Trabalho
            </h2>
            
            <div className="space-y-2">
              {workDays.map((day) => (
                <div key={day.dayOfWeek} className="flex items-center space-x-2">
                  <Checkbox
                    id={`day-${day.dayOfWeek}`}
                    checked={day.isWorkDay}
                    onCheckedChange={() => handleWorkDayToggle(day.dayOfWeek)}
                  />
                  <Label htmlFor={`day-${day.dayOfWeek}`} className="w-20 cursor-pointer">
                    {day.dayName}
                  </Label>
                  
                  {day.isWorkDay && (
                    <div className="flex items-center space-x-1">
                      <Input
                        type="time"
                        value={day.startTime}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleTimeChange(day.dayOfWeek, 'startTime', e.target.value)}
                        className="w-28"
                      />
                      <span className="text-xs">até</span>
                      <Input
                        type="time"
                        value={day.endTime}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleTimeChange(day.dayOfWeek, 'endTime', e.target.value)}
                        className="w-28"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
        
        <div>
          <Card className="p-4 h-full">
            <h2 className="text-lg font-bold mb-3 flex items-center">
              <GitBranch className="mr-2 h-5 w-5" />
              Repositórios
            </h2>
            
            <div className="mb-3 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar repositórios..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            {filteredRepos.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum repositório encontrado.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredRepos.map((repo) => (
                  <div key={repo.id} className="flex items-center space-x-2 p-2 hover:bg-muted rounded-lg">
                    <Checkbox
                      id={`repo-${repo.id}`}
                      checked={selectedRepos.includes(repo.full_name)}
                      onCheckedChange={() => handleRepoToggle(repo.full_name)}
                    />
                    <Label
                      htmlFor={`repo-${repo.id}`}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex items-center space-x-2">
                        <GitBranch className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{repo.full_name}</span>
                      </div>
                      {repo.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {repo.description}
                        </p>
                      )}
                    </Label>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-4 pt-3 border-t">
              <p className="text-sm text-gray-500">
                {selectedRepos.length} repositório{selectedRepos.length !== 1 ? 's' : ''} selecionado{selectedRepos.length !== 1 ? 's' : ''}
              </p>
            </div>
          </Card>
        </div>
        
        <div className="md:col-span-2 flex justify-end mt-4">
          <Button type="submit" disabled={loading}>
            {loading ? 'Criando...' : 'Criar Projeto'}
          </Button>
        </div>
      </form>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Skeleton className="h-8 w-48 mb-4" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <Card className="p-4">
            <Skeleton className="h-6 w-48 mb-3" />
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </Card>
          
          <Card className="p-4">
            <Skeleton className="h-6 w-48 mb-3" />
            <div className="space-y-2">
              {Array(7).fill(0).map((_, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-10 w-64" />
                </div>
              ))}
            </div>
          </Card>
        </div>
        
        <Card className="p-4">
          <Skeleton className="h-6 w-48 mb-3" />
          <Skeleton className="h-10 w-full mb-3" />
          <div className="space-y-2">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-center space-x-2">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-5 w-64" />
              </div>
            ))}
          </div>
        </Card>
        
        <div className="md:col-span-2 flex justify-end">
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </div>
  );
} 