import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    GITHUB_ID: process.env.GITHUB_ID,
    GITHUB_SECRET: process.env.GITHUB_SECRET ? 'Definido' : 'Não definido',
    AUTH_REDIRECT_URL: process.env.AUTH_REDIRECT_URL,
    NODE_ENV: process.env.NODE_ENV,
  });
} 