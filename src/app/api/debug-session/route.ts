import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    return NextResponse.json({ 
      session,
      cookies: {
        sessionToken: process.env.NEXTAUTH_SESSION_TOKEN,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      },
      env: {
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_URL: process.env.VERCEL_URL,
      }
    });
  } catch (error) {
    console.error('[Debug Session] Erro ao obter sessão:', error);
    return NextResponse.json({ 
      error: 'Erro ao obter sessão',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 