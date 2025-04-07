import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const envVars = {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    GITHUB_ID: process.env.GITHUB_ID,
    AUTH_REDIRECT_URL: process.env.AUTH_REDIRECT_URL,
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_URL: process.env.VERCEL_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'Definido' : 'Não definido',
  };

  const authConfig = {
    debug: authOptions.debug,
    session: authOptions.session,
    cookies: authOptions.cookies,
    pages: authOptions.pages,
    providers: authOptions.providers.map(p => ({
      id: p.id,
      name: p.name,
      type: p.type,
    })),
  };

  return NextResponse.json({
    envVars,
    authConfig,
    timestamp: new Date().toISOString(),
  });
} 