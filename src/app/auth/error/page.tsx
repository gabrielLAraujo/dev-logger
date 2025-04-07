'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

function ErrorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get('error');
  const [errorMessage, setErrorMessage] = useState<string>('Ocorreu um erro ao fazer login. Tente novamente.');

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
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold">Erro de Autenticação</h1>
          <p className="text-gray-600 mt-2">{errorMessage}</p>
        </div>

        <Button
          onClick={() => router.push('/login')}
          className="w-full"
        >
          Voltar para o Login
        </Button>
      </Card>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
} 