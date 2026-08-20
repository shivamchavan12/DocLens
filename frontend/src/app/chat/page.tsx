"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";

type Role = "user" | "assistant" | "system";
interface Message { id: string; role: Role; content: string; isThinking?: boolean; }
interface Conversation { id: string; title: string; messages: Message[]; }

const uid = () => Math.random().toString(36).slice(2, 9);
const ACCEPTED = "application/pdf,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.xlsx,image/png,image/jpeg";

function fileLabel(name: string) {
  const e = name.split(".").pop()?.toLowerCase() ?? "";
  if (e === "pdf") return "PDF";
  if (["doc","docx"].includes(e)) return "DOC";
  if (["xls","xlsx"].includes(e)) return "XLS";
  return "FILE";
}

/* ── Icons ── */
const IconPlus = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconSend = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
const IconClip = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>;
const IconCopy = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>;
const IconCheck = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IconSearch = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IconMsg = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>;
const IconKey = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>;

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [bearerToken, setBearerToken] = useState("");
  const [tokenSaved, setTokenSaved] = useState(false);
  const [showTokenPanel, setShowTokenPanel] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const textaRef = useRef<HTMLTextAreaElement>(null);

  const activeConvo = conversations.find(c => c.id === activeId);
  const messages = activeConvo?.messages ?? [];

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => {
    const ta = textaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 240) + "px";
  }, [input]);

  const filteredConvos = conversations.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function createConvo(clearFile = true): string {
    const id = uid();
    const c: Conversation = { id, title: "New conversation", messages: [] };
    setConversations(prev => [c, ...prev]);
    setActiveId(id);
    if (clearFile) {
      setFile(null);
    }
    return id;
  }

  function pushMsg(convoId: string, role: Role, content: string, isThinking = false) {
    const msgId = uid();
    setConversations(prev => prev.map(c =>
      c.id === convoId
        ? { ...c, messages: [...c.messages, { id: msgId, role, content, isThinking }] }
        : c
    ));
    return msgId;
  }

  function updateMsg(convoId: string, msgId: string, content: string, isThinking = false) {
    setConversations(prev => prev.map(c =>
      c.id === convoId
        ? { ...c, messages: c.messages.map(m => m.id === msgId ? { ...m, content, isThinking } : m) }
        : c
    ));
  }

  function renameConvo(convoId: string, title: string) {
    setConversations(prev => prev.map(c => c.id === convoId ? { ...c, title } : c));
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
  }, []);

  async function handleSend() {
    const q = input.trim();
    if (!q || isLoading) return;
    if (!bearerToken) { setShowTokenPanel(true); return; }
    if (!file) return;

    let cid = activeId;
    if (!cid) cid = createConvo(false);

    const convo = conversations.find(c => c.id === cid);
    if (convo && convo.title === "New conversation") {
      renameConvo(cid, q.length > 35 ? q.slice(0, 35) + "..." : q);
    }

    pushMsg(cid, "user", q);
    setInput("");
    const tid = pushMsg(cid, "assistant", "", true);
    setIsLoading(true);

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("questions", JSON.stringify([q]));
      const res = await fetch("http://localhost:8000/hackrx/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${bearerToken}` },
        body: form,
      });
      if (!res.ok) {
        let detail = "Request failed.";
        try { detail = (await res.json()).detail || detail; } catch {}
        throw new Error(detail);
      }
      const data = await res.json();
      updateMsg(cid, tid, data.answers?.[0] ?? "No answer returned.");
    } catch (err: any) {
      updateMsg(cid, tid, `Error: ${err.message || "Connection failed."}`);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  function copyText(text: string, btnEl: HTMLButtonElement) {
    navigator.clipboard.writeText(text);
    btnEl.dataset.copied = "true";
    setTimeout(() => { btnEl.dataset.copied = "false"; }, 1500);
  }

  return (
    <div className="flex h-screen bg-[#F9FAFB] overflow-hidden font-sans text-gray-900">
      
      {/* ── SIDEBAR ── */}
      {sidebarOpen && (
        <aside className="w-[280px] h-full flex flex-col bg-white border-r border-gray-200 shrink-0 shadow-sm z-10">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-gray-900 flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </div>
              <span className="text-[0.95rem] font-bold text-gray-900 tracking-tight">Inquira</span>
            </Link>
          </div>

          {/* New Chat Button */}
          <div className="p-4 pb-2">
            <button
              onClick={() => { createConvo(); }}
              className="w-full h-10 flex items-center justify-center gap-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
            >
              <IconPlus /> New chat
            </button>
          </div>

          {/* Search */}
          <div className="px-4 py-2">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><IconSearch /></span>
              <input
                type="text"
                placeholder="Search history..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-[0.85rem] bg-gray-50 border border-transparent rounded-md text-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all"
              />
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto px-3 py-2">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2 mt-2">Recent</div>
            {filteredConvos.length === 0 && (
              <p className="text-[0.85rem] text-gray-400 px-2">No history</p>
            )}
            {filteredConvos.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-left text-[0.88rem] truncate transition-all mb-0.5 group ${
                  c.id === activeId
                    ? "bg-gray-100 text-gray-900 font-semibold"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span className={`shrink-0 ${c.id === activeId ? "text-gray-900" : "text-gray-400 group-hover:text-gray-500"}`}><IconMsg /></span>
                <span className="truncate">{c.title}</span>
              </button>
            ))}
          </div>

          {/* Footer Settings */}
          <div className="p-4 border-t border-gray-100 bg-gray-50/50">
            <button
              onClick={() => setShowTokenPanel(v => !v)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[0.88rem] font-medium transition-all border ${
                tokenSaved ? "bg-white border-gray-200 text-gray-800 shadow-sm" : "bg-transparent border-transparent text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span className={tokenSaved ? "text-green-600" : "text-gray-400"}><IconKey /></span>
              <span>{tokenSaved ? "API Configured" : "Set API Token"}</span>
            </button>
          </div>
        </aside>
      )}

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F9FAFB]">
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-5 border-b border-gray-200 bg-white/80 backdrop-blur-md shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(v => !v)} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-500 transition-colors" title="Toggle Sidebar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <span className="text-[0.95rem] font-semibold text-gray-800 ml-1">{activeConvo?.title ?? "Document Analysis"}</span>
          </div>
          
          <div className="flex items-center gap-3">
            {file && (
              <div className="flex items-center gap-2.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-[0.8rem] text-gray-700 shadow-sm">
                <span className="font-bold text-gray-900">{fileLabel(file.name)}</span>
                <span className="max-w-[150px] truncate text-gray-500">{file.name}</span>
                <button onClick={() => setFile(null)} className="text-gray-400 hover:text-red-500 transition-colors ml-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            )}
            <Link href="/" className="flex items-center gap-2 px-3 py-1.5 text-[0.85rem] font-semibold text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-all shadow-sm" title="Back to Home">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
              Home
            </Link>
          </div>
        </div>

        {/* Token Panel Alert */}
        {showTokenPanel && (
          <div className="m-6 p-5 bg-white border border-gray-200 rounded-xl shadow-sm animate-slide-up">
            <h3 className="text-[0.95rem] font-bold text-gray-900 mb-1">Authentication Required</h3>
            <p className="text-[0.85rem] text-gray-500 mb-4">Enter your Bearer token to connect to the Inquira API.</p>
            <div className="flex gap-3">
              <input
                type="password"
                className="flex-1 h-10 px-3.5 text-[0.9rem] bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 focus:ring-4 focus:ring-gray-100 transition-all"
                placeholder="Bearer token"
                value={bearerToken}
                onChange={e => setBearerToken(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && bearerToken.trim()) { setTokenSaved(true); setShowTokenPanel(false); }}}
              />
              <button
                className="h-10 px-5 bg-gray-900 text-white text-[0.9rem] font-semibold rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
                onClick={() => { if (bearerToken.trim()) { setTokenSaved(true); setShowTokenPanel(false); }}}
              >
                Save Token
              </button>
            </div>
          </div>
        )}

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            /* Welcome / Empty State */
            <div className="h-full flex flex-col items-center justify-center px-6">
              <div className="w-12 h-12 mb-5 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">How can I help you today?</h2>
              <p className="text-[0.95rem] text-gray-500 leading-relaxed mb-8 max-w-[420px] text-center">
                Upload a document to the workspace. The AI will analyze its contents and answer questions based strictly on the provided context.
              </p>
              <div className="grid grid-cols-2 gap-3 max-w-[500px] w-full">
                {["Summarize the main points", "What are the key terms?", "Extract financial metrics", "Find risk factors"].map(q => (
                  <button key={q} onClick={() => setInput(q)} className="px-4 py-3 text-[0.88rem] font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all text-left">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto py-8 flex flex-col gap-8 px-6">
              {messages.map(m => (
                <MessageBubble key={m.id} message={m} onCopy={copyText} />
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="px-6 pb-6 pt-2 shrink-0 max-w-4xl w-full mx-auto">
          
          {/* Document Dropzone */}
          {!file && (
            <div
              className={`mb-4 border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${
                isDragging ? "border-gray-900 bg-gray-50" : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
              }`}
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
            >
              <IconClip />
              <p className="text-[0.95rem] font-semibold text-gray-700 mt-1">Upload source document</p>
              <p className="text-[0.8rem] text-gray-400">Drag & drop or click to browse (PDF, Word, Excel, Images)</p>
              <input ref={fileRef} type="file" accept={ACCEPTED} hidden onChange={e => e.target.files?.[0] && setFile(e.target.files[0])} />
            </div>
          )}

          {/* Premium Input Box */}
          <div className="relative bg-white border border-gray-200 rounded-2xl shadow-sm focus-within:ring-4 focus-within:ring-gray-100 focus-within:border-gray-300 transition-all flex flex-col overflow-hidden">
            <textarea
              ref={textaRef}
              className="w-full bg-transparent text-[0.95rem] text-gray-900 placeholder-gray-400 resize-none focus:outline-none px-4 pt-4 pb-12 min-h-[56px] max-h-[300px] leading-relaxed"
              placeholder={file ? "Message Inquira..." : "Upload a document to start chatting..."}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
            />
            
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
              <button
                onClick={() => fileRef.current?.click()}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                title="Attach file"
              >
                <IconClip />
                <input ref={fileRef} type="file" accept={ACCEPTED} hidden onChange={e => e.target.files?.[0] && setFile(e.target.files[0])} />
              </button>

              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Send"
              >
                {isLoading ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <IconSend />
                )}
              </button>
            </div>
          </div>
          <p className="text-center text-[0.75rem] text-gray-400 mt-3 font-medium">Inquira may produce inaccurate information. Verify source data.</p>
        </div>
      </div>
    </div>
  );
}

/* ── Message Bubble ── */
function renderMd(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i} className="font-bold text-gray-900">{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>
  );
}

function MessageBubble({ message, onCopy }: { message: Message; onCopy: (text: string, el: HTMLButtonElement) => void }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  if (message.role === "system") {
    return (
      <div className="flex justify-center animate-fade-in">
        <span className="px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-md text-[0.75rem] font-medium text-gray-500">{message.content}</span>
      </div>
    );
  }

  return (
    <div className={`group flex gap-4 animate-slide-up ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[0.8rem] border shadow-sm ${
        isUser 
          ? "bg-white border-gray-200 text-gray-700" 
          : "bg-gray-900 border-gray-900 text-white"
      }`}>
        {isUser ? "U" : "IQ"}
      </div>

      {/* Content Area */}
      <div className={`flex flex-col max-w-[85%] ${isUser ? "items-end" : "items-start"}`}>
        <span className="text-[0.8rem] font-bold text-gray-900 mb-1">{isUser ? "You" : "Inquira"}</span>
        
        <div className={`px-5 py-3.5 text-[0.95rem] leading-relaxed shadow-sm ${
          isUser 
            ? "bg-gray-100 text-gray-800 rounded-2xl rounded-tr-sm" 
            : "bg-white border border-gray-200 text-gray-800 rounded-2xl rounded-tl-sm"
        }`}>
          {message.isThinking ? (
            <div className="flex items-center gap-1.5 h-6 px-1">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse-dot" />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse-dot [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse-dot [animation-delay:0.4s]" />
            </div>
          ) : (
            <div className="whitespace-pre-wrap break-words">{renderMd(message.content)}</div>
          )}
        </div>

        {/* Action Row */}
        {!isUser && !message.isThinking && (
          <div className="flex items-center gap-1.5 mt-2 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                navigator.clipboard.writeText(message.content);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="flex items-center gap-1.5 px-2 py-1 rounded text-[0.75rem] font-medium text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              {copied ? <IconCheck /> : <IconCopy />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
