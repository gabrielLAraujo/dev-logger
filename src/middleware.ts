import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    
    if (!token?.email) {
      // Se não houver token, redireciona para a página de login
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Erro no middleware:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/projects/:path*',
    '/commits/:path*',
    '/reports/:path*',
  ],
}; 