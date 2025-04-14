import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import DeleteProjectButton from '@/components/DeleteProjectButton';
import ProjectReport from '@/components/ProjectReport';

interface ProjectPageProps {
  params: {
    id: string;
  };
}

async function createDefaultWorkSchedules(projectId: string) {
  const defaultSchedules = [
    { dayOfWeek: 1, startTime: '07:00', endTime: '17:00', isWorkDay: true }, // Segunda
    { dayOfWeek: 2, startTime: '07:00', endTime: '17:00', isWorkDay: true }, // Terça
    { dayOfWeek: 3, startTime: '07:00', endTime: '17:00', isWorkDay: true }, // Quarta
    { dayOfWeek: 4, startTime: '07:00', endTime: '17:00', isWorkDay: true }, // Quinta
    { dayOfWeek: 5, startTime: '07:00', endTime: '17:00', isWorkDay: true }, // Sexta
    { dayOfWeek: 0, startTime: '09:00', endTime: '18:00', isWorkDay: false }, // Domingo
    { dayOfWeek: 6, startTime: '09:00', endTime: '18:00', isWorkDay: false }, // Sábado
  ];

  for (const schedule of defaultSchedules) {
    await prisma.workSchedule.upsert({
      where: {
        projectId_dayOfWeek: {
          projectId,
          dayOfWeek: schedule.dayOfWeek,
        },
      },
      update: schedule,
      create: {
        projectId,
        ...schedule,
      },
    });
  }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect('/auth/signin');
  }

  // Buscar o projeto e suas relações
  const project = await prisma.project.findUnique({
    where: {
      id: params.id,
      user: {
        email: session.user.email,
      },
    },
  });

  if (!project) {
    redirect('/projects');
  }

  // Buscar workSchedules e commits
  const [workSchedules, commits] = await Promise.all([
    prisma.workSchedule.findMany({
      where: {
        projectId: project.id,
      },
    }),
    prisma.commit.findMany({
      where: {
        projectId: project.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),
  ]);

  // Se não houver horários cadastrados, criar os horários padrão
  if (workSchedules.length === 0) {
    await createDefaultWorkSchedules(project.id);
    const updatedWorkSchedules = await prisma.workSchedule.findMany({
      where: {
        projectId: project.id,
      },
    });
    return renderProjectPage(project, updatedWorkSchedules, commits);
  }

  return renderProjectPage(project, workSchedules, commits);
}

function renderProjectPage(project: any, workSchedules: any[], commits: any[]) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link href="/projects" className="text-indigo-600 hover:text-indigo-900 text-sm font-medium mb-2 inline-block">
            ← Voltar para Projetos
          </Link>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          {project.description && (
            <p className="text-gray-500 mt-1">{project.description}</p>
          )}
        </div>
        <div className="flex space-x-3">
          <Link
            href={`/projects/${project.id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Editar Projeto
          </Link>
          <Link
            href={`/projects/${project.id}/reports`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Ver Relatórios
          </Link>
          <DeleteProjectButton projectId={project.id} />
        </div>
      </div>

      <div className="space-y-6">
        <ProjectReport 
          projectId={project.id}
          projectName={project.name}
          workSchedule={workSchedules}
          repositories={project.repositories}
        />
      </div>
    </div>
  );
} 