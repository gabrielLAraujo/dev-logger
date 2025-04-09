import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

export async function middleware(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    
    if (token?.email) {
      // Verifica se o usuário tem UserSettings
      const userSettings = await prisma.userSettings.findUnique({
        where: {
          userEmail: token.email,
        },
      });

      // Se não tiver UserSettings ou não tiver token do GitHub, cria/atualiza
      if (!userSettings || !userSettings.githubToken) {
        // Busca o token mais recente do usuário
        const account = await prisma.account.findFirst({
          where: {
            user: {
              email: token.email
            },
            provider: 'github'
          },
          orderBy: {
            id: 'desc'
          }
        });

        if (account?.access_token) {
          // Verifica se o token é válido
          const githubResponse = await fetch('https://api.github.com/user', {
            headers: {
              Authorization: `Bearer ${account.access_token}`,
              Accept: 'application/vnd.github.v3+json',
            },
          });

          if (githubResponse.ok) {
            await prisma.userSettings.upsert({
              where: {
                userEmail: token.email,
              },
              update: {
                githubToken: account.access_token,
                updatedAt: new Date(),
              },
              create: {
                userEmail: token.email,
                githubToken: account.access_token,
              },
            });
            console.log('Token do GitHub atualizado para o usuário:', token.email);
          } else {
            console.error('Token do GitHub inválido para o usuário:', token.email);
          }
        }
      }
    }
  } catch (error) {
    console.error('Erro no middleware:', error);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/projects/:path*',
    '/commits/:path*',
    '/reports/:path*',
  ],
}; 