import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });
    }

    const data = await request.json();
    const { dayOfWeek, startTime, endTime, isWorkDay } = data;

    if (typeof dayOfWeek !== 'number' || dayOfWeek < 0 || dayOfWeek > 6) {
      return NextResponse.json(
        { error: 'Dia da semana inválido' },
        { status: 400 }
      );
    }

    if (!startTime || !endTime) {
      return NextResponse.json(
        { error: 'Horário de início e término são obrigatórios' },
        { status: 400 }
      );
    }

    const workSchedule = await prisma.workSchedule.upsert({
      where: {
        projectId_dayOfWeek: {
          projectId: project.id,
          dayOfWeek,
        },
      },
      update: {
        startTime,
        endTime,
        isWorkDay,
      },
      create: {
        projectId: project.id,
        dayOfWeek,
        startTime,
        endTime,
        isWorkDay,
      },
    });

    return NextResponse.json(workSchedule);
  } catch (error) {
    console.error('Erro ao salvar horário de trabalho:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar horário de trabalho' },
      { status: 500 }
    );
  }
}

export async function GET(
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

    // Buscar todos os horários de trabalho do projeto
    const workSchedules = await prisma.workSchedule.findMany({
      where: {
        projectId: params.id,
      },
      orderBy: {
        dayOfWeek: 'asc',
      },
    });

    return NextResponse.json(workSchedules);
  } catch (error) {
    console.error('Erro ao buscar horários de trabalho:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 