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
      console.log('SignIn callback:', {
        user: JSON.stringify(user, null, 2),
        account: JSON.stringify(account, null, 2),
        profile: JSON.stringify(profile, null, 2)
      });
      return true;
    },
    async session({ session, token, user }) {
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
      console.log('SignIn event:', JSON.stringify(message, null, 2));
    },
    async signOut(message) {
      console.log('SignOut event:', JSON.stringify(message, null, 2));
    },
  },
}; 