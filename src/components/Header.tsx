'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import GitHubLoginButton from './GitHubLoginButton';

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-800">
                Dev Logger
              </Link>
            </div>
            <nav className="ml-6 flex space-x-8">
              <Link href="/projects" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900">
                Projetos
              </Link>
              <Link href="/commits" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900">
                Commits
              </Link>
            </nav>
          </div>
          <div className="flex items-center">
            {session ? (
              <div className="flex items-center space-x-4">
                {session.user?.image && (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || 'Avatar'}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                )}
                <span className="text-sm text-gray-700">{session.user?.name}</span>
                <button
                  onClick={() => signOut()}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                >
                  Sair
                </button>
              </div>
            ) : (
             <GitHubLoginButton />
            )}
          </div>
        </div>
      </div>
    </header>
  );
} 