import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import GitHubLoginButton from '@/components/GitHubLoginButton';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
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
            <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-300">
              <div className="p-6">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Projetos</h3>
                <p className="mt-2 text-base text-gray-500">
                  Gerencie seus projetos e acompanhe o progresso de cada um. Organize repositórios e defina horários de trabalho.
                </p>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-300">
              <div className="p-6">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Commits</h3>
                <p className="mt-2 text-base text-gray-500">
                  Registre e visualize todos os seus commits em um só lugar. Sincronize automaticamente com o GitHub.
                </p>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-300">
              <div className="p-6">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Relatórios</h3>
                <p className="mt-2 text-base text-gray-500">
                  Acompanhe sua produtividade com relatórios detalhados. Exporte dados para análise.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 bg-indigo-50 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">
            Como Funciona
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-indigo-500 text-white mx-auto mb-4">
                1
              </div>
              <h3 className="text-lg font-medium text-gray-900">Conecte-se</h3>
              <p className="mt-2 text-base text-gray-500">
                Faça login com sua conta do GitHub para começar.
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-indigo-500 text-white mx-auto mb-4">
                2
              </div>
              <h3 className="text-lg font-medium text-gray-900">Crie Projetos</h3>
              <p className="mt-2 text-base text-gray-500">
                Adicione seus repositórios e defina horários de trabalho.
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-indigo-500 text-white mx-auto mb-4">
                3
              </div>
              <h3 className="text-lg font-medium text-gray-900">Acompanhe</h3>
              <p className="mt-2 text-base text-gray-500">
                Visualize seus commits e gere relatórios de produtividade.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 