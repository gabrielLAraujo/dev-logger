import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { format, parseISO } from 'date-fns';

async function fetchGithubCommits(repo: string, token: string, startDate?: string, endDate?: string) {
  // Garantir que o repositório está no formato correto (owner/repo)
  if (!repo.includes('/')) {
    throw new Error(`Formato de repositório inválido: ${repo}. O formato deve ser 'owner/repo'`);
  }

  const [owner, repoName] = repo.split('/');
  if (!owner || !repoName) {
    throw new Error(`Formato de repositório inválido: ${repo}. O formato deve ser 'owner/repo'`);
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repoName}/commits?per_page=100`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Erro na resposta do GitHub:', errorData);
    throw new Error(`Erro ao buscar commits do repositório ${repo}: ${errorData.message || 'Erro desconhecido'}`);
  }

  const commits = await response.json();
  
  // Filtrar commits por data, se fornecidas
  if (startDate && endDate) {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    
    return commits.filter((commit: any) => {
      const commitDate = new Date(commit.commit.author.date);
      return commitDate >= start && commitDate <= end;
    });
  }
  
  return commits;
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Obter parâmetros da URL
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!projectId) {
      return NextResponse.json(
        { error: 'ID do projeto não fornecido' },
        { status: 400 }
      );
    }

    // Buscar o projeto
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
        user: {
          email: session.user.email,
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Projeto não encontrado' },
        { status: 404 }
      );
    }

    // Buscar o token do GitHub do usuário
    const userSettings = await prisma.userSettings.findUnique({
      where: {
        userEmail: session.user.email,
      },
    });

    if (!userSettings?.githubToken) {
      return NextResponse.json(
        { error: 'Token do GitHub não configurado' },
        { status: 400 }
      );
    }

    // Buscar commits de cada repositório
    const allCommits: any[] = [];
    const errors: string[] = [];

    for (const repo of project.repositories) {
      try {
        const commits = await fetchGithubCommits(repo, userSettings.githubToken, startDate || undefined, endDate || undefined);
        allCommits.push(...commits);
      } catch (error) {
        console.error(`Erro ao buscar commits do repositório ${repo}:`, error);
        errors.push(`Erro ao buscar commits do repositório ${repo}`);
      }
    }

    // Organizar commits por data
    const commitsByDate: Record<string, any[]> = {};
    
    allCommits.forEach(commit => {
      const commitDate = new Date(commit.commit.author.date);
      if (isNaN(commitDate.getTime())) {
        console.warn('Data inválida encontrada:', commit.commit.author.date);
        return; // Pular este commit
      }
      const formattedDate = format(commitDate, 'dd/MM/yyyy');
      
      if (!commitsByDate[formattedDate]) {
        commitsByDate[formattedDate] = [];
      }
      
      commitsByDate[formattedDate].push({
        message: commit.commit.message,
        date: formattedDate
      });
    });

    // Validar atividades para cada data
    Object.keys(commitsByDate).forEach(formattedDate => {
      const validActivities = commitsByDate[formattedDate].filter((activity: any) => {
        try {
          const activityDate = new Date(activity.date);
          const createdAt = new Date(activity.createdAt);
          return !isNaN(activityDate.getTime()) && !isNaN(createdAt.getTime());
        } catch (error) {
          console.warn('Atividade com data inválida:', activity);
          return false;
        }
      });
    });

    return NextResponse.json(commitsByDate);
  } catch (error) {
    console.error('Erro ao buscar commits:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar commits' },
      { status: 500 }
    );
  }
} 