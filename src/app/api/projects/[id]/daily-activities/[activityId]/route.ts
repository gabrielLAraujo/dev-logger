import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; activityId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id: projectId, activityId } = params;
    const body = await request.json();
    const { status } = body;

    // Verificar se o projeto existe e pertence ao usuário
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });
    }

    // Verificar se a atividade existe e pertence ao projeto
    const activity = await prisma.dailyActivity.findFirst({
      where: {
        id: activityId,
        projectId: projectId,
      },
    });

    if (!activity) {
      return NextResponse.json({ error: 'Atividade não encontrada' }, { status: 404 });
    }

    // Atualizar o status da atividade
    const updatedActivity = await prisma.dailyActivity.update({
      where: {
        id: activityId,
      },
      data: {
        status,
      },
    });

    return NextResponse.json(updatedActivity);
  } catch (error) {
    console.error('Erro ao atualizar atividade:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar atividade' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; activityId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id: projectId, activityId } = params;

    // Verificar se o projeto existe e pertence ao usuário
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });
    }

    // Verificar se a atividade existe e pertence ao projeto
    const activity = await prisma.dailyActivity.findFirst({
      where: {
        id: activityId,
        projectId: projectId,
      },
    });

    if (!activity) {
      return NextResponse.json({ error: 'Atividade não encontrada' }, { status: 404 });
    }

    // Excluir a atividade
    await prisma.dailyActivity.delete({
      where: {
        id: activityId,
      },
    });

    return NextResponse.json({ message: 'Atividade excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir atividade:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir atividade' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string; activityId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { id, activityId } = params;
    const body = await request.json();
    const { status } = body;

    // Verificar se o status é válido
    if (!['pendente', 'em_andamento', 'concluido'].includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido' },
        { status: 400 }
      );
    }

    // Buscar o usuário pelo email
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o projeto existe e pertence ao usuário
    const project = await prisma.project.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Projeto não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se a atividade existe e pertence ao projeto
    const activity = await prisma.dailyActivity.findFirst({
      where: {
        id: activityId,
        projectId: id,
      },
    });

    if (!activity) {
      return NextResponse.json(
        { error: 'Atividade não encontrada' },
        { status: 404 }
      );
    }

    // Atualizar o status da atividade
    const updatedActivity = await prisma.dailyActivity.update({
      where: {
        id: activityId,
      },
      data: {
        status,
      },
    });

    return NextResponse.json(updatedActivity);
  } catch (error) {
    console.error('Erro ao atualizar status da atividade:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar status da atividade' },
      { status: 500 }
    );
  }
} 