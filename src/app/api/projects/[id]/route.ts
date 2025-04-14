import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const project = await prisma.project.findUnique({
      where: {
        id: params.id,
        user: {
          email: session.user.email,
        },
      },
      include: {
        WorkSchedule: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Erro ao buscar projeto:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { name, description, repositories } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    }

    // Validar se o projeto pertence ao usuário
    const existingProject = await prisma.project.findUnique({
      where: {
        id: params.id,
        user: {
          email: session.user.email,
        },
      },
    });

    if (!existingProject) {
      return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });
    }

    const project = await prisma.project.update({
      where: {
        id: params.id,
      },
      data: {
        name,
        description,
        repositories: repositories || [],
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error('Erro ao atualizar projeto:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Validar se o projeto pertence ao usuário
    const project = await prisma.project.findUnique({
      where: {
        id: params.id,
        user: {
          email: session.user.email,
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });
    }

    // Deletar o projeto (as relações serão deletadas automaticamente devido ao onDelete: Cascade)
    await prisma.project.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({ message: 'Projeto deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar projeto:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 