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

// Função para verificar as variáveis de ambiente
function logEnvironmentVariables(context: string) {
  console.log(`[${context}] Variáveis de ambiente:`, {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    GITHUB_ID: process.env.GITHUB_ID,
    GITHUB_SECRET: process.env.GITHUB_SECRET ? 'Definido' : 'Não definido',
    AUTH_REDIRECT_URL: process.env.AUTH_REDIRECT_URL,
    NODE_ENV: process.env.NODE_ENV,
    BASE_URL: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : process.env.NEXTAUTH_URL,
  });
}

export const authOptions: NextAuthOptions = {
  debug: true, // Habilitando o modo debug
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
        },
      },
      profile(profile) {
        logEnvironmentVariables('GitHub Profile');
        console.log('GitHub profile:', JSON.stringify(profile, null, 2));
        if (!profile || !profile.id) {
          console.error('Perfil do GitHub inválido:', profile);
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
      logEnvironmentVariables('SignIn Callback');
      console.log('SignIn callback:', {
        user: JSON.stringify(user, null, 2),
        account: JSON.stringify(account, null, 2),
        profile: JSON.stringify(profile, null, 2),
        env: {
          NEXTAUTH_URL: process.env.NEXTAUTH_URL,
          GITHUB_ID: process.env.GITHUB_ID,
          AUTH_REDIRECT_URL: process.env.AUTH_REDIRECT_URL,
          VERCEL_URL: process.env.VERCEL_URL,
          BASE_URL: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : process.env.NEXTAUTH_URL,
        }
      });
      return true;
    },
    async session({ session, token, user }) {
      logEnvironmentVariables('Session Callback');
      console.log('Session callback:', {
        session: JSON.stringify(session, null, 2),
        token: JSON.stringify(token, null, 2),
        user: JSON.stringify(user, null, 2)
      });
      
      if (session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      logEnvironmentVariables('JWT Callback');
      console.log('JWT callback:', {
        token: JSON.stringify(token, null, 2),
        user: JSON.stringify(user, null, 2),
        account: JSON.stringify(account, null, 2)
      });
      
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
  },
  events: {
    async signIn(message) {
      logEnvironmentVariables('SignIn Event');
      console.log('SignIn event:', JSON.stringify(message, null, 2));
    },
    async signOut(message) {
      logEnvironmentVariables('SignOut Event');
      console.log('SignOut event:', JSON.stringify(message, null, 2));
    },
  },
}; 