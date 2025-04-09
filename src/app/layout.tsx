import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import Navigation from '@/components/Navigation';
import { ToastProvider } from '@/contexts/ToastContext';
import ClientLayout from '@/components/ClientLayout';
import Script from 'next/script';

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
      <head>
        <link
          rel="preload"
          href="https://github.githubassets.com/assets/wp-runtime-8afca8541195.js"
          as="script"
          crossOrigin="anonymous"
        />
        <Script
          src="https://github.githubassets.com/assets/wp-runtime-8afca8541195.js"
          strategy="beforeInteractive"
          crossOrigin="anonymous"
        />
      </head>
      <body className={inter.className} suppressHydrationWarning data-turbo-suppress-warning>
        <SessionProvider>
          <ToastProvider>
            <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
              <ClientLayout>{children}</ClientLayout>
            </ThemeProvider>
          </ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
