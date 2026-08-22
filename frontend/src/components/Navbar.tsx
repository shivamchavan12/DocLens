"use client";

import { useAuth } from "@/contexts/AuthContext";
import { LogOut, User, Command } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();

  // Don't show navbar in chat (has its own sidebar) or login
  if (pathname === '/login' || pathname === '/chat') return null;

  return (
    <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 flex items-center justify-center">
              <img src="/logo.png" alt="DocLens Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-semibold text-[0.95rem] tracking-tight text-gray-900">DocLens</span>
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-[0.85rem] font-medium text-gray-600 hidden sm:block">{user.email}</span>
                <div className="h-4 w-[1px] bg-gray-200 hidden sm:block"></div>
                <button
                  onClick={signOut}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-100 transition-colors text-[0.85rem] font-medium text-gray-500 hover:text-gray-900"
                >
                  <LogOut size={14} />
                  <span>Sign out</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 transition-colors text-[0.85rem] font-medium text-white shadow-sm"
              >
                <User size={14} />
                <span>Sign in</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
