import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  console.log('Iniciando GET /api/work-schedule');
  try {
    const session = await getServerSession(authOptions);
    console.log('Session:', session);

    if (!session?.user?.id) {
      console.log('Usuário não autenticado');
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      console.log('ID do projeto não fornecido');
      return NextResponse.json(
        { error: 'ID do projeto é obrigatório' },
        { status: 400 }
      );
    }

    // Verifica se o projeto pertence ao usuário
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      console.log('Projeto não encontrado:', projectId);
      return NextResponse.json(
        { error: 'Projeto não encontrado' },
        { status: 404 }
      );
    }

    if (project.userId !== session.user.id) {
      console.log('Usuário não é dono do projeto');
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      );
    }

    console.log('Buscando horários de trabalho para o projeto:', projectId);
    const workSchedules = await prisma.workSchedule.findMany({
      where: {
        projectId,
      },
      orderBy: {
        dayOfWeek: 'asc',
      },
    });
    console.log('Horários de trabalho encontrados:', workSchedules);

    return NextResponse.json(workSchedules);
  } catch (error) {
    console.error('Erro detalhado ao buscar horários de trabalho:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar horários de trabalho' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  console.log('Iniciando POST /api/work-schedule');
  try {
    const session = await getServerSession(authOptions);
    console.log('Session:', session);

    if (!session?.user?.id) {
      console.log('Usuário não autenticado');
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('Dados recebidos:', body);
    const { projectId, dayOfWeek, startTime, endTime, isWorkDay } = body;

    if (!projectId || dayOfWeek === undefined || !startTime || !endTime) {
      console.log('Dados inválidos:', { projectId, dayOfWeek, startTime, endTime });
      return NextResponse.json(
        { error: 'Dados inválidos' },
        { status: 400 }
      );
    }

    // Verifica se o projeto pertence ao usuário
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      console.log('Projeto não encontrado:', projectId);
      return NextResponse.json(
        { error: 'Projeto não encontrado' },
        { status: 404 }
      );
    }

    if (project.userId !== session.user.id) {
      console.log('Usuário não é dono do projeto');
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      );
    }

    // Verifica se já existe um horário para este dia
    const existingSchedule = await prisma.workSchedule.findUnique({
      where: {
        projectId_dayOfWeek: {
          projectId,
          dayOfWeek,
        },
      },
    });

    let workSchedule;

    if (existingSchedule) {
      console.log('Atualizando horário de trabalho existente:', existingSchedule.id);
      workSchedule = await prisma.workSchedule.update({
        where: {
          id: existingSchedule.id,
        },
        data: {
          startTime,
          endTime,
          isWorkDay: isWorkDay !== undefined ? isWorkDay : existingSchedule.isWorkDay,
        },
      });
    } else {
      console.log('Criando novo horário de trabalho');
      workSchedule = await prisma.workSchedule.create({
        data: {
          projectId,
          dayOfWeek,
          startTime,
          endTime,
          isWorkDay: isWorkDay !== undefined ? isWorkDay : true,
        },
      });
    }

    console.log('Horário de trabalho salvo:', workSchedule);
    return NextResponse.json(workSchedule, { status: 201 });
  } catch (error) {
    console.error('Erro detalhado ao salvar horário de trabalho:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar horário de trabalho' },
      { status: 500 }
    );
  }
} 