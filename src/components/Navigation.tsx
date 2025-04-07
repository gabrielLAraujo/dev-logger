'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { 
  Home, 
  Settings, 
  LogOut,
  Menu,
  X,
  FolderGit2,
  Download
} from 'lucide-react';
import { useState } from 'react';

export default function Navigation() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/projects', label: 'Projetos', icon: FolderGit2 },
    { href: '/export', label: 'Exportar Mês Atual', icon: Download },
  ];

  return (
    <>
      {/* Botão do menu móvel */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-primary text-primary-foreground md:hidden"
      >
        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay para fechar o menu em dispositivos móveis */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <nav className={`fixed top-0 left-0 h-full w-64 bg-card border-r border-border p-4 transition-transform duration-300 ease-in-out z-40
        ${isMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="flex flex-col h-full">
          {/* Logo e nome do app */}
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold">DL</span>
            </div>
            <span className="font-semibold text-lg">Dev Logger</span>
          </div>

          {/* Links de navegação */}
          <div className="flex-1">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors
                        ${isActive 
                          ? 'bg-primary text-primary-foreground' 
                          : 'hover:bg-muted'}`}
                    >
                      <Icon size={20} />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Perfil do usuário e botão de logout */}
          <div className="border-t border-border pt-4">
            <div className="flex items-center gap-3 px-4 py-2">
              {session?.user?.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || 'Avatar'}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground">
                    {session?.user?.name?.[0] || 'U'}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {session?.user?.name || 'Usuário'}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {session?.user?.email}
                </p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full flex items-center gap-3 px-4 py-2 mt-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
            >
              <LogOut size={20} />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
} 