"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, FileText, ArrowRight, Loader2, Trash2 } from "lucide-react";
import { api } from "@/lib/api";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [documents, setDocuments] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [summaryLength, setSummaryLength] = useState<'short' | 'medium' | 'long'>('medium');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (user) {
      loadDocuments();
    }
  }, [user, loading, router]);

  const loadDocuments = async () => {
    try {
      const data = await api.getDocuments();
      setDocuments(data.documents);
    } catch (err) {
      console.error("Failed to load documents", err);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadStatus("Uploading & Analyzing...");
      
      const result = await api.uploadDocument(file, summaryLength);
      
      // Navigate to the document workspace
      router.push(`/documents/${result.document_id}`);
    } catch (err: any) {
      console.error("Upload error", err);
      setUploadStatus("Error: " + err.message);
      setIsUploading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this document?")) return;
    
    try {
      await api.deleteDocument(docId);
      setDocuments(documents.filter(d => d.id !== docId));
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  if (loading || !user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Upload Zone (Left Column) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative overflow-hidden">
            <h2 className="text-2xl font-bold text-white mb-6">Analyze New Document</h2>
            
            <div className="mb-6 flex gap-4">
              {['short', 'medium', 'long'].map((len) => (
                <button
                  key={len}
                  onClick={() => setSummaryLength(len as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    summaryLength === len 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {len.charAt(0).toUpperCase() + len.slice(1)} Summary
                </button>
              ))}
            </div>

            <div 
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
                isUploading ? 'border-blue-500/50 bg-blue-500/5' : 'border-neutral-700 hover:border-blue-500 hover:bg-white/5 cursor-pointer'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".pdf,.docx,.txt,.csv,.xlsx,.pptx,image/*"
              />
              
              {isUploading ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                  <p className="text-lg font-medium text-white">{uploadStatus}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                    <UploadCloud className="w-8 h-8 text-blue-500" />
                  </div>
                  <p className="text-lg font-medium text-white mb-2">Click or drag document here</p>
                  <p className="text-sm text-neutral-400">Supports PDF, DOCX, XLSX, PPTX, Images</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Documents (Right Column) */}
        <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6 h-[600px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Recent Documents</h2>
            <span className="text-xs bg-white/10 text-white px-2 py-1 rounded-full">{documents.length}</span>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            <AnimatePresence>
              {documents.length === 0 ? (
                <p className="text-neutral-500 text-center py-8">No documents analyzed yet.</p>
              ) : (
                documents.map((doc, i) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => router.push(`/documents/${doc.id}`)}
                    className="bg-black/40 border border-white/5 rounded-xl p-4 hover:border-blue-500/50 hover:bg-white/5 cursor-pointer transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-medium truncate" title={doc.filename}>{doc.filename}</p>
                          <p className="text-xs text-neutral-500">
                            {new Date(doc.upload_timestamp).toLocaleDateString()} • {doc.summary_length} summary
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => handleDelete(e, doc.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-neutral-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
        
      </div>
    </div>
  );
}
