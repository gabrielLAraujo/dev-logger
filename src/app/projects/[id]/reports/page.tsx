import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { format, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';
import ProjectReport from '@/components/ProjectReport';

interface ReportsPageProps {
  params: {
    id: string;
  };
}

export default async function ReportsPage({ params }: ReportsPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect('/auth/signin');
  }

  const project = await prisma.project.findUnique({
    where: {
      id: params.id,
      user: {
        email: session.user.email,
      },
    },
    include: {
      WorkSchedule: true,
      commits: {
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  if (!project) {
    redirect('/projects');
  }

  const firstDayOfMonth = startOfMonth(new Date());

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link href={`/projects/${project.id}`} className="text-indigo-600 hover:text-indigo-900 text-sm font-medium mb-2 inline-block">
            ← Voltar para Projeto
          </Link>
          <h1 className="text-2xl font-bold">Relatório de Trabalho - {project.name}</h1>
          <p className="text-gray-500 mt-1">
            {format(firstDayOfMonth, "MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
      </div>

      <ProjectReport 
        projectName={project.name}
        WorkSchedule={project.WorkSchedule}
        repositories={project.repositories}
        projectId={project.id}
      />
    </div>
  );
} 