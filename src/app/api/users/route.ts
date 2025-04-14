import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Buscar todos os usuários com suas configurações
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        emailVerified: true,
        settings: {
          select: {
            githubToken: true,
            createdAt: true,
            updatedAt: true
          }
        },
        _count: {
          select: {
            Project: true
          }
        }
      },
      orderBy: {
        emailVerified: 'desc'
      }
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Erro ao buscar usuários' },
      { status: 500 }
    );
  }
} 