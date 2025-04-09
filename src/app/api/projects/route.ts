import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createProjectSchema = z.object({
  name: z.string()
    .min(1, 'O nome do projeto é obrigatório')
    .max(100, 'O nome do projeto não pode ter mais de 100 caracteres')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'O nome do projeto só pode conter letras, números, espaços, hífens e underscores'),
  description: z.string()
    .max(500, 'A descrição não pode ter mais de 500 caracteres')
    .nullable(),
  repositories: z.array(z.string())
    .min(1, 'Selecione pelo menos um repositório')
    .refine((repos) => repos.every((repo) => /^[a-zA-Z0-9\-_]+\/[a-zA-Z0-9\-_]+$/.test(repo)), {
      message: 'Formato inválido de repositório. Use o formato: owner/repo',
    }),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await req.json();
    
    // Validação dos dados
    const validationResult = createProjectSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err: z.ZodError['errors'][0]) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      
      return NextResponse.json(
        { error: 'Dados inválidos', details: errors },
        { status: 400 }
      );
    }

    const { name, description, repositories } = validationResult.data;

    // Busca o usuário pelo email
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

    // Verifica se já existe um projeto com o mesmo nome para o usuário
    const existingProject = await prisma.project.findFirst({
      where: {
        name,
        userId: user.id,
      },
    });

    if (existingProject) {
      return NextResponse.json(
        { error: 'Já existe um projeto com este nome' },
        { status: 400 }
      );
    }

    // Verifica se os repositórios existem e pertencem ao usuário
    const userSettings = await prisma.userSettings.findUnique({
      where: {
        userEmail: session.user.email,
      },
    });

    if (!userSettings?.githubToken) {
      return NextResponse.json(
        { error: 'Token do GitHub não configurado' },
        { status: 400 }
      );
    }

    const invalidRepos = [];
    for (const repo of repositories) {
      const [owner, repoName] = repo.split('/');
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repoName}`,
        {
          headers: {
            Authorization: `Bearer ${userSettings.githubToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );

      if (!response.ok) {
        invalidRepos.push(repo);
      }
    }

    if (invalidRepos.length > 0) {
      return NextResponse.json(
        { 
          error: 'Repositórios inválidos ou inacessíveis',
          details: invalidRepos.map(repo => ({
            field: 'repositories',
            message: `O repositório ${repo} não existe ou você não tem acesso a ele`,
          })),
        },
        { status: 400 }
      );
    }

    // Cria o projeto
    const project = await prisma.project.create({
      data: {
        name,
        description,
        repositories,
        userId: user.id,
      },
      include: {
        WorkSchedule: true,
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error('Erro ao criar projeto:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor ao criar projeto' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const projects = await prisma.project.findMany({
      where: {
        user: {
          email: session.user.email,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        WorkSchedule: true,
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Erro ao buscar projetos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar projetos' },
      { status: 500 }
    );
  }
} 