'use client';

import { usePathname } from 'next/navigation';
import Navigation from '@/components/Navigation';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';

  return (
    <div className="min-h-screen bg-background text-foreground">
      {!isAuthPage && <Navigation />}
      <main className={!isAuthPage ? 'md:ml-64' : ''}>{children}</main>
    </div>
  );
} 