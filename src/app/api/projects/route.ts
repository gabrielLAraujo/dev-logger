import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  console.log('Iniciando GET /api/projects');
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

    console.log('Buscando projetos para o usuário:', session.user.id);
    const projects = await prisma.project.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    console.log('Projetos encontrados:', projects);

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Erro detalhado ao buscar projetos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar projetos' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  console.log('Iniciando POST /api/projects');
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
    const { name, description, repositories } = body;

    if (!name || !repositories || !Array.isArray(repositories)) {
      console.log('Dados inválidos:', { name, repositories });
      return NextResponse.json(
        { error: 'Dados inválidos' },
        { status: 400 }
      );
    }

    // Verifica se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    
    if (!user) {
      console.log('Usuário não encontrado:', session.user.id);
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }
    
    console.log('Usuário encontrado:', user);

    console.log('Criando projeto para o usuário:', session.user.id);
    const project = await prisma.project.create({
      data: {
        name,
        description,
        repositories,
        userId: session.user.id,
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    console.log('Projeto criado:', project);

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Erro detalhado ao criar projeto:', error);
    return NextResponse.json(
      { error: 'Erro ao criar projeto' },
      { status: 500 }
    );
  }
} 