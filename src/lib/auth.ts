import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import GithubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import { compare } from 'bcryptjs';

// Estendendo o tipo Session para incluir o accessToken
declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    user?: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      authorization: {
        params: {
          scope: "read:user user:email repo",
          redirect_uri: process.env.AUTH_REDIRECT_URL,
        },
      },
      profile(profile) {
        if (!profile || !profile.id) {
          throw new Error('Perfil do GitHub inválido');
        }
        return {
          id: String(profile.id),
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Credenciais inválidas');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error('Usuário não encontrado');
        }

        const isValid = await compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error('Senha incorreta');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('SignIn callback:', { user, account, profile });
      return true;
    },
    async session({ session, token, user }) {
      console.log('Session callback:', { session, token, user });
      
      if (session.user) {
        session.user.id = token.sub;
        
        // Se estamos usando JWT, o token contém o access_token
        if (token.accessToken) {
          session.accessToken = token.accessToken as string;
        } else if (user) {
          // Se estamos usando database, buscamos o access_token do banco
          const account = await prisma.account.findFirst({
            where: {
              userId: user.id,
              provider: 'github',
            },
            select: {
              access_token: true,
            },
          });
          
          if (account?.access_token) {
            session.accessToken = account.access_token;
          }
        }
      }
      return session;
    },
    async jwt({ token, account, profile }) {
      console.log('JWT callback:', { token, account, profile });
      
      // Se temos um account, significa que o usuário acabou de fazer login
      if (account) {
        token.accessToken = account.access_token;
      }
      
      return token;
    },
  },
  debug: process.env.NODE_ENV === 'development',
}; 