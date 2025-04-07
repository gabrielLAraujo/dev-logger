'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Github } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

function LoginContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (error) {
      const errorMessages: Record<string, string> = {
        OAuthAccountNotLinked: 'Esta conta do GitHub já está vinculada a outro usuário.',
        OAuthSignin: 'Erro ao iniciar o processo de autenticação com o GitHub.',
        OAuthCallback: 'Erro ao processar a resposta do GitHub.',
        OAuthCreateAccount: 'Não foi possível criar uma conta com o GitHub.',
        EmailCreateAccount: 'Não foi possível criar uma conta com o email fornecido.',
        Callback: 'Erro ao processar a autenticação.',
        Default: 'Ocorreu um erro ao fazer login. Tente novamente.'
      };

      setErrorMessage(errorMessages[error] || errorMessages.Default);
      setIsLoading(false);
    }
  }, [error]);

  const handleGitHubLogin = () => {
    setIsLoading(true);
    setErrorMessage(null);
    signIn('github', { callbackUrl: '/dashboard' });
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Skeleton className="h-12 w-12 rounded-full mx-auto" />
          <Skeleton className="h-4 w-48 mt-4 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Bem-vindo ao Dev Logger</h1>
          <p className="text-gray-600 mt-2">Faça login para continuar</p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {errorMessage}
          </div>
        )}

        <Button
          onClick={handleGitHubLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2"
        >
          <Github className="h-5 w-5" />
          {isLoading ? 'Entrando...' : 'Entrar com GitHub'}
        </Button>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Skeleton className="h-12 w-12 rounded-full mx-auto" />
          <Skeleton className="h-4 w-48 mt-4 mx-auto" />
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
} 