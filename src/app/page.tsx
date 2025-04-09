import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import GitHubLoginButton from '@/components/GitHubLoginButton';
import { authOptions } from './api/auth/[...nextauth]/route';

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect('/projects');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Dev Logger
          </h1>
          <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
            Registre e acompanhe seus commits e projetos de desenvolvimento de forma simples e eficiente.
          </p>
          <div className="mt-8 flex justify-center">
            <GitHubLoginButton />
          </div>
        </div>

        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Recursos Principais
          </h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900">Projetos</h3>
                <p className="mt-2 text-base text-gray-500">
                  Gerencie seus projetos e acompanhe o progresso de cada um.
                </p>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900">Commits</h3>
                <p className="mt-2 text-base text-gray-500">
                  Registre e visualize todos os seus commits em um só lugar.
                </p>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900">Relatórios</h3>
                <p className="mt-2 text-base text-gray-500">
                  Acompanhe sua produtividade com relatórios detalhados.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 