import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({
        message: 'Sessão não encontrada',
        cookies: await getCookiesInfo()
      }, { status: 401 });
    }

    return NextResponse.json({
      session,
      cookies: await getCookiesInfo()
    });
  } catch (error) {
    console.error('[Debug Session] Erro ao obter sessão:', error);
    return NextResponse.json({
      error: 'Erro ao obter sessão',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

async function getCookiesInfo() {
  try {
    const cookieStore = cookies();

    const all = cookieStore.getAll();
    const sessionToken = all.find(c =>
      c.name === 'next-auth.session-token' ||
      c.name === '__Secure-next-auth.session-token'
    );

    return {
      sessionToken: sessionToken ? {
        name: sessionToken.name,
        value: sessionToken.value?.substring(0, 10) + '...',
      } : null,
      allCookies: all.map(cookie => ({
        name: cookie.name,
        value: cookie.value?.substring(0, 10) + '...',
      })),
      env: {
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_URL: process.env.VERCEL_URL,
      }
    };
  } catch (error) {
    console.error('[Debug Session] Erro ao obter cookies:', error);
    return { error: 'Erro ao obter cookies' };
  }
}
