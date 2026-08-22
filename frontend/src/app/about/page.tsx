"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { 
  ArrowLeft, Cpu, FileText, Globe, Image as ImageIcon, 
  ShieldCheck, Zap, Database, Server, Code, Sparkles, CheckCircle2 
} from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 selection:bg-indigo-100 selection:text-indigo-900 pb-20">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center text-gray-500 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="font-medium text-sm">Back to Dashboard</span>
          </Link>
          <div className="flex items-center space-x-2 bg-indigo-50 px-3 py-1.5 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <span className="text-xs font-semibold text-indigo-700 tracking-wide uppercase">System Active</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center justify-center p-4 bg-indigo-100 rounded-3xl mb-8 shadow-sm">
            <Cpu className="w-10 h-10 text-indigo-600" />
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6">
            DocLens Intelligence Engine
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            An enterprise-grade document intelligence platform engineered for speed, accuracy, and scale. DocLens bypasses traditional parsing limitations by leveraging multi-stage extraction algorithms, robust vector search, and dynamic global translation to turn static files into actionable intelligence.
          </p>
        </motion.div>

        {/* Engineering Highlights */}
        <div className="mb-8 flex items-center gap-2">
          <Code className="w-6 h-6 text-indigo-600" />
          <h2 className="text-2xl font-bold text-gray-900">Core Engineering Highlights</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-all group">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Universal Document Parsing</h3>
            <p className="text-gray-600 leading-relaxed text-sm">
              DocLens doesn't just read text; it deeply understands file structures. It effortlessly handles PDFs, PPTXs, spreadsheets, and emails. For Word documents (`.docx`), it bypasses the strict limitations of standard libraries by manually unzipping and parsing the internal XML structure, ensuring 100% data recovery even from malformed files.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-all group">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ImageIcon className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Targeted Embedded OCR</h3>
            <p className="text-gray-600 leading-relaxed text-sm">
              Traditional parsers stall out by blindly OCRing entire pages, creating massive performance bottlenecks and duplicating text. DocLens utilizes a dynamic per-page evaluation engine that isolates only the embedded pictures and screenshots within documents, running targeted Tesseract OCR exclusively on images to merge perfect text seamlessly.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-all group">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Vector-Driven RAG Chat</h3>
            <p className="text-gray-600 leading-relaxed text-sm">
              Extracted data isn't just summarized; it's converted into high-dimensional vectors using `SentenceTransformers`. These vectors are indexed into a local, high-speed FAISS database. User queries invoke a Retrieval-Augmented Generation (RAG) pipeline that guarantees LLM answers are strictly grounded in the document context.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-all group">
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Globe className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Dynamic Multi-Lingual Engine</h3>
            <p className="text-gray-600 leading-relaxed text-sm">
              The AI auto-detects the document's native language and dynamically generates organic insights in that language. Additionally, users can instantly translate insights into 25+ global languages and 22 regional Indian languages (Hindi, Tamil, Sanskrit, etc.) using a zero-latency UI layer.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-all group">
            <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6 text-rose-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">High-Availability Failover</h3>
            <p className="text-gray-600 leading-relaxed text-sm">
              Built for enterprise SLA standards. The backend primary logic routes through Google Gemini Pro. If the engine detects a rate limit, timeout, or quota exhaustion, it transparently fails over to a secondary Mistral AI API without dropping the client request or disrupting the user experience.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-all group">
            <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6 text-teal-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Frictionless Architecture</h3>
            <p className="text-gray-600 leading-relaxed text-sm">
              User onboarding is completely frictionless. The system employs silent `guest_` JWT tokens securely stored in browser `localStorage`. All document states, embeddings, and chat histories are mapped strictly to these local profiles via Supabase (PostgreSQL), ensuring robust session persistence without forcing user registration.
            </p>
          </motion.div>
        </div>

        {/* System Architecture Section */}
        <div className="mb-8 flex items-center gap-2">
          <Server className="w-6 h-6 text-gray-900" />
          <h2 className="text-2xl font-bold text-gray-900">System Architecture & Pipeline</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ delay: 0.7 }}
            className="bg-gray-900 rounded-3xl p-8 md:p-10 text-white shadow-xl"
          >
            <h3 className="text-xl font-bold mb-6 flex items-center border-b border-gray-700 pb-4">
              <Database className="w-5 h-5 mr-3 text-indigo-400" /> Technology Stack
            </h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-indigo-300 font-semibold mb-2 uppercase text-xs tracking-wider">Frontend Edge</h4>
                <ul className="space-y-2">
                  <li className="flex items-start"><CheckCircle2 className="w-4 h-4 text-green-400 mr-2 mt-0.5 shrink-0" /><span className="text-gray-300 text-sm">Next.js 14 App Router (React 19)</span></li>
                  <li className="flex items-start"><CheckCircle2 className="w-4 h-4 text-green-400 mr-2 mt-0.5 shrink-0" /><span className="text-gray-300 text-sm">Tailwind CSS & Framer Motion UI</span></li>
                  <li className="flex items-start"><CheckCircle2 className="w-4 h-4 text-green-400 mr-2 mt-0.5 shrink-0" /><span className="text-gray-300 text-sm">Firebase Authentication (Persistent)</span></li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-indigo-300 font-semibold mb-2 uppercase text-xs tracking-wider">Backend Core</h4>
                <ul className="space-y-2">
                  <li className="flex items-start"><CheckCircle2 className="w-4 h-4 text-green-400 mr-2 mt-0.5 shrink-0" /><span className="text-gray-300 text-sm">FastAPI (Python 3.12) / Uvicorn</span></li>
                  <li className="flex items-start"><CheckCircle2 className="w-4 h-4 text-green-400 mr-2 mt-0.5 shrink-0" /><span className="text-gray-300 text-sm">Supabase (PostgreSQL) Database</span></li>
                  <li className="flex items-start"><CheckCircle2 className="w-4 h-4 text-green-400 mr-2 mt-0.5 shrink-0" /><span className="text-gray-300 text-sm">Tesseract OCR & PyMuPDF Parsers</span></li>
                </ul>
              </div>

              <div>
                <h4 className="text-indigo-300 font-semibold mb-2 uppercase text-xs tracking-wider">Machine Learning</h4>
                <ul className="space-y-2">
                  <li className="flex items-start"><CheckCircle2 className="w-4 h-4 text-green-400 mr-2 mt-0.5 shrink-0" /><span className="text-gray-300 text-sm">Google Gemini Pro & Mistral AI</span></li>
                  <li className="flex items-start"><CheckCircle2 className="w-4 h-4 text-green-400 mr-2 mt-0.5 shrink-0" /><span className="text-gray-300 text-sm">FAISS (Facebook AI Similarity Search)</span></li>
                  <li className="flex items-start"><CheckCircle2 className="w-4 h-4 text-green-400 mr-2 mt-0.5 shrink-0" /><span className="text-gray-300 text-sm">SentenceTransformers (all-MiniLM-L6-v2)</span></li>
                </ul>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ delay: 0.8 }}
            className="bg-white rounded-3xl p-8 md:p-10 border border-gray-200 shadow-xl"
          >
            <h3 className="text-xl font-bold mb-6 text-gray-900 border-b border-gray-100 pb-4">
              Data Pipeline Execution
            </h3>
            
            <div className="relative border-l-2 border-indigo-100 ml-3 space-y-8 pb-4">
              <div className="relative">
                <div className="absolute -left-[21px] top-1 h-10 w-10 rounded-full bg-indigo-50 border-4 border-white flex items-center justify-center">
                  <span className="text-indigo-600 font-bold text-sm">1</span>
                </div>
                <div className="pl-8">
                  <h4 className="font-semibold text-gray-900">Ingestion & Detection</h4>
                  <p className="text-sm text-gray-600 mt-1">Multi-part form data is streamed to the backend. The MIME type dictates the routing to specialized extractors (XML traversal, pixel scanning, etc).</p>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -left-[21px] top-1 h-10 w-10 rounded-full bg-indigo-50 border-4 border-white flex items-center justify-center">
                  <span className="text-indigo-600 font-bold text-sm">2</span>
                </div>
                <div className="pl-8">
                  <h4 className="font-semibold text-gray-900">Parallel Processing Engine</h4>
                  <p className="text-sm text-gray-600 mt-1">Text is simultaneously routed to the <b>SummaryService</b> (for LLM insight extraction) and the <b>EmbeddingGenerator</b> (for semantic chunking and FAISS indexing).</p>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -left-[21px] top-1 h-10 w-10 rounded-full bg-indigo-50 border-4 border-white flex items-center justify-center">
                  <span className="text-indigo-600 font-bold text-sm">3</span>
                </div>
                <div className="pl-8">
                  <h4 className="font-semibold text-gray-900">RAG Resolution</h4>
                  <p className="text-sm text-gray-600 mt-1">When users query the document, a vector distance calculation (L2) retrieves the top 4 semantic chunks. A highly strict prompt prevents external LLM hallucination.</p>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -left-[21px] top-1 h-10 w-10 rounded-full bg-indigo-50 border-4 border-white flex items-center justify-center">
                  <span className="text-indigo-600 font-bold text-sm">4</span>
                </div>
                <div className="pl-8">
                  <h4 className="font-semibold text-gray-900">State Persistence</h4>
                  <p className="text-sm text-gray-600 mt-1">Finalized JSON contexts, summaries, and chat arrays are synchronized to Supabase, paired intimately with the user's secure token.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

      </main>
    </div>
  );
}
