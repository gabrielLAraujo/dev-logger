import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // Se o usuário não estiver autenticado e tentar acessar uma rota protegida,
    // redireciona para o login
    if (!req.nextauth.token && req.nextUrl.pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    
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
        // Permite acesso a /login e /register sem autenticação
        if (req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/register') {
          return true;
        }
        // Exige autenticação para outras rotas
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ['/dashboard/:path*', '/onboarding/:path*', '/projects/:path*', '/settings/:path*'],
}; 