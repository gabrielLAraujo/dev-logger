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

  interface JWT {
    id?: string;
    accessToken?: string;
  }
}

// Validação de variáveis de ambiente
function validateEnvVariables() {
  const requiredEnvVars = {
    GITHUB_ID: process.env.GITHUB_ID,
    GITHUB_SECRET: process.env.GITHUB_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    AUTH_REDIRECT_URL: process.env.AUTH_REDIRECT_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
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
    NEXTAUTH_SECRET: requiredEnvVars.NEXTAUTH_SECRET!,
  };
}

const envVars = validateEnvVariables();

export const authOptions: NextAuthOptions = {
  debug: true,
  adapter: PrismaAdapter(prisma),
  secret: envVars.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false, // importante para subdomínio Vercel
      },
    },
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

      if (token && session.user) {
        session.user.id = token.sub;
        session.accessToken = token.accessToken as string | undefined;
      }

      return session;
    },
    async jwt({ token, user, account }) {
      console.log("[Auth - JWT]", {
        token,
        user,
        account,
        timestamp: new Date().toISOString(),
      });

      if (account && user) {
        token.id = user.id;
        token.accessToken = account.access_token;
      }

      return token;
    },
    async redirect({ url, baseUrl }) {
      console.log("[Auth - Redirect]", { url, baseUrl });

      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (url.startsWith(baseUrl)) return url;
      return `${baseUrl}/dashboard`;
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
