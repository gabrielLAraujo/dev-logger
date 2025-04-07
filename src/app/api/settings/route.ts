import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log('Sessão:', session ? 'Presente' : 'Ausente');
    console.log('ID do usuário:', session?.user?.id);
    console.log('Token de acesso:', session?.accessToken ? 'Presente' : 'Ausente');

    if (!session?.user?.id) {
      console.log('Usuário não autorizado');
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    let settings = await prisma.userSettings.findUnique({
      where: {
        userId: session.user.id,
      },
    });

    console.log('Configurações encontradas:', settings ? 'Sim' : 'Não');

    if (!settings) {
      console.log('Configurações não encontradas para o usuário:', session.user.id);
      console.log('Criando configurações padrão...');
      
      // Cria configurações padrão para o usuário
      settings = await prisma.userSettings.create({
        data: {
          userId: session.user.id,
          workStartTime: '09:00',
          workEndTime: '18:00',
          workDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
          monitoredRepos: [],
        },
      });
      
      console.log('Configurações padrão criadas com sucesso');
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log('Sessão POST:', session ? 'Presente' : 'Ausente');
    console.log('ID do usuário POST:', session?.user?.id);
    console.log('Token de acesso POST:', session?.accessToken ? 'Presente' : 'Ausente');

    if (!session?.user?.id) {
      console.log('Usuário não autorizado (POST)');
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const data = await request.json();
    const { workStartTime, workEndTime, workDays, monitoredRepos } = data;

    const settings = await prisma.userSettings.upsert({
      where: {
        userId: session.user.id,
      },
      update: {
        workStartTime,
        workEndTime,
        workDays,
        monitoredRepos,
      },
      create: {
        userId: session.user.id,
        workStartTime: workStartTime || '09:00',
        workEndTime: workEndTime || '18:00',
        workDays: workDays || ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
        monitoredRepos: monitoredRepos || [],
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 