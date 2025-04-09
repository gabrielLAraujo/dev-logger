import './globals.css';
import { Inter } from 'next/font/google';
import { getServerSession } from 'next-auth';
import Header from '@/components/Header';
import { AuthProvider } from './providers';
import { authOptions } from './api/auth/[...nextauth]/route';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Dev Logger',
  description: 'Registre e acompanhe seus commits e projetos de desenvolvimento',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen bg-gray-50">
            <Header />
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
} 