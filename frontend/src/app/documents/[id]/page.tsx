"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
  MessageCircle,
  X,
  Loader2,
  Languages,
} from "lucide-react";
import { api } from "@/lib/api";

export default function DocumentWorkspace() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const docId = params.id as string;

  const [doc, setDoc] = useState<any>(null);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [question, setQuestion] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [embeddingStatus, setEmbeddingStatus] = useState<"processing" | "ready" | "failed" | "unknown">("unknown");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  const LANGUAGES = [
    // Global Languages
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'zh', name: 'Mandarin Chinese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'ar', name: 'Arabic' },
    { code: 'tr', name: 'Turkish' },
    { code: 'nl', name: 'Dutch' },
    { code: 'pl', name: 'Polish' },
    { code: 'id', name: 'Indonesian' },
    
    // Indian Regional Languages
    { code: 'hi', name: 'Hindi' },
    { code: 'mr', name: 'Marathi' },
    { code: 'ta', name: 'Tamil' },
    { code: 'te', name: 'Telugu' },
    { code: 'bn', name: 'Bengali' },
    { code: 'gu', name: 'Gujarati' },
    { code: 'kn', name: 'Kannada' },
    { code: 'ml', name: 'Malayalam' },
    { code: 'or', name: 'Odia' },
    { code: 'pa', name: 'Punjabi' },
    { code: 'ur', name: 'Urdu' },
    { code: 'sa', name: 'Sanskrit' }
  ];

  const handleTranslate = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value;
    if (!lang || !docId) return;
    
    setIsTranslating(true);
    try {
      const result = await api.translateSummary(docId, lang);
      setDoc((prev: any) => ({
        ...prev,
        summary: result.summary,
        key_points: result.key_points
      }));
    } catch (err) {
      console.error("Translation failed:", err);
      alert("Failed to translate the document. Please try again.");
    } finally {
      setIsTranslating(false);
      e.target.value = ""; // Reset dropdown after translation
    }
  };

  useEffect(() => {
    if (!loading && docId) {
      loadDocument();
      loadChat();
    }
  }, [user, loading, docId]);

  // Polling for embedding status
  useEffect(() => {
    if (!docId) return;
    
    let pollCount = 0;
    
    const checkStatus = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/documents/${docId}/status`);
        if (res.ok) {
          const data = await res.json();
          setEmbeddingStatus(data.status);
          
          // Stop polling if done, failed, or if the backend forgot about it (unknown) after restart
          if (data.status === "ready" || data.status === "failed" || data.status === "unknown") {
            // If it's unknown, we fallback to ready to allow the user to at least try chatting
            if (data.status === "unknown") setEmbeddingStatus("ready");
            return true; // stop polling
          }
        }
      } catch (err) {
        console.error("Failed to check status:", err);
      }
      
      pollCount++;
      // Hard stop after 20 attempts (1 minute) to prevent infinite loops
      if (pollCount >= 20) {
        setEmbeddingStatus("failed");
        return true;
      }
      return false;
    };

    // Check immediately
    checkStatus().then(done => {
      if (!done) {
        // Start polling every 3 seconds if not done
        const interval = setInterval(async () => {
          const isDone = await checkStatus();
          if (isDone) clearInterval(interval);
        }, 3000);
        return () => clearInterval(interval);
      }
    });
  }, [docId]);

  useEffect(() => {
    if (isChatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, isChatOpen]);

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

  if (loading || !doc) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50/50 relative overflow-hidden">
      {/* Breadcrumb Header */}
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 px-6 lg:px-8 py-4 border-b border-gray-200 bg-white shrink-0 sticky top-0 z-10 shadow-sm"
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

      {/* Main Centered Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <div className="p-8 lg:p-12 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 border border-indigo-100/50">
              <Sparkles className="w-6 h-6 text-indigo-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4 tracking-tight">Intelligence Summary</h1>
            
            <div className="mb-8 flex flex-wrap justify-center items-center gap-3">
              <span className="text-[0.7rem] font-semibold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full uppercase tracking-wider border border-indigo-100">
                {doc.summary_length} Output
              </span>
              
              <div className="relative inline-flex items-center">
                <Languages className="w-3.5 h-3.5 text-gray-400 absolute left-3" />
                <select 
                  onChange={handleTranslate}
                  disabled={isTranslating}
                  className="pl-8 pr-8 py-1 text-[0.75rem] font-medium bg-white border border-gray-200 text-gray-700 rounded-full hover:bg-gray-50 focus:outline-none focus:border-indigo-300 transition-colors disabled:opacity-50 appearance-none shadow-sm cursor-pointer"
                >
                  <option value="">{isTranslating ? 'Translating...' : 'Translate to...'}</option>
                  {LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.name}>{lang.name}</option>
                  ))}
                </select>
                <ChevronRight className="w-3 h-3 text-gray-400 absolute right-3 rotate-90" />
              </div>
            </div>

            <section className="w-full text-left mb-10">
              <h3 className="text-[0.75rem] font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center justify-center gap-2">
                <File className="w-3 h-3" />
                Executive Summary
              </h3>
              <div className="text-[1.05rem] text-gray-700 leading-relaxed whitespace-pre-wrap text-justify">
                {renderMd(doc.summary)}
              </div>
            </section>

            {doc.key_points && doc.key_points.length > 0 && (
              <section className="w-full text-left bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <h3 className="text-[0.75rem] font-semibold text-gray-400 uppercase tracking-wider mb-4 text-center">
                  Key Points
                </h3>
                <ul className="space-y-4">
                  {doc.key_points.map((pt: string, i: number) => (
                    <li key={i} className="flex gap-4 items-start text-[1rem] text-gray-700 leading-relaxed">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="w-full pt-8 mt-10 border-t border-gray-100">
              <div className="text-[0.85rem] text-gray-400 flex flex-col sm:flex-row items-center justify-center gap-4">
                <p>Uploaded: {new Date(doc.upload_timestamp).toLocaleString()}</p>
                <span className="hidden sm:inline">•</span>
                <p>ID: <span className="font-mono text-[0.8rem]">{doc.id}</span></p>
              </div>
            </section>
          </div>
        </motion.div>
      </div>

      {/* Floating Chat Agent */}
      <div className="absolute bottom-6 right-8 z-50 flex flex-col items-end justify-end">
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="mb-4 w-[calc(100vw-64px)] sm:w-[400px] max-w-[400px] h-[500px] max-h-[calc(100vh-140px)] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col origin-bottom-right"
            >
              <div className="p-4 bg-indigo-600 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-200" />
                  <h3 className="font-semibold text-sm">DocLens AI</h3>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="text-indigo-200 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 custom-scrollbar">
                {chatHistory.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center px-4">
                    <MessageCircle className="w-8 h-8 mb-3 opacity-40" />
                    <p className="text-[0.9rem]">Ask me anything about this document. I have already read it for you.</p>
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

              <div className="p-3 bg-white border-t border-gray-100 shrink-0">
                <form onSubmit={handleAskQuestion} className="relative">
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Type your question..."
                    disabled={isAsking}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-4 pr-10 py-2.5 text-[0.9rem] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!question.trim() || isAsking}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Toggle Button */}
        <button
          onClick={() => embeddingStatus === "ready" && setIsChatOpen(!isChatOpen)}
          disabled={embeddingStatus === "processing"}
          className={`flex items-center gap-3 px-5 py-3.5 rounded-full shadow-xl text-sm font-semibold transition-all transform hover:scale-105 active:scale-95 ${
            embeddingStatus === "ready"
              ? "bg-indigo-600 hover:bg-indigo-700 text-white"
              : embeddingStatus === "failed"
              ? "bg-red-50 text-red-600 border border-red-200"
              : "bg-white text-gray-600 border border-gray-200 cursor-wait"
          }`}
        >
          {embeddingStatus === "processing" ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
              <span>Initializing AI...</span>
            </>
          ) : embeddingStatus === "failed" ? (
            <>
              <X className="w-5 h-5" />
              <span>Chat Unavailable</span>
            </>
          ) : isChatOpen ? (
            <>
              <X className="w-5 h-5" />
              <span>Close AI</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Chat with DocLens</span>
            </>
          )}
        </button>
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
