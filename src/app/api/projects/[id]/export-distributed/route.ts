import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { format, startOfMonth, endOfMonth, parseISO, eachDayOfInterval, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Octokit } from '@octokit/rest';

interface Commit {
  id: string;
  message: string;
  date: string;
  repository: string;
  url: string;
  userId: string;
}

interface CommitsByDay {
  [date: string]: Commit[];
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        description: true,
        repositories: true,
        userId: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });
    }

    if (project.userId !== session.user.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar o token do GitHub
    let accessToken = session.accessToken;
    
    if (!accessToken) {
      const account = await prisma.account.findFirst({
        where: {
          userId: session.user.id,
          provider: 'github',
        },
      });

      if (!account?.access_token) {
        return NextResponse.json({ error: 'Token do GitHub não configurado' }, { status: 400 });
      }

      accessToken = account.access_token;
    }
    
    // Inicializa o cliente do GitHub
    const octokit = new Octokit({
      auth: accessToken,
    });
    
    // Definir período do mês atual
    const startDate = startOfMonth(new Date());
    const endDate = endOfMonth(new Date());
    
    // Buscar commits para todos os repositórios do projeto
    let allCommits: Commit[] = [];
    
    for (const repoParam of project.repositories) {
      if (!repoParam.includes('/')) {
        console.log('Formato de repositório inválido:', repoParam);
        continue;
      }
      
      const [owner, repo] = repoParam.split('/');
      
      try {
        const { data: commits } = await octokit.repos.listCommits({
          owner,
          repo,
          since: startDate.toISOString(),
          until: endDate.toISOString(),
          author: session.user.email || undefined,
        });
        
        const formattedCommits = commits.map((commit: any) => ({
          id: commit.sha,
          message: commit.commit.message,
          date: commit.commit.author?.date || commit.commit.committer?.date,
          repository: repoParam,
          url: commit.html_url,
          userId: session?.user?.id || 'unknown',
        }));
        
        allCommits = [...allCommits, ...formattedCommits];
      } catch (error: any) {
        console.error(`Erro ao buscar commits do repositório ${repoParam}:`, error);
        continue;
      }
    }

    // Gerar CSV
    const csvRows = [
      // Cabeçalho
      ['Data', 'Dia da Semana', 'Observação'].join(','),
    ];

    // Gerar array com todos os dias do mês
    const daysInMonth = eachDayOfInterval({
      start: startDate,
      end: endDate,
    });

    // Calcular o número total de commits
    const totalCommits = allCommits.length;
    
    // Calcular o número de dias no mês
    const daysInMonthCount = daysInMonth.length;
    
    // Calcular quantos commits devem ser distribuídos por dia
    const commitsPerDay = Math.ceil(totalCommits / daysInMonthCount);
    
    // Distribuir commits pelos dias
    const distributedCommits: CommitsByDay = {};
    
    // Inicializar todos os dias com array vazio
    daysInMonth.forEach(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      distributedCommits[dateStr] = [];
    });
    
    // Distribuir commits pelos dias
    allCommits.forEach((commit, index) => {
      const dayIndex = Math.floor(index / commitsPerDay);
      if (dayIndex < daysInMonthCount) {
        const date = daysInMonth[dayIndex];
        const dateStr = format(date, 'yyyy-MM-dd');
        distributedCommits[dateStr].push(commit);
      }
    });

    // Gerar uma linha para cada dia do mês
    daysInMonth.forEach(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayCommits = distributedCommits[dateStr] || [];
      
      // Formatar observações dos commits
      const observations = dayCommits.map(commit => {
        const commitTime = format(parseISO(commit.date), 'HH:mm');
        return `${commitTime} - ${commit.repository}: ${commit.message}`;
      }).join('\n');

      csvRows.push([
        format(date, 'dd/MM/yyyy'),
        format(date, 'EEEE', { locale: ptBR }),
        `"${observations}"`,
      ].join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=relatorio-distribuido-${format(new Date(), 'yyyy-MM')}.csv`,
      },
    });
  } catch (error) {
    console.error('Erro ao exportar dados:', error);
    return NextResponse.json(
      { error: 'Erro ao exportar dados' },
      { status: 500 }
    );
  }
} 