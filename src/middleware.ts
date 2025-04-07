import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // Adiciona headers de segurança
    const response = NextResponse.next();
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    return response;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const isAuthPage = req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/register';
        const isProtectedRoute = req.nextUrl.pathname.startsWith('/dashboard') || 
                                req.nextUrl.pathname.startsWith('/projects') ||
                                req.nextUrl.pathname.startsWith('/settings');

        // Se estiver em uma página de autenticação e já estiver logado, permite o acesso
        if (isAuthPage && token) {
          return true;
        }

        // Se estiver em uma rota protegida, exige autenticação
        if (isProtectedRoute) {
          return !!token;
        }

        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/projects/:path*',
    '/settings/:path*',
    '/login',
    '/register'
  ],
}; 