import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import Navigation from '@/components/Navigation';
import { ToastProvider } from '@/contexts/ToastContext';
import { usePathname } from 'next/navigation';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Dev Logger',
  description: 'Acompanhe seus commits e repositórios do GitHub',
};

function RootLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';

  return (
    <div className="min-h-screen bg-background text-foreground">
      {!isAuthPage && <Navigation />}
      <main className={!isAuthPage ? 'md:ml-64' : ''}>{children}</main>
    </div>
  );
}

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
              <RootLayoutContent>{children}</RootLayoutContent>
            </ThemeProvider>
          </ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
