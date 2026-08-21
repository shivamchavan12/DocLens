"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Command,
  Plus,
  FileText,
  LogOut,
  ChevronLeft,
  Menu,
  X,
  Trash2,
  Search,
  Clock,
  Sparkles,
} from "lucide-react";
import { AuthModal } from "./AuthModal";
import { api } from "@/lib/api";

export function Sidebar() {
  const { user, isGuest, displayName, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const firstName = displayName?.split(" ")[0] || user?.email?.split("@")[0] || "User";
  const initial = firstName.charAt(0).toUpperCase();

  const loadDocuments = useCallback(async () => {
    if (isGuest) return;
    try {
      setDocsLoading(true);
      const data = await api.getDocuments();
      setDocuments(data.documents || []);
    } catch (err) {
      console.error("Failed to load documents", err);
    } finally {
      setDocsLoading(false);
    }
  }, [isGuest]);

  useEffect(() => {
    if (user) loadDocuments();
  }, [user, pathname, loadDocuments]);

  const handleDelete = async (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm("Delete this document?")) return;
    try {
      await api.deleteDocument(docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      if (pathname === `/documents/${docId}`) router.push("/");
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  const filteredDocs = documents.filter((doc) =>
    doc.filename?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /* ── Expanded sidebar content ── */
  const expandedContent = (
    <div className="flex flex-col h-full">
      {/* ─── Brand & Close Toggle ─── */}
      <div className="h-14 flex items-center justify-between px-5 shrink-0 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2.5 group" onClick={() => setMobileOpen(false)}>
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm group-hover:bg-indigo-700 transition-colors">
            <Command size={14} className="text-white" />
          </div>
          <span className="font-semibold text-[0.95rem] tracking-tight text-gray-900">DocLens</span>
        </Link>
        {/* Top right close button */}
        <button
          onClick={() => setCollapsed(true)}
          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors hidden lg:block"
          title="Close sidebar"
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      {/* ─── New Analysis CTA ─── */}
      <div className="px-3 pt-4 pb-3 shrink-0">
        <Link
          href="/"
          onClick={() => setMobileOpen(false)}
          className="flex items-center justify-center gap-2 w-full h-9 bg-indigo-600 hover:bg-indigo-700 text-white text-[0.85rem] font-medium rounded-lg transition-colors shadow-sm"
        >
          <Plus size={15} strokeWidth={2.5} />
          <span>New analysis</span>
        </Link>
      </div>

      {/* ─── Document History ─── */}
      <div className="flex-1 flex flex-col min-h-0 border-t border-gray-100 mt-1">
        <div className="px-4 pt-3 pb-1 flex items-center gap-2">
          <Clock size={12} className="text-gray-400" />
          <span className="text-[0.7rem] font-semibold text-gray-400 uppercase tracking-wider">History</span>
          {!isGuest && documents.length > 0 && (
            <span className="text-[0.65rem] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full ml-auto">
              {documents.length}
            </span>
          )}
        </div>

        {/* Search bar — shown when 4+ documents */}
        {!isGuest && documents.length > 3 && (
          <div className="px-3 py-2">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-7 pr-3 text-[0.8rem] bg-gray-50 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>
          </div>
        )}

        {/* Document list */}
        <div className="flex-1 overflow-y-auto px-3 py-1 custom-scrollbar">
          {isGuest ? (
            <div className="px-2 py-8 text-center">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <FileText className="w-5 h-5 text-gray-300" />
              </div>
              <p className="text-[0.8rem] text-gray-500 font-medium mb-1">No history</p>
              <p className="text-[0.75rem] text-gray-400 leading-snug">
                Sign in to save your analyzed documents.
              </p>
            </div>
          ) : docsLoading ? (
            <div className="space-y-1 py-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-2.5 px-2.5 py-2.5 animate-pulse rounded-lg">
                  <div className="w-7 h-7 rounded bg-gray-100 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-2.5 bg-gray-100 rounded w-4/5" />
                    <div className="h-2 bg-gray-50 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="px-2 py-8 text-center">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-5 h-5 text-gray-300" />
              </div>
              <p className="text-[0.8rem] text-gray-500 font-medium mb-1">
                {documents.length === 0 ? "No documents yet" : "No results"}
              </p>
              <p className="text-[0.75rem] text-gray-400">
                {documents.length === 0 ? "Upload a document to get started." : "Try a different search term."}
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {filteredDocs.map((doc) => {
                const isActive = pathname === `/documents/${doc.id}`;
                const ext = doc.filename?.split(".").pop()?.toUpperCase() || "DOC";
                return (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -4 }}
                    onClick={() => { router.push(`/documents/${doc.id}`); setMobileOpen(false); }}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-all group mb-0.5 ${
                      isActive
                        ? "bg-indigo-50 ring-1 ring-indigo-100"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    {/* File type badge */}
                    <div className={`w-7 h-7 rounded flex items-center justify-center shrink-0 text-[0.6rem] font-bold tracking-wide ${
                      isActive
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      {ext.slice(0, 3)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={`text-[0.83rem] font-medium truncate ${
                        isActive ? "text-indigo-700" : "text-gray-800"
                      }`} title={doc.filename}>
                        {doc.filename}
                      </p>
                      <p className="text-[0.7rem] text-gray-400">
                        {new Date(doc.upload_timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        {" · "}
                        <span className="capitalize">{doc.summary_length}</span>
                      </p>
                    </div>

                    <button
                      onClick={(e) => handleDelete(e, doc.id)}
                      className="p-1 text-gray-300 hover:text-red-500 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all shrink-0"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* ─── User Footer ─── */}
      <div className="border-t border-gray-100 p-3 shrink-0">
        {isGuest ? (
          <button
            onClick={() => setShowAuth(true)}
            className="flex items-center justify-center gap-2 w-full h-9 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-[0.85rem] font-medium rounded-lg transition-all shadow-sm"
          >
            Sign in
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[0.85rem] font-bold shrink-0">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[0.83rem] font-semibold text-gray-900 truncate">{firstName}</p>
              <p className="text-[0.7rem] text-gray-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={signOut}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors shrink-0"
              title="Sign out"
            >
              <LogOut size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  /* ── Collapsed sidebar content ── */
  const collapsedContent = (
    <div className="flex flex-col h-full items-center">
      {/* Logo as Open Toggle */}
      <div className="h-14 flex items-center justify-center shrink-0 border-b border-gray-100 w-full">
        <button onClick={() => setCollapsed(false)} className="group outline-none" title="Open sidebar">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm group-hover:bg-indigo-700 transition-colors">
            <Command size={16} className="text-white" />
          </div>
        </button>
      </div>

      {/* New analysis */}
      <div className="py-4 shrink-0">
        <Link
          href="/"
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm"
          title="New analysis"
        >
          <Plus size={16} strokeWidth={2.5} />
        </Link>
      </div>

      {/* Recent docs as icons */}
      <div className="flex-1 flex flex-col items-center gap-1 py-3 border-t border-gray-100 overflow-y-auto custom-scrollbar w-full">
        {!isGuest && filteredDocs.slice(0, 8).map((doc) => {
          const isActive = pathname === `/documents/${doc.id}`;
          const ext = doc.filename?.split(".").pop()?.toUpperCase()?.slice(0, 3) || "DOC";
          return (
            <button
              key={doc.id}
              onClick={() => router.push(`/documents/${doc.id}`)}
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-[0.55rem] font-bold transition-all ${
                isActive
                  ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100"
                  : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              }`}
              title={doc.filename}
            >
              {ext}
            </button>
          );
        })}
      </div>

      {/* User avatar / sign in */}
      <div className="border-t border-gray-100 py-3 shrink-0 w-full flex flex-col items-center">
        {isGuest ? (
          <button
            onClick={() => setShowAuth(true)}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
            title="Sign in"
          >
            <LogOut size={16} className="rotate-180" />
          </button>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[0.8rem] font-bold" title={firstName}>
              {initial}
            </div>
            <button
              onClick={signOut}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger trigger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-50 p-2 bg-white border border-gray-200 rounded-lg shadow-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        <Menu size={18} />
      </button>

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-white border-r border-gray-200 shrink-0 h-screen sticky top-0 transition-all duration-200 ${
          collapsed ? "w-[60px]" : "w-[260px]"
        }`}
      >
        {collapsed ? collapsedContent : expandedContent}
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="mobile-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60] lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              key="mobile-sidebar"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-[260px] bg-white border-r border-gray-200 z-[70] shadow-xl lg:hidden"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 z-10"
              >
                <X size={16} />
              </button>
              {expandedContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
}
