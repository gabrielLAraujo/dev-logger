'use client';

import { useEffect, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Github } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      console.log('Usuário autenticado, redirecionando para o dashboard...');
      window.location.href = '/dashboard';
    }
  }, [status]);

  useEffect(() => {
    if (error) {
      console.error('Erro de autenticação:', error);
      setErrorMessage(
        error === 'OAuthAccountNotLinked' 
          ? 'Esta conta do GitHub já está vinculada a outro usuário.'
          : error === 'OAuthSignin'
          ? 'Erro ao iniciar o processo de autenticação com o GitHub.'
          : error === 'OAuthCallback'
          ? 'Erro ao processar a resposta do GitHub. Verifique se as configurações do GitHub OAuth estão corretas.'
          : error === 'OAuthCreateAccount'
          ? 'Não foi possível criar uma conta com o GitHub.'
          : error === 'EmailCreateAccount'
          ? 'Não foi possível criar uma conta com o email fornecido.'
          : error === 'Callback'
          ? 'Erro ao processar a autenticação.'
          : 'Ocorreu um erro ao fazer login. Tente novamente.'
      );
    }
  }, [error]);

  const handleGitHubLogin = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      console.log('Iniciando login com GitHub...');
      await signIn('github', { 
        callbackUrl: '/dashboard',
        redirect: true
      });
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      setErrorMessage('Ocorreu um erro ao fazer login. Tente novamente.');
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm p-6">
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-10 w-full" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm p-6">
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-2xl font-bold">Dev Logger</h1>
          <p className="text-center text-sm text-muted-foreground">
            Faça login com sua conta do GitHub para começar a rastrear seus commits.
          </p>
          {errorMessage && (
            <p className="text-sm text-red-500">
              {errorMessage}
            </p>
          )}
          <Button
            onClick={handleGitHubLogin}
            className="w-full"
            disabled={isLoading}
          >
            <Github className="mr-2 h-5 w-5" />
            {isLoading ? 'Entrando...' : 'Entrar com GitHub'}
          </Button>
        </div>
      </Card>
    </div>
  );
} 