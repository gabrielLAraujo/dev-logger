import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import GithubProvider from 'next-auth/providers/github';
import { prisma } from './prisma';

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
    .filter(([, value]) => !value)
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

  return {
    GITHUB_ID: requiredEnvVars.GITHUB_ID!,
    GITHUB_SECRET: requiredEnvVars.GITHUB_SECRET!,
    NEXTAUTH_URL: requiredEnvVars.NEXTAUTH_URL!,
    AUTH_REDIRECT_URL: requiredEnvVars.AUTH_REDIRECT_URL!,
  };
}

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
    error: '/auth/error',
  },
  providers: [
    GithubProvider({
      clientId: envVars.GITHUB_ID,
      clientSecret: envVars.GITHUB_SECRET,
      authorization: {
        params: {
          prompt: 'consent',
        },
      },
      profile(profile) {
        // Verificar se o email está presente, caso contrário, usar um email padrão
        if (!profile.email) {
          console.warn(`[Auth] Email ausente para o usuário ${profile.login}, usando email padrão`);
        }
        
        return {
          id: String(profile.id),
          name: profile.name || profile.login,
          email: profile.email || `${profile.login}@users.noreply.github.com`,
          image: profile.avatar_url,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("[Auth - SignIn]", {
        userId: user.id,
        provider: account?.provider,
        profile,
        timestamp: new Date().toISOString(),
      });
      return true;
    },
    async session({ session, token }) {
      console.log("[Auth - Session]", {
        session,
        token,
        timestamp: new Date().toISOString(),
      });
      if (session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, account, profile }) {
      console.log("[Auth - JWT]", {
        token,
        account,
        profile,
        timestamp: new Date().toISOString(),
      });
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async redirect({ url, baseUrl }) {
      console.log("[Auth - Redirect]", { url, baseUrl });
      
      // Se a URL for relativa, combine com a URL base
      if (url.startsWith('/')) {
        const finalUrl = `${baseUrl}${url}`;
        console.log("[Auth - Redirect] URL relativa, redirecionando para:", finalUrl);
        return finalUrl;
      }
      
      // Se a URL for do mesmo domínio, use-a
      if (url.startsWith(baseUrl)) {
        console.log("[Auth - Redirect] URL do mesmo domínio, redirecionando para:", url);
        return url;
      }
      
      // Caso padrão: redirecionar para o dashboard
      const defaultUrl = `${baseUrl}/dashboard`;
      console.log("[Auth - Redirect] URL padrão, redirecionando para:", defaultUrl);
      return defaultUrl;
    },
  },
  events: {
    async signIn(message) {
      console.log('[Event - SignIn]', {
        message,
        timestamp: new Date().toISOString(),
      });
    },
    async signOut(message) {
      console.log('[Event - SignOut]', {
        message,
        timestamp: new Date().toISOString(),
      });
    },
  },
}; 