import { PrismaAdapter } from "@auth/prisma-adapter"
import { NextAuthOptions } from "next-auth"
import GithubProvider from "next-auth/providers/github"
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      authorization: {
        params: {
          scope: 'read:user repo',
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin',
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'github' && account.access_token) {
        try {
          console.log('Token do GitHub recebido:', account.access_token.substring(0, 10) + '...');
          
          // Verifica se o usuário existe
          const existingUser = await prisma.user.findUnique({
            where: {
              email: user.email!,
            },
          });

          if (!existingUser) {
            console.error('Usuário não encontrado no banco de dados');
            return false;
          }

          // Verifica se o token é válido
          const githubResponse = await fetch('https://api.github.com/user', {
            headers: {
              Authorization: `Bearer ${account.access_token}`,
              Accept: 'application/vnd.github.v3+json',
            },
          });

          if (!githubResponse.ok) {
            console.error('Token do GitHub inválido');
            return false;
          }

          // Salva o token do GitHub nas configurações do usuário
          const userSettings = await prisma.userSettings.upsert({
            where: {
              userEmail: user.email!,
            },
            update: {
              githubToken: account.access_token,
              updatedAt: new Date(),
            },
            create: {
              userEmail: user.email!,
              githubToken: account.access_token,
            },
          });

          console.log('Token salvo com sucesso para o usuário:', user.email);
          return true;
        } catch (error) {
          console.error('Erro ao salvar token do GitHub:', error);
          return false;
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.sub as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Se a URL começar com o baseUrl, é uma URL interna
      if (url.startsWith(baseUrl)) {
        // Se houver um callbackUrl na URL, use-o
        const urlObj = new URL(url);
        const callbackUrl = urlObj.searchParams.get('callbackUrl');
        if (callbackUrl) {
          // Verifica se o callbackUrl é uma URL interna
          if (callbackUrl.startsWith(baseUrl) || callbackUrl.startsWith('/')) {
            return callbackUrl;
          }
        }
        // Se não houver callbackUrl, redireciona para o dashboard
        return `${baseUrl}/dashboard`;
      }
      // Se a URL não começar com baseUrl, é uma URL externa
      // Verifica se é uma URL permitida
      if (url.startsWith('http://localhost:') || url.startsWith('https://')) {
        return url;
      }
      // Se não for uma URL permitida, redireciona para o dashboard
      return `${baseUrl}/dashboard`;
    },
  },
} 