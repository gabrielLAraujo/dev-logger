import { NextResponse } from 'next/server';

// Função para verificar as variáveis de ambiente
function logEnvironmentVariables(context: string) {
  console.log(`[${context}] Variáveis de ambiente:`, {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    GITHUB_ID: process.env.GITHUB_ID,
    GITHUB_SECRET: process.env.GITHUB_SECRET ? 'Definido' : 'Não definido',
    AUTH_REDIRECT_URL: process.env.AUTH_REDIRECT_URL,
    NODE_ENV: process.env.NODE_ENV,
    BASE_URL: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : process.env.NEXTAUTH_URL,
    VERCEL_URL: process.env.VERCEL_URL,
    VERCEL_ENV: process.env.VERCEL_ENV,
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  logEnvironmentVariables('GitHub Callback');
  console.log('GitHub callback:', {
    code,
    state,
    url: request.url,
    headers: Object.fromEntries(request.headers),
    env: {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      GITHUB_ID: process.env.GITHUB_ID,
      AUTH_REDIRECT_URL: process.env.AUTH_REDIRECT_URL,
      VERCEL_URL: process.env.VERCEL_URL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      BASE_URL: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : process.env.NEXTAUTH_URL,
    }
  });

  // Redirecionar para o dashboard
  const baseUrl = process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  console.log('Redirecionando para:', `${baseUrl}/dashboard`);
  
  // Usar o objeto URL para garantir que a URL esteja correta
  const redirectUrl = new URL('/dashboard', baseUrl);
  console.log('URL de redirecionamento:', redirectUrl.toString());
  
  // Usar o objeto Response para garantir que a resposta esteja correta
  const response = NextResponse.redirect(redirectUrl);
  console.log('Resposta:', response);
  
  // Adicionar headers de segurança
  response.headers.set('Cache-Control', 'no-store, max-age=0');
  response.headers.set('Pragma', 'no-cache');
  
  return response;
} 