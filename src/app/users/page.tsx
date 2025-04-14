import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default async function UsersPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect('/auth/signin');
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      emailVerified: true,
      settings: {
        select: {
          githubToken: true,
          createdAt: true,
          updatedAt: true
        }
      },
      _count: {
        select: {
          Project: true
        }
      }
    },
    orderBy: {
      emailVerified: 'desc'
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {users.map((user) => (
              <li key={user.id} className="px-6 py-4">
                <div className="flex items-center">
                  {user.image && (
                    <img
                      src={user.image}
                      alt={user.name || 'Avatar'}
                      className="h-10 w-10 rounded-full"
                    />
                  )}
                  <div className="ml-4">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-gray-900">
                        {user.name || 'Sem nome'}
                      </p>
                      {user.emailVerified && (
                        <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Verificado
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{user.email}</p>
                    <div className="mt-1 text-sm text-gray-500">
                      <p>Projetos: {user._count.Project}</p>
                      {user.settings && (
                        <p>
                          Token GitHub configurado:{' '}
                          {user.settings.githubToken ? 'Sim' : 'Não'}
                        </p>
                      )}
                      {user.settings?.createdAt && (
                        <p>
                          Criado em:{' '}
                          {format(new Date(user.settings.createdAt), "dd 'de' MMMM 'de' yyyy", {
                            locale: ptBR
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
} 