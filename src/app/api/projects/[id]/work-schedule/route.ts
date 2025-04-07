import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Buscando horários para o projeto:', params.id);
    
    const session = await getServerSession(authOptions);
    console.log('Sessão:', session ? 'Presente' : 'Ausente');
    console.log('ID do usuário:', session?.user?.id);
    
    if (!session?.user) {
      console.log('Usuário não autorizado');
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    console.log('Buscando projeto no banco de dados...');
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: { workSchedule: true }
    });
    console.log('Projeto encontrado:', project ? 'Sim' : 'Não');

    if (!project) {
      console.log('Projeto não encontrado');
      return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });
    }

    if (project.userId !== session.user.id) {
      console.log('Usuário não é dono do projeto');
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    console.log('Horários encontrados:', project.workSchedule.length);
    return NextResponse.json(project.workSchedule);
  } catch (error) {
    console.error('Erro ao buscar horários:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar horários de trabalho' },
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
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const project = await prisma.project.findUnique({
      where: { id: params.id }
    });

    if (!project) {
      return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });
    }

    if (project.userId !== session.user.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { dayOfWeek, startTime, endTime, isWorkDay } = body;

    const workSchedule = await prisma.workSchedule.create({
      data: {
        projectId: params.id,
        dayOfWeek,
        startTime,
        endTime,
        isWorkDay
      }
    });

    return NextResponse.json(workSchedule);
  } catch (error) {
    console.error('Erro ao criar horário:', error);
    return NextResponse.json(
      { error: 'Erro ao criar horário de trabalho' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const project = await prisma.project.findUnique({
      where: { id: params.id }
    });

    if (!project) {
      return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });
    }

    if (project.userId !== session.user.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { schedules } = body;

    // Deleta todos os horários existentes
    await prisma.workSchedule.deleteMany({
      where: { projectId: params.id }
    });

    // Cria os novos horários
    const workSchedules = await prisma.workSchedule.createMany({
      data: schedules.map((schedule: any) => ({
        projectId: params.id,
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        isWorkDay: schedule.isWorkDay
      }))
    });

    return NextResponse.json(workSchedules);
  } catch (error) {
    console.error('Erro ao atualizar horários:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar horários de trabalho' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Excluindo horários para o projeto:', params.id);
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log('Usuário não autorizado');
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const project = await prisma.project.findUnique({
      where: { id: params.id }
    });

    if (!project) {
      console.log('Projeto não encontrado');
      return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });
    }

    if (project.userId !== session.user.id) {
      console.log('Usuário não é dono do projeto');
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    // Excluir todos os horários do projeto
    await prisma.workSchedule.deleteMany({
      where: { projectId: params.id }
    });

    console.log('Horários excluídos com sucesso');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir horários:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir horários de trabalho' },
      { status: 500 }
    );
  }
} 