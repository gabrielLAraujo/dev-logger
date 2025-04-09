import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function fetchGithubCommits(repo: string, token: string) {
  const [owner, repoName] = repo.split('/');
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
    throw new Error(`Erro ao buscar commits do repositório ${repo}`);
  }

  return response.json();
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar o projeto e verificar se pertence ao usuário
    const project = await prisma.project.findUnique({
      where: {
        id: params.id,
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

    const addedCommits = [];
    const errors = [];

    // Buscar commits de cada repositório
    for (const repo of project.repositories) {
      try {
        const commits = await fetchGithubCommits(repo, userSettings.githubToken);

        // Salvar cada commit no banco
        for (const commit of commits) {
          try {
            const commitData = {
              sha: commit.sha,
              message: commit.commit.message,
              authorName: commit.commit.author.name,
              authorDate: new Date(commit.commit.author.date),
              htmlUrl: commit.html_url,
              projectId: project.id,
            };

            await prisma.commit.upsert({
              where: {
                sha_projectId: {
                  sha: commitData.sha,
                  projectId: commitData.projectId,
                },
              },
              update: commitData,
              create: commitData,
            });

            addedCommits.push(commitData);
          } catch (error) {
            console.error(`Erro ao salvar commit ${commit.sha}:`, error);
            errors.push(`Erro ao salvar commit ${commit.sha}`);
          }
        }
      } catch (error) {
        console.error(`Erro ao buscar commits do repositório ${repo}:`, error);
        errors.push(`Erro ao buscar commits do repositório ${repo}`);
      }
    }

    return NextResponse.json({
      message: 'Sincronização concluída',
      addedCommits: addedCommits.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Erro ao sincronizar commits:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 