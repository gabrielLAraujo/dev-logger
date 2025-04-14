import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse('Não autorizado', { status: 401 });
    }

    const activities = await prisma.dailyActivity.findMany({
      where: {
        projectId: params.projectId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(activities);
  } catch (error) {
    console.error('Erro ao buscar atividades:', error);
    return new NextResponse('Erro interno do servidor', { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { description, date, status } = await request.json();

    if (!description || !date || !status) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
      });
    }

    if (!['pendente', 'em_andamento', 'concluido'].includes(status)) {
      return new Response(JSON.stringify({ error: 'Invalid status' }), {
        status: 400,
      });
    }

    const activity = await prisma.dailyActivity.create({
      data: {
        description,
        date: new Date(date),
        status,
        projectId: params.id,
      },
    });

    return new Response(JSON.stringify(activity), { status: 201 });
  } catch (error) {
    console.error('Error creating daily activity:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id, description, date, status } = await request.json();

    if (!id || !description || !date || !status) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
      });
    }

    if (!['pendente', 'em_andamento', 'concluido'].includes(status)) {
      return new Response(JSON.stringify({ error: 'Invalid status' }), {
        status: 400,
      });
    }

    const activity = await prisma.dailyActivity.update({
      where: { id },
      data: {
        description,
        date: new Date(date),
        status,
      },
    });

    return new Response(JSON.stringify(activity), { status: 200 });
  } catch (error) {
    console.error('Error updating daily activity:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse('Não autorizado', { status: 401 });
    }

    await prisma.dailyActivity.delete({
      where: {
        id: params.projectId,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Erro ao excluir atividade:', error);
    return new NextResponse('Erro interno do servidor', { status: 500 });
  }
} 