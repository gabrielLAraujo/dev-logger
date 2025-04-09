import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect('/');
  }

  // Buscar projetos do usuário
  const projects = await prisma.project.findMany({
    where: {
      user: {
        email: session.user.email
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 5
  });

  // Buscar commits recentes
  const recentCommits = await prisma.commit.findMany({
    where: {
      project: {
        user: {
          email: session.user.email
        }
      }
    },
    orderBy: {
      authorDate: 'desc'
    },
    take: 5,
    include: {
      project: {
        select: {
          name: true
        }
      }
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <div className="flex space-x-4">
            <Link 
              href="/projects/new" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Novo Projeto
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Projetos Recentes */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Projetos Recentes</h2>
                <Link href="/projects" className="text-sm text-indigo-600 hover:text-indigo-500">
                  Ver todos
                </Link>
              </div>
              
              {projects.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-500">Nenhum projeto encontrado</p>
                  <Link 
                    href="/projects/new" 
                    className="mt-2 inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500"
                  >
                    Criar primeiro projeto
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {projects.map((project) => (
                    <div key={project.id} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                      <Link href={`/projects/${project.id}`} className="block hover:bg-gray-50 p-2 rounded-md">
                        <h3 className="text-sm font-medium text-gray-900">{project.name}</h3>
                        <p className="mt-1 text-sm text-gray-500 line-clamp-2">{project.description || 'Sem descrição'}</p>
                        <div className="mt-2 flex items-center text-xs text-gray-500">
                          <span>Criado em {format(new Date(project.createdAt), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Commits Recentes */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Commits Recentes</h2>
                <Link href="/commits" className="text-sm text-indigo-600 hover:text-indigo-500">
                  Ver todos
                </Link>
              </div>
              
              {recentCommits.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-500">Nenhum commit encontrado</p>
                  <p className="mt-1 text-xs text-gray-400">Os commits aparecerão aqui quando você começar a fazer commits em seus projetos.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentCommits.map((commit) => (
                    <div key={commit.id} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                      <div className="p-2 rounded-md">
                        <h3 className="text-sm font-medium text-gray-900 line-clamp-1">{commit.message}</h3>
                        <div className="mt-1 flex items-center text-xs text-gray-500">
                          <span className="truncate">{commit.project.name}</span>
                          <span className="mx-2">•</span>
                          <span>{format(new Date(commit.authorDate), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 