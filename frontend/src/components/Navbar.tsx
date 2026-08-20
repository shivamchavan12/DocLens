"use client";

import { useAuth } from "@/contexts/AuthContext";
import { LogOut, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();

  if (pathname === '/login') return null;

  return (
    <nav className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center">
              <span className="font-bold text-white tracking-tighter">DL</span>
            </div>
            <span className="font-semibold text-xl tracking-tight text-white">DocLens</span>
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-neutral-400 hidden sm:block">{user.email}</span>
                <button
                  onClick={signOut}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-white/5 transition-colors text-sm text-neutral-300 hover:text-white"
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 transition-colors text-sm font-medium text-white"
              >
                <User size={16} />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
