import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import GitHubLoginButton from '@/components/GitHubLoginButton';

export default async function SignInPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Entre na sua conta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ou{' '}
            <a href="/" className="font-medium text-indigo-600 hover:text-indigo-500">
              volte para a página inicial
            </a>
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <div className="flex justify-center">
            <GitHubLoginButton />
          </div>
        </div>
      </div>
    </div>
  );
} 