"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import LogoutButton from "./LogoutButton";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-gray-800">
                Dev Logger
              </Link>
            </div>
            {session && (
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center px-1 pt-1 text-gray-900 hover:text-gray-500"
                >
                  Dashboard
                </Link>
                <Link
                  href="/onboarding"
                  className="inline-flex items-center px-1 pt-1 text-gray-900 hover:text-gray-500"
                >
                  Repositórios
                </Link>
              </div>
            )}
          </div>
          <div className="flex items-center">
            {session && (
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">{session.user?.name}</span>
                <LogoutButton />
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 