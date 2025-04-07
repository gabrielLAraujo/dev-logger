import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function GET(request: Request) {
  const headersList = headers();
  const host = headersList.get('host');
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const baseUrl = `${protocol}://${host}`;

  // Retornar as variáveis de ambiente e informações de contexto
  return NextResponse.json({
    // Informações de contexto
    request_info: {
      host,
      baseUrl,
      current_url: request.url,
      headers: Object.fromEntries(headersList.entries()),
    },
    // Status das variáveis
    env_status: {
      GITHUB_ID: process.env.GITHUB_ID ? 'set' : 'missing',
      GITHUB_SECRET: process.env.GITHUB_SECRET ? 'set' : 'missing',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'set' : 'missing',
      NODE_ENV: process.env.NODE_ENV,
      AUTH_REDIRECT_URL: process.env.AUTH_REDIRECT_URL,
      VERCEL_URL: process.env.VERCEL_URL,
      VERCEL_ENV: process.env.VERCEL_ENV,
    },
    // Valores calculados
    computed: {
      effective_url: process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : baseUrl),
      effective_callback: process.env.AUTH_REDIRECT_URL || `${baseUrl}/api/auth/callback/github`,
    }
  }, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'Content-Type': 'application/json',
    }
  });
} 