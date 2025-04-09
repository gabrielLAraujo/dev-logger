import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function fetchGithubCommits(repo: string, token: string) {
  const response = await fetch(`https://api.github.com/repos/${repo}/commits`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    throw new Error(`Erro ao buscar commits do repositório ${repo}`);
  }

  return response.json();
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const project = await prisma.project.findFirst({
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

    const allCommits = [];

    for (const repo of project.repositories) {
      try {
        const commits = await fetchGithubCommits(repo, userSettings.githubToken);
        allCommits.push(...commits);
      } catch (error) {
        console.error(`Erro ao buscar commits do repositório ${repo}:`, error);
      }
    }

    // Ordenar commits por data (mais recentes primeiro)
    allCommits.sort((a, b) => 
      new Date(b.commit.author.date).getTime() - new Date(a.commit.author.date).getTime()
    );

    return NextResponse.json(allCommits);
  } catch (error) {
    console.error('Erro ao buscar commits:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar commits' },
      { status: 500 }
    );
  }
} 