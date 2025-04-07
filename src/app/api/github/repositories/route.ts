import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    console.log('Iniciando busca de repositórios...');
    
    const session = await getServerSession(authOptions);
    console.log('Sessão:', session ? 'Presente' : 'Ausente');
    console.log('ID do usuário:', session?.user?.id);
    console.log('Token de acesso na sessão:', session?.accessToken ? 'Presente' : 'Ausente');
    
    if (!session?.user?.id) {
      console.log('Usuário não autorizado');
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    let accessToken = session.accessToken;

    if (!accessToken) {
      console.log('Token de acesso não encontrado na sessão, buscando do banco de dados...');
      
      const account = await prisma.account.findFirst({
        where: {
          userId: session.user.id,
          provider: 'github',
        },
      });

      if (!account?.access_token) {
        console.log('Token de acesso não encontrado no banco de dados');
        return NextResponse.json({ error: 'Token de acesso não encontrado' }, { status: 401 });
      }

      accessToken = account.access_token;
      console.log('Token de acesso encontrado no banco de dados');
    }

    // Verifica se há um projectId na query
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    // Se houver um projectId, retorna apenas os repositórios associados ao projeto
    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { 
          id: projectId,
          userId: session.user.id 
        },
        select: { repositories: true },
      });

      if (!project) {
        return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });
      }

      // Formata os repositórios para retornar apenas os dados necessários
      const formattedRepos = project.repositories.map(repo => ({
        id: repo,
        name: repo.split('/')[1],
        full_name: repo,
        description: '',
        html_url: `https://github.com/${repo}`,
      }));

      return NextResponse.json(formattedRepos);
    }

    console.log('Buscando repositórios do GitHub...');
    
    // Primeiro, vamos buscar os repositórios do usuário
    const userReposResponse = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100&visibility=all&affiliation=owner', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!userReposResponse.ok) {
      const errorData = await userReposResponse.json();
      console.error('Erro ao buscar repositórios do usuário:', errorData);
      console.error('Status da resposta:', userReposResponse.status);
      console.error('Headers da resposta:', Object.fromEntries(userReposResponse.headers.entries()));
      return NextResponse.json(
        { error: `Erro ao buscar repositórios: ${errorData.message || userReposResponse.statusText}` },
        { status: userReposResponse.status }
      );
    }

    const userRepos = await userReposResponse.json();
    console.log(`Encontrados ${userRepos.length} repositórios do usuário`);
    
    // Agora, vamos buscar os repositórios onde o usuário é colaborador
    const collaboratorReposResponse = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100&visibility=all&affiliation=collaborator', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!collaboratorReposResponse.ok) {
      const errorData = await collaboratorReposResponse.json();
      console.error('Erro ao buscar repositórios onde o usuário é colaborador:', errorData);
      console.error('Status da resposta:', collaboratorReposResponse.status);
      console.error('Headers da resposta:', Object.fromEntries(collaboratorReposResponse.headers.entries()));
      return NextResponse.json(
        { error: `Erro ao buscar repositórios: ${errorData.message || collaboratorReposResponse.statusText}` },
        { status: collaboratorReposResponse.status }
      );
    }

    const collaboratorRepos = await collaboratorReposResponse.json();
    console.log(`Encontrados ${collaboratorRepos.length} repositórios onde o usuário é colaborador`);
    
    // Combinando os repositórios e removendo duplicatas
    const allRepos = [...userRepos];
    
    // Adicionando repositórios de colaborador que não estão na lista de repositórios do usuário
    collaboratorRepos.forEach((repo: any) => {
      if (!allRepos.some(r => r.id === repo.id)) {
        allRepos.push(repo);
      }
    });
    
    // Formata os repositórios para retornar apenas os dados necessários
    const formattedRepos = allRepos.map(repo => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      html_url: repo.html_url,
    }));
    
    console.log(`Total de repositórios únicos: ${formattedRepos.length}`);
    
    return NextResponse.json(formattedRepos);
  } catch (error) {
    console.error('Erro ao buscar repositórios:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar repositórios' },
      { status: 500 }
    );
  }
} 