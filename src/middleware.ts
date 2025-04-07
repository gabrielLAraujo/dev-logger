import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // Se o usuário não estiver autenticado e tentar acessar uma rota protegida,
    // redireciona para o login
    if (!req.nextauth.token && req.nextUrl.pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    
    return NextResponse.next();
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