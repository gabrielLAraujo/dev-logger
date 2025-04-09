import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const userSettings = await prisma.userSettings.findUnique({
      where: {
        userEmail: session.user.email,
      },
    });

    if (!userSettings) {
      return NextResponse.json({ error: 'Configurações não encontradas' }, { status: 404 });
    }

    return NextResponse.json(userSettings);
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { githubToken } = await req.json();

    if (!githubToken) {
      return NextResponse.json({ error: 'Token é obrigatório' }, { status: 400 });
    }

    // Validar o token do GitHub
    const githubResponse = await fetch('https://api.github.com/user', {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        Authorization: `token ${githubToken}`,
      },
    });

    if (!githubResponse.ok) {
      const errorData = await githubResponse.json();
      console.error('Erro na validação do token GitHub:', errorData);
      return NextResponse.json({ 
        error: 'Token inválido ou sem permissões necessárias',
        details: errorData.message 
      }, { status: 400 });
    }

    try {
      const userSettings = await prisma.userSettings.upsert({
        where: {
          userEmail: session.user.email
        },
        update: {
          githubToken
        },
        create: {
          userEmail: session.user.email,
          githubToken
        }
      });

      return NextResponse.json({ 
        message: 'Token salvo com sucesso',
        settings: userSettings 
      });
    } catch (dbError) {
      console.error('Erro ao salvar no banco:', dbError);
      return NextResponse.json({ 
        error: 'Erro ao salvar token no banco de dados' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 