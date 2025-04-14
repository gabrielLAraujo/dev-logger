import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect('/auth/signin');
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Meus Projetos</h1>
        <Link
          href="/projects/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Novo Projeto
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum projeto encontrado</h3>
          <p className="text-gray-500 mb-6">Crie seu primeiro projeto para começar a registrar seus commits.</p>
          <Link
            href="/projects/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Criar Projeto
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div key={project.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">{project.name}</h3>
                {project.description && (
                  <p className="text-sm text-gray-500 mb-4">{project.description}</p>
                )}
                
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Repositórios</h4>
                  <div className="space-y-1">
                    {project.repositories.map((repo, index) => (
                      <div key={index} className="text-sm text-gray-600">
                        {repo}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Horário de Trabalho</h4>
                  <div className="space-y-1">
                    {project.WorkSchedule.map((schedule) => {
                      const weekDays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
                      return (
                        <div key={schedule.id} className="text-sm text-gray-600">
                          {weekDays[schedule.dayOfWeek]}: {schedule.startTime} - {schedule.endTime}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <Link
                    href={`/projects/${project.id}`}
                    className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                  >
                    Ver Detalhes →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 