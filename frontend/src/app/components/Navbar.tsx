"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 h-16 flex items-center justify-between px-6 lg:px-10 bg-bg-base/95 backdrop-blur-md border-b border-brand-border">
      <Link href="/" className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-md bg-brand-blue flex items-center justify-center text-white font-bold text-sm shadow-sm">
          IQ
        </div>
        <span className="text-white font-semibold tracking-tight text-lg">Inquira Engine</span>
      </Link>

      <div className="flex items-center gap-2">
        <Link
          href="/"
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            pathname === "/"
              ? "text-brand-blue bg-brand-blue/10"
              : "text-slate-400 hover:text-slate-200 hover:bg-bg-surface"
          }`}
        >
          URL Query
        </Link>
        <Link
          href="/chat"
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            pathname === "/chat"
              ? "text-brand-blue bg-brand-blue/10"
              : "text-slate-400 hover:text-slate-200 hover:bg-bg-surface"
          }`}
        >
          Document Chat
        </Link>
      </div>
    </nav>
  );
}
