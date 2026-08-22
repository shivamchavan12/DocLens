"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  FileText,
  ArrowLeft,
  Send,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  File,
  Copy,
  Check,
  Globe,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";
import { AuthModal } from "@/components/AuthModal";

export default function DocumentWorkspace() {
  const { user, loading, isGuest } = useAuth();
  const router = useRouter();
  const params = useParams();
  const docId = params.id as string;

  const [doc, setDoc] = useState<any>(null);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [question, setQuestion] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && docId) {
      loadDocument();
      loadChat();
    }
  }, [user, loading, docId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const loadDocument = async () => {
    try {
      const data = await api.getDocument(docId);
      setDoc(data);
    } catch (err) {
      console.error(err);
      router.push("/");
    }
  };

  const loadChat = async () => {
    try {
      const data = await api.getChatHistory(docId);
      setChatHistory(data.messages || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    const userMsg = { role: "user", content: question };
    setChatHistory((prev) => [...prev, userMsg]);
    setQuestion("");
    setIsAsking(true);

    try {
      const res = await api.chatWithDocument(docId, userMsg.content);
      setChatHistory((prev) => [...prev, { role: "assistant", content: res.answer }]);
    } catch (err) {
      console.error(err);
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error answering that." },
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  function renderMd(text: string) {
    return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={i} className="font-semibold text-gray-900">
          {part.slice(2, -2)}
        </strong>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }



  if (!doc) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Breadcrumb Header */}
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 px-6 lg:px-8 py-4 border-b border-gray-200 bg-white shrink-0"
      >
        <button
          onClick={() => router.push("/")}
          className="p-1 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <span
          className="text-[0.85rem] text-gray-500 font-medium hover:text-gray-900 cursor-pointer transition-colors"
          onClick={() => router.push("/")}
        >
          Library
        </span>
        <ChevronRight size={12} className="text-gray-400" />
        <div className="flex items-center gap-1.5 text-gray-900 overflow-hidden">
          <FileText size={14} className="text-indigo-600 shrink-0" />
          <span className="text-[0.85rem] font-semibold truncate">{doc.filename}</span>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-0 min-h-0 overflow-hidden">
        {/* Left: Summary */}
        <div className="border-r border-gray-200 bg-white flex flex-col overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="text-indigo-600 w-4 h-4" />
              <h2 className="text-[0.95rem] font-semibold text-gray-900">Intelligence Summary</h2>
            </div>
            <div className="flex items-center gap-3">
              {/* Translate dropdown will go here */}
              <span className="text-[0.7rem] font-semibold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-indigo-100">
                {doc.summary_length}
              </span>
            </div>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar space-y-8 flex-1">
            <section>
              <h3 className="text-[0.75rem] font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <File className="w-3 h-3" />
                Executive Summary
              </h3>
              <div className="text-[0.9rem] text-gray-700 leading-relaxed whitespace-pre-wrap">
                {renderMd(doc.summary)}
              </div>
            </section>

            {doc.key_points && doc.key_points.length > 0 && (
              <section>
                <h3 className="text-[0.75rem] font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Key Points
                </h3>
                <ul className="space-y-3">
                  {doc.key_points.map((pt: string, i: number) => (
                    <li key={i} className="flex gap-3 text-[0.9rem] text-gray-700 leading-relaxed">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="pt-4 border-t border-gray-100">
              <h3 className="text-[0.75rem] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Metadata
              </h3>
              <div className="text-[0.85rem] text-gray-500 space-y-1">
                <p>Uploaded: {new Date(doc.upload_timestamp).toLocaleString()}</p>
                <p>
                  ID: <span className="font-mono text-[0.8rem]">{doc.id}</span>
                </p>
              </div>
            </section>
          </div>
        </div>

        {/* Right: Q&A Chat */}
        <div className="flex flex-col bg-gray-50/50 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-white shrink-0">
            <h2 className="text-[0.95rem] font-semibold text-gray-900">Document Q&A</h2>
            <p className="text-[0.8rem] text-gray-500">Ask questions about the document content</p>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
            {chatHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <Sparkles className="w-6 h-6 mb-2 opacity-40" />
                <p className="text-[0.9rem]">Ask anything about this document.</p>
              </div>
            ) : (
              chatHistory.map((msg, i) => (
                <ChatBubble key={i} msg={msg} renderMd={renderMd} />
              ))
            )}
            {isAsking && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 shadow-sm rounded-2xl rounded-bl-sm px-4 py-3.5 flex gap-1.5 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-pulse-dot" />
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-pulse-dot [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-pulse-dot [animation-delay:0.4s]" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-4 bg-white border-t border-gray-200 shrink-0">
            <form onSubmit={handleAskQuestion} className="relative">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask about this document..."
                disabled={isAsking}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-4 pr-12 py-3 text-[0.9rem] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!question.trim() || isAsking}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Chat Bubble Component ── */
function ChatBubble({ msg, renderMd }: { msg: any; renderMd: (t: string) => React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  const isUser = msg.role === "user";

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className={`flex group ${isUser ? "justify-end" : "justify-start"}`}>
      <div className="flex flex-col max-w-[85%]">
        <div
          className={`rounded-2xl px-4 py-2.5 text-[0.9rem] shadow-sm ${isUser
            ? "bg-indigo-600 text-white rounded-br-sm"
            : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm"
            }`}
        >
          <div className="whitespace-pre-wrap break-words leading-relaxed">
            {isUser ? msg.content : renderMd(msg.content)}
          </div>
        </div>
        {!isUser && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 mt-1 ml-1 px-1.5 py-0.5 rounded text-[0.7rem] font-medium text-gray-400 hover:text-gray-700 opacity-0 group-hover:opacity-100 transition-all self-start"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? "Copied" : "Copy"}
          </button>
        )}
      </div>
    </div>
  );
}
