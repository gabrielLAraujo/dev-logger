'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Github } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Image from 'next/image';

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
    signIn('github', { 
      callbackUrl: '/dashboard',
      redirect: true
    });
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-background/80">
        <div className="text-center">
          <Skeleton className="h-12 w-12 rounded-full mx-auto" />
          <Skeleton className="h-4 w-48 mt-4 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-background/80">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
              <span className="text-3xl font-bold text-primary">DL</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Dev Logger
          </h1>
          <p className="text-muted-foreground mt-2">
            Acompanhe seus commits e repositórios do GitHub
          </p>
        </div>

        <Card className="p-6 border-border/40 bg-card/50 backdrop-blur-sm">
          {errorMessage && (
            <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
              {errorMessage}
            </div>
          )}

          <Button
            onClick={handleGitHubLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-[#24292f] hover:bg-[#24292f]/90 text-white"
          >
            <Github className="h-5 w-5" />
            {isLoading ? 'Entrando...' : 'Entrar com GitHub'}
          </Button>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-background/80">
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