"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FileText, ArrowLeft, Send, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
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
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (user && docId) {
      loadDocument();
      loadChat();
    }
  }, [user, loading, docId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    setChatHistory(prev => [...prev, userMsg]);
    setQuestion("");
    setIsAsking(true);

    try {
      const res = await api.chatWithDocument(docId, userMsg.content);
      setChatHistory(prev => [...prev, { role: "assistant", content: res.answer }]);
    } catch (err) {
      console.error(err);
      setChatHistory(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an error answering that." }]);
    } finally {
      setIsAsking(false);
    }
  };

  if (loading || !doc) return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-64px)] flex flex-col">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => router.push("/")}
          className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <FileText className="text-blue-400" />
            {doc.filename}
          </h1>
          <p className="text-sm text-neutral-400">Analyzed on {new Date(doc.upload_timestamp).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 min-h-0">
        
        {/* Left Column: Summary */}
        <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6 overflow-y-auto custom-scrollbar">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="text-yellow-400 w-5 h-5" />
            <h2 className="text-xl font-bold text-white">AI Summary & Analysis</h2>
            <span className="ml-auto text-xs font-medium bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full border border-blue-500/30">
              {doc.summary_length.toUpperCase()}
            </span>
          </div>

          <div className="space-y-8">
            <section>
              <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-3">Executive Summary</h3>
              <p className="text-neutral-200 leading-relaxed">{doc.summary}</p>
            </section>

            {doc.key_points && doc.key_points.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-3">Key Points</h3>
                <ul className="space-y-2">
                  {doc.key_points.map((pt: string, i: number) => (
                    <li key={i} className="flex gap-3 text-neutral-200">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {doc.main_ideas && doc.main_ideas.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-3">Main Ideas</h3>
                <div className="flex flex-wrap gap-2">
                  {doc.main_ideas.map((idea: string, i: number) => (
                    <span key={i} className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-sm text-neutral-300">
                      {idea}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {doc.improvement_suggestions && doc.improvement_suggestions.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-3">Insights / Action Items</h3>
                <div className="bg-blue-900/20 border border-blue-500/20 rounded-xl p-4 space-y-2">
                  {doc.improvement_suggestions.map((sug: string, i: number) => (
                    <div key={i} className="flex gap-3 text-blue-200 text-sm">
                      <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                      <p>{sug}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Right Column: Q&A Chat */}
        <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/10 rounded-3xl flex flex-col overflow-hidden relative">
          <div className="p-4 border-b border-white/10 bg-black/20">
            <h2 className="font-semibold text-white">Ask Questions</h2>
            <p className="text-xs text-neutral-400">Chat with this document</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {chatHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-neutral-500">
                <Sparkles className="w-8 h-8 mb-2 opacity-50" />
                <p>Ask anything about this document.</p>
              </div>
            ) : (
              chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-br-none' 
                      : 'bg-white/10 text-neutral-200 border border-white/5 rounded-bl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              ))
            )}
            {isAsking && (
              <div className="flex justify-start">
                <div className="bg-white/10 border border-white/5 rounded-2xl rounded-bl-none px-4 py-4 flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 bg-black/20 border-t border-white/10">
            <form onSubmit={handleAskQuestion} className="relative">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Type your question..."
                disabled={isAsking}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
              />
              <button 
                type="submit"
                disabled={!question.trim() || isAsking}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white disabled:opacity-50 transition-colors"
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
