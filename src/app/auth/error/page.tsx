'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  const getErrorMessage = (errorCode: string | null) => {
    const errorMessages: Record<string, string> = {
      OAuthAccountNotLinked: 'Esta conta do GitHub já está vinculada a outro usuário.',
      OAuthSignin: 'Erro ao iniciar o processo de autenticação com o GitHub.',
      OAuthCallback: 'Erro ao processar a resposta do GitHub.',
      OAuthCreateAccount: 'Não foi possível criar uma conta com o GitHub.',
      EmailCreateAccount: 'Não foi possível criar uma conta com o email fornecido.',
      Callback: 'Erro ao processar a autenticação.',
      Default: 'Ocorreu um erro ao fazer login. Tente novamente.'
    };

    return errorCode ? (errorMessages[errorCode] || `Erro desconhecido: ${errorCode}`) : 'Erro desconhecido';
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-full bg-red-100 p-3">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold">Erro de autenticação</h1>
          <p className="text-center text-red-500">
            {getErrorMessage(error)}
          </p>
          {errorDescription && (
            <p className="text-center text-sm text-muted-foreground">
              {errorDescription}
            </p>
          )}
          <div className="mt-4 flex gap-2">
            <Link href="/login">
              <Button variant="outline">Voltar para o login</Button>
            </Link>
            <Link href="/">
              <Button>Ir para a página inicial</Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
} 