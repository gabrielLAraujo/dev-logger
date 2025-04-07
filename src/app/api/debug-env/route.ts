import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function GET() {
  // Verificar se estamos em desenvolvimento
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Este endpoint está disponível apenas em desenvolvimento' },
      { status: 403 }
    );
  }

  // Retornar as variáveis de ambiente de forma segura
  return NextResponse.json({
    GITHUB_ID: process.env.GITHUB_ID ? 'set' : 'missing',
    GITHUB_SECRET: process.env.GITHUB_SECRET ? 'set' : 'missing',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'set' : 'missing',
    NODE_ENV: process.env.NODE_ENV,
    AUTH_REDIRECT_URL: process.env.AUTH_REDIRECT_URL,
    VERCEL_URL: process.env.VERCEL_URL,
    VERCEL_ENV: process.env.VERCEL_ENV,
  }, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'Content-Type': 'application/json',
    }
  });
} 