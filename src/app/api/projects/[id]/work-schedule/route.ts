import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { WorkSchedule } from '@/types/work-schedule';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      );
    }

    const projectId = params.id;

    // Verifica se o projeto existe e pertence ao usuário
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { message: 'Projeto não encontrado' },
        { status: 404 }
      );
    }

    // Busca os horários do projeto
    const schedules = await prisma.workSchedule.findMany({
      where: {
        projectId,
      },
      orderBy: {
        dayOfWeek: 'asc',
      },
    });

    return NextResponse.json(schedules);
  } catch (error) {
    console.error('Erro ao buscar grade de horários:', error);
    return NextResponse.json(
      { message: 'Erro ao buscar grade de horários' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      );
    }

    const projectId = params.id;
    const { schedules } = await request.json() as { schedules: WorkSchedule[] };

    // Verifica se o projeto existe e pertence ao usuário
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { message: 'Projeto não encontrado' },
        { status: 404 }
      );
    }

    // Deleta os horários existentes
    await prisma.workSchedule.deleteMany({
      where: {
        projectId,
      },
    });

    // Cria os novos horários
    const createdSchedules = await prisma.workSchedule.createMany({
      data: schedules.map(schedule => ({
        projectId,
        dayOfWeek: schedule.dayOfWeek,
        isWorkDay: schedule.isWorkDay,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
      })),
    });

    return NextResponse.json(createdSchedules);
  } catch (error) {
    console.error('Erro ao salvar grade de horários:', error);
    return NextResponse.json(
      { message: 'Erro ao salvar grade de horários' },
      { status: 500 }
    );
  }
} 