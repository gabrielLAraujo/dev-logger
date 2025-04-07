'use client';

import { useEffect, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Github } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Função para verificar as variáveis de ambiente
function logEnvironmentVariables(context: string) {
  console.log(`[${context}] Variáveis de ambiente:`, {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    GITHUB_ID: process.env.GITHUB_ID,
    GITHUB_SECRET: process.env.GITHUB_SECRET ? 'Definido' : 'Não definido',
    AUTH_REDIRECT_URL: process.env.AUTH_REDIRECT_URL,
    NODE_ENV: process.env.NODE_ENV,
    BASE_URL: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : process.env.NEXTAUTH_URL,
  });
}

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    logEnvironmentVariables('Session Status Change');
    console.log('Status da sessão:', status);
    console.log('Dados da sessão:', session);
    
    if (status === 'authenticated') {
      console.log('Usuário autenticado, redirecionando para o dashboard...', {
        session: JSON.stringify(session, null, 2)
      });
      window.location.href = '/dashboard';
    }
  }, [status, session]);

  useEffect(() => {
    if (error) {
      logEnvironmentVariables('Error Handler');
      console.error('Erro de autenticação:', {
        error,
        searchParams: Object.fromEntries(searchParams.entries())
      });
      
      const errorMessages: Record<string, string> = {
        OAuthAccountNotLinked: 'Esta conta do GitHub já está vinculada a outro usuário.',
        OAuthSignin: 'Erro ao iniciar o processo de autenticação com o GitHub. Verifique se as configurações do GitHub OAuth estão corretas.',
        OAuthCallback: 'Erro ao processar a resposta do GitHub. Verifique se as configurações do GitHub OAuth estão corretas.',
        OAuthCreateAccount: 'Não foi possível criar uma conta com o GitHub.',
        EmailCreateAccount: 'Não foi possível criar uma conta com o email fornecido.',
        Callback: 'Erro ao processar a autenticação.',
        Default: 'Ocorreu um erro ao fazer login. Tente novamente.'
      };

      setErrorMessage(errorMessages[error] || errorMessages.Default);
    }
  }, [error, searchParams]);

  const handleGitHubLogin = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      
      logEnvironmentVariables('GitHub Login');
      console.log('Iniciando login com GitHub...', {
        callbackUrl: '/dashboard',
        redirect: true,
        env: {
          NEXTAUTH_URL: process.env.NEXTAUTH_URL,
          GITHUB_ID: process.env.GITHUB_ID,
          AUTH_REDIRECT_URL: process.env.AUTH_REDIRECT_URL,
          VERCEL_URL: process.env.VERCEL_URL,
          BASE_URL: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : process.env.NEXTAUTH_URL,
        }
      });
      
      const result = await signIn('github', { 
        callbackUrl: '/dashboard',
        redirect: true
      });
      
      console.log('Resultado do login:', result);
      
      if (!result) {
        console.error('Resultado do login é undefined');
        setErrorMessage('Erro ao iniciar o processo de login. Verifique as configurações do GitHub OAuth.');
      }
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      setErrorMessage('Ocorreu um erro ao fazer login. Tente novamente.');
    } finally {
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