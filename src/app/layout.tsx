import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import Navigation from '@/components/Navigation';
import { ToastProvider } from '@/contexts/ToastContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Dev Logger',
  description: 'Acompanhe seus commits e repositórios do GitHub',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <SessionProvider>
          <ToastProvider>
            <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
              <div className="min-h-screen bg-background text-foreground">
                <Navigation />
                <main className="md:ml-64">{children}</main>
              </div>
            </ThemeProvider>
          </ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
