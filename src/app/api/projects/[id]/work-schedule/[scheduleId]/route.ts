import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: { id: string; scheduleId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { id, scheduleId } = params;
    const body = await request.json();
    const { startTime, endTime, isWorkDay } = body;

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

    // Verificar se o horário de trabalho existe e pertence ao projeto
    const workSchedule = await prisma.workSchedule.findFirst({
      where: {
        id: scheduleId,
        projectId: id,
      },
    });

    if (!workSchedule) {
      return NextResponse.json(
        { error: 'Horário de trabalho não encontrado' },
        { status: 404 }
      );
    }

    // Atualizar o horário de trabalho
    const updatedWorkSchedule = await prisma.workSchedule.update({
      where: {
        id: scheduleId,
      },
      data: {
        startTime,
        endTime,
        isWorkDay,
      },
    });

    return NextResponse.json(updatedWorkSchedule);
  } catch (error) {
    console.error('Erro ao atualizar horário de trabalho:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar horário de trabalho' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; scheduleId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { id, scheduleId } = params;

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

    // Verificar se o horário de trabalho existe e pertence ao projeto
    const workSchedule = await prisma.workSchedule.findFirst({
      where: {
        id: scheduleId,
        projectId: id,
      },
    });

    if (!workSchedule) {
      return NextResponse.json(
        { error: 'Horário de trabalho não encontrado' },
        { status: 404 }
      );
    }

    // Deletar o horário de trabalho
    await prisma.workSchedule.delete({
      where: {
        id: scheduleId,
      },
    });

    return NextResponse.json({ message: 'Horário de trabalho removido com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar horário de trabalho:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar horário de trabalho' },
      { status: 500 }
    );
  }
} 