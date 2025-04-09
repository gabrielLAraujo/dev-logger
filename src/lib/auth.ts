import { NextAuthOptions } from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
// import { PrismaAdapter } from '@auth/prisma-adapter'; // Comentado
// import { prisma } from './prisma'; // Comentado

// Validação de variáveis de ambiente (mantida para GITHUB_ID/SECRET e NEXTAUTH_SECRET)
function validateEnvVariables() {
  const requiredEnvVars = {
    GITHUB_ID: process.env.GITHUB_ID,
    GITHUB_SECRET: process.env.GITHUB_SECRET,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    // NEXTAUTH_URL e AUTH_REDIRECT_URL não são estritamente necessários para este teste mínimo
  };

  const missingVars = Object.entries(requiredEnvVars)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    console.error(`[Auth Config Minimal] Variáveis de ambiente ausentes: ${missingVars.join(", ")}`);
    throw new Error(`Variáveis de ambiente obrigatórias ausentes: ${missingVars.join(", ")}`);
  }

  console.log("[Auth Config Minimal] Variáveis mínimas presentes.");

  return {
    GITHUB_ID: requiredEnvVars.GITHUB_ID!,
    GITHUB_SECRET: requiredEnvVars.GITHUB_SECRET!,
    NEXTAUTH_SECRET: requiredEnvVars.NEXTAUTH_SECRET!,
  };
}

const envVars = validateEnvVariables();

// Configuração MÍNIMA para teste
export const authOptions: NextAuthOptions = {
  secret: envVars.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt', // Forçando JWT puro
  },
  providers: [
    GithubProvider({
      clientId: envVars.GITHUB_ID,
      clientSecret: envVars.GITHUB_SECRET,
    }),
  ],
  // Todos os callbacks, pages, cookies customizados, adapter, events foram removidos para este teste.
  // O debug também foi removido para simplificar.
};
