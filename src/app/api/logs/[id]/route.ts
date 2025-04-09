import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const data = await request.json();
    const { content, type } = data;

    if (!content) {
      return NextResponse.json(
        { error: 'Conteúdo é obrigatório' },
        { status: 400 }
      );
    }

    // Verifica se o log pertence a um projeto do usuário
    const log = await prisma.$queryRaw`
      SELECT l.*, p."userId" as "projectUserId"
      FROM "Log" l
      JOIN "Project" p ON l."projectId" = p.id
      WHERE l.id = ${params.id}
    `;

    if (!log || !Array.isArray(log) || log.length === 0) {
      return NextResponse.json(
        { error: 'Log não encontrado' },
        { status: 404 }
      );
    }

    const logData = log[0] as any;
    if (logData.projectUserId !== session.user.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const updatedLog = await prisma.$executeRaw`
      UPDATE "Log"
      SET content = ${content}, type = ${type || logData.type}
      WHERE id = ${params.id}
      RETURNING *
    `;

    return NextResponse.json(updatedLog);
  } catch (error) {
    console.error('Erro ao atualizar log:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar log' },
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

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Verifica se o log pertence a um projeto do usuário
    const log = await prisma.$queryRaw`
      SELECT l.*, p."userId" as "projectUserId"
      FROM "Log" l
      JOIN "Project" p ON l."projectId" = p.id
      WHERE l.id = ${params.id}
    `;

    if (!log || !Array.isArray(log) || log.length === 0) {
      return NextResponse.json(
        { error: 'Log não encontrado' },
        { status: 404 }
      );
    }

    const logData = log[0] as any;
    if (logData.projectUserId !== session.user.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    await prisma.$executeRaw`
      DELETE FROM "Log"
      WHERE id = ${params.id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar log:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar log' },
      { status: 500 }
    );
  }
} 