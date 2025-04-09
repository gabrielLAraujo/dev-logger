import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"
import { NextAuthOptions } from "next-auth"
import GithubProvider from "next-auth/providers/github"
import { prisma } from './prisma'

const prismaClient = new PrismaClient()

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
    error: '/',
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'github' && account.access_token) {
        try {
          // Salva o token do GitHub nas configurações do usuário
          await prisma.userSettings.upsert({
            where: {
              userEmail: user.email!,
            },
            update: {
              githubToken: account.access_token,
            },
            create: {
              userEmail: user.email!,
              githubToken: account.access_token,
            },
          });
        } catch (error) {
          console.error('Erro ao salvar token do GitHub:', error);
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
      // Redireciona para o dashboard após o login
      if (url.startsWith(baseUrl)) {
        return `${baseUrl}/dashboard`;
      }
      return url;
    },
  },
} 