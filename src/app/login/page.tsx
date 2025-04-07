'use client';

import { useEffect } from 'react';
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

  useEffect(() => {
    if (status === 'authenticated') {
      console.log('Usuário autenticado, redirecionando para o dashboard...');
      window.location.href = '/dashboard';
    }
  }, [status]);

  const handleGitHubLogin = async () => {
    try {
      console.log('Iniciando login com GitHub...');
      await signIn('github', { 
        callbackUrl: '/dashboard',
        redirect: true
      });
    } catch (error) {
      console.error('Erro ao fazer login:', error);
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
          {error && (
            <p className="text-sm text-red-500">
              {error === 'OAuthAccountNotLinked' 
                ? 'Esta conta do GitHub já está vinculada a outro usuário.'
                : 'Ocorreu um erro ao fazer login. Tente novamente.'}
            </p>
          )}
          <Button
            onClick={handleGitHubLogin}
            className="w-full"
          >
            <Github className="mr-2 h-5 w-5" />
            Entrar com GitHub
          </Button>
        </div>
      </Card>
    </div>
  );
} 