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

// Função para validar variáveis de ambiente obrigatórias
function validateEnvVariables() {
  const requiredEnvVars = {
    GITHUB_ID: process.env.GITHUB_ID,
    GITHUB_SECRET: process.env.GITHUB_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    AUTH_REDIRECT_URL: process.env.AUTH_REDIRECT_URL,
  };

  const missingVars = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    console.error(`[Auth Config] Variáveis de ambiente ausentes: ${missingVars.join(", ")}`);
    throw new Error(`Variáveis de ambiente obrigatórias ausentes: ${missingVars.join(", ")}`);
  }

  console.log("[Auth Config] Todas as variáveis de ambiente necessárias estão presentes", {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    GITHUB_ID: process.env.GITHUB_ID,
    AUTH_REDIRECT_URL: process.env.AUTH_REDIRECT_URL,
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_URL: process.env.VERCEL_URL,
  });

  // Garantir que as variáveis não são undefined após a validação
  return {
    GITHUB_ID: requiredEnvVars.GITHUB_ID!,
    GITHUB_SECRET: requiredEnvVars.GITHUB_SECRET!,
    NEXTAUTH_URL: requiredEnvVars.NEXTAUTH_URL!,
    AUTH_REDIRECT_URL: requiredEnvVars.AUTH_REDIRECT_URL!,
  };
}

// Validar variáveis de ambiente antes de configurar o auth
const envVars = validateEnvVariables();

export const authOptions: NextAuthOptions = {
  debug: true,
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
      clientId: envVars.GITHUB_ID,
      clientSecret: envVars.GITHUB_SECRET,
      authorization: {
        params: {
          redirect_uri: envVars.AUTH_REDIRECT_URL,
          scope: 'read:user user:email'
        },
      },
      profile(profile) {
        // Log apenas informações não sensíveis do perfil
        console.log('[GitHub Profile]', {
          id: profile.id,
          login: profile.login,
          name: profile.name,
          hasEmail: !!profile.email,
        });

        if (!profile || !profile.id) {
          console.error('Perfil do GitHub inválido');
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
    async signIn({ user, account }) {
      console.log("[Auth - SignIn]", {
        userId: user.id,
        provider: account?.provider,
        timestamp: new Date().toISOString(),
      });
      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, account }) {
      if (account) {
        console.log("[Auth - JWT]", {
          provider: account.provider,
          type: account.type,
          timestamp: new Date().toISOString(),
        });
      }
      return token;
    },
  },
  events: {
    async signIn({ user, account }) {
      console.log('[Event - SignIn]', {
        userId: user.id,
        provider: account?.provider,
        timestamp: new Date().toISOString(),
      });
    },
    async signOut({ token }) {
      console.log('[Event - SignOut]', {
        userId: token.sub,
        timestamp: new Date().toISOString(),
      });
    },
  },
}; 