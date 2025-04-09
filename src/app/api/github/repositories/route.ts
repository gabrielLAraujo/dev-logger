import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Busca o token do GitHub do usuário
    const userSettings = await prisma.userSettings.findUnique({
      where: {
        userEmail: session.user.email,
      },
    });

    if (!userSettings?.githubToken) {
      return NextResponse.json(
        { error: 'Token do GitHub não encontrado' },
        { status: 401 }
      );
    }

    // Busca os repositórios do GitHub
    const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
      headers: {
        Authorization: `token ${userSettings.githubToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro na API do GitHub:', errorData);
      return NextResponse.json(
        { error: 'Falha ao buscar repositórios do GitHub' },
        { status: response.status }
      );
    }

    const repositories = await response.json();

    return NextResponse.json(repositories);
  } catch (error) {
    console.error('Erro ao buscar repositórios:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar repositórios' },
      { status: 500 }
    );
  }
} 