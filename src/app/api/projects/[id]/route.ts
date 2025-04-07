import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const project = await prisma.project.findUnique({
      where: {
        id: params.id,
      },
      select: {
        id: true,
        name: true,
        description: true,
        repositories: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Projeto não encontrado' },
        { status: 404 }
      );
    }

    if (project.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Erro ao buscar projeto:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar projeto' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const project = await prisma.project.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Projeto não encontrado' },
        { status: 404 }
      );
    }

    if (project.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      );
    }

    await prisma.project.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir projeto:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir projeto' },
      { status: 500 }
    );
  }
} 