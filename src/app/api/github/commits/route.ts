import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Octokit } from '@octokit/rest';
import { subDays } from 'date-fns';

export async function GET(request: Request) {
  try {
    console.log('Iniciando busca de commits...');
    
    const session = await getServerSession(authOptions);
    console.log('Sessão:', session ? 'Presente' : 'Ausente');
    console.log('ID do usuário:', session?.user?.id);
    
    if (!session?.user) {
      console.log('Usuário não autorizado');
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const repoParam = searchParams.get('repo');
    const repositoriesParam = searchParams.get('repositories');
    
    // Verifica se temos um repositório específico ou uma lista de repositórios
    let repositories: string[] = [];
    
    if (repositoriesParam) {
      // Se temos uma lista de repositórios, usamos ela
      repositories = repositoriesParam.split(',');
      console.log('Repositórios fornecidos:', repositories);
    } else if (repoParam) {
      // Se temos um único repositório, usamos ele
      repositories = [repoParam];
      console.log('Repositório fornecido:', repoParam);
    } else {
      console.log('Nenhum repositório fornecido');
      return NextResponse.json(
        { error: 'É necessário fornecer um repositório' },
        { status: 400 }
      );
    }
    
    if (repositories.length === 0) {
      console.log('Nenhum repositório encontrado');
      return NextResponse.json([]);
    }
    
    // Busca o token do GitHub
    let accessToken = session.accessToken;
    console.log('Token na sessão:', accessToken ? 'Presente' : 'Ausente');
    
    if (!accessToken) {
      console.log('Token não encontrado na sessão, buscando do banco de dados...');
      
      const account = await prisma.account.findFirst({
        where: {
          userId: session.user.id,
          provider: 'github',
        },
      });

      console.log('Conta encontrada:', account ? 'Sim' : 'Não');
      console.log('Token na conta:', account?.access_token ? 'Presente' : 'Ausente');
      console.log('Escopo do token:', account?.scope);

      if (!account?.access_token) {
        console.log('Token não encontrado no banco de dados');
        return NextResponse.json({ error: 'Token do GitHub não configurado' }, { status: 400 });
      }

      accessToken = account.access_token;
      console.log('Token encontrado no banco de dados');
    }
    
    // Inicializa o cliente do GitHub
    const octokit = new Octokit({
      auth: accessToken,
    });
    
    // Busca commits para todos os repositórios
    const thirtyDaysAgo = subDays(new Date(), 30);
    console.log('Buscando commits desde:', thirtyDaysAgo.toISOString());
    
    let allCommits: any[] = [];
    
    for (const repoParam of repositories) {
      // Verifica se o repositório está no formato correto
      if (!repoParam.includes('/')) {
        console.log('Formato de repositório inválido:', repoParam);
        continue;
      }
      
      const [owner, repo] = repoParam.split('/');
      console.log('Buscando commits para:', owner, repo);
      
      try {
        // Busca commits dos últimos 30 dias
        const { data: commits } = await octokit.repos.listCommits({
          owner,
          repo,
          since: thirtyDaysAgo.toISOString(),
          author: session.user.email || undefined,
        });
        
        console.log(`Encontrados ${commits.length} commits no repositório ${repoParam}`);
        
        // Formata os commits
        const formattedCommits = commits.map((commit: any) => ({
          id: commit.sha,
          message: commit.commit.message,
          date: commit.commit.author?.date || commit.commit.committer?.date,
          repository: repoParam,
          url: commit.html_url,
        }));
        
        allCommits = [...allCommits, ...formattedCommits];
      } catch (error: any) {
        console.error(`Erro ao buscar commits do repositório ${repoParam}:`, error);
        console.error('Detalhes do erro:', {
          message: error.message,
          status: error.status,
          response: error.response?.data
        });
        
        // Continua para o próximo repositório
        continue;
      }
    }
    
    // Ordena commits por data (mais recente primeiro)
    allCommits.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    console.log(`Total de commits encontrados: ${allCommits.length}`);
    return NextResponse.json(allCommits);
  } catch (error) {
    console.error('Erro ao buscar commits:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar commits. Por favor, tente novamente.' },
      { status: 500 }
    );
  }
} 