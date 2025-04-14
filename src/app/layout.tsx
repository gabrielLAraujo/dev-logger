import './globals.css';
import { getServerSession } from 'next-auth';
import Header from '@/components/Header';
import { AuthProvider } from './providers';
import { authOptions } from '@/lib/auth';

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
      <body className="font-sans">
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