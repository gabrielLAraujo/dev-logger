import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get('__Secure-next-auth.session-token');
    
    return NextResponse.json({ 
      sessionToken: sessionToken ? {
        name: sessionToken.name,
        value: sessionToken.value.substring(0, 10) + '...',
      } : null,
      allCookies: Array.from(cookieStore.getAll()).map(cookie => ({
        name: cookie.name,
        value: cookie.value.substring(0, 10) + '...',
      })),
      env: {
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_URL: process.env.VERCEL_URL,
      }
    });
  } catch (error) {
    console.error('[Debug Cookies] Erro ao obter cookies:', error);
    return NextResponse.json({ 
      error: 'Erro ao obter cookies',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 