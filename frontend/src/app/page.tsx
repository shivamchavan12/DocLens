"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  UploadCloud,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Info,
} from "lucide-react";
import { api } from "@/lib/api";
import { AuthModal } from "@/components/AuthModal";
import { AuthPromptModal } from "@/components/AuthPromptModal";

export default function Dashboard() {
  const { user, loading, isGuest } = useAuth();
  const router = useRouter();


  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "processing" | "success" | "error">("idle");
  const [uploadMessage, setUploadMessage] = useState("");
  const [summaryLength, setSummaryLength] = useState<"short" | "medium" | "long">("medium");
  const [isDragging, setIsDragging] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [guestPromptShown, setGuestPromptShown] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);



  const handleFileUpload = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    // If guest, show prompt on first interaction
    if (isGuest && !guestPromptShown) {
      setGuestPromptShown(true);
      setShowAuthPrompt(true);
    }

    try {
      setIsUploading(true);
      setUploadStatus("uploading");
      setUploadMessage("Uploading document...");

      // Transition to processing after a moment
      const processingTimer = setTimeout(() => {
        setUploadStatus("processing");
        setUploadMessage("Analyzing contents with AI...");
      }, 1500);

      const result = await api.uploadDocument(file, summaryLength);
      clearTimeout(processingTimer);

      setUploadStatus("success");
      setUploadMessage("Analysis complete!");

      setTimeout(() => {
        router.push(`/documents/${result.document_id}`);
      }, 800);
    } catch (err: any) {
      console.error("Upload error", err);
      setUploadStatus("error");
      setUploadMessage(err.message || "Failed to analyze document.");
      setIsUploading(false);
      setTimeout(() => setUploadStatus("idle"), 5000);
    }
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-10 space-y-10">
        {/* Page Header */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="text-center relative flex items-center justify-center">
          <div className="absolute right-0 top-0">
            <Link href="/about" className="text-gray-400 hover:text-indigo-600 transition-colors p-2 rounded-full hover:bg-gray-100 flex" title="About DocLens">
              <Info className="w-6 h-6" />
            </Link>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Knowledge Base</h1>
            <p className="text-[0.95rem] text-gray-500 mt-1">Upload documents to extract intelligence and chat with their contents.</p>
          </div>
        </motion.div>

        {/* Upload Card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden"
        >
          <div className="p-6 pb-4 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-[1rem] font-semibold text-gray-900">New Analysis</h2>
                <p className="text-[0.85rem] text-gray-500">Select summary detail and upload your document.</p>
              </div>
              <div className="flex bg-gray-100 p-1 rounded-lg shrink-0">
                {(["short", "medium", "long"] as const).map((len) => (
                  <button
                    key={len}
                    onClick={() => !isUploading && setSummaryLength(len)}
                    disabled={isUploading}
                    className={`px-4 py-1.5 text-[0.85rem] font-medium rounded-md transition-all capitalize disabled:opacity-50 ${summaryLength === len
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                      }`}
                  >
                    {len}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Drop Zone */}
          <div className="p-6">
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFileUpload(e.dataTransfer.files); }}
              onClick={() => uploadStatus === "idle" && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition-all min-h-[200px] cursor-pointer ${isDragging
                  ? "border-indigo-400 bg-indigo-50/50"
                  : uploadStatus === "error"
                    ? "border-red-300 bg-red-50/50"
                    : uploadStatus === "success"
                      ? "border-emerald-300 bg-emerald-50/50"
                      : isUploading
                        ? "border-indigo-200 bg-gray-50 cursor-wait"
                        : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50/50"
                }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
                accept=".pdf,.docx,.txt,.csv,.xlsx,.pptx,image/*"
              />

              {uploadStatus === "idle" && (
                <>
                  <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
                    <UploadCloud className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h3 className="text-[0.95rem] font-semibold text-gray-900 mb-1">
                    Click to upload or drag and drop
                  </h3>
                  <p className="text-[0.85rem] text-gray-500 mb-5 max-w-sm">
                    PDF, DOCX, TXT, CSV, XLSX, PPTX, or images
                  </p>
                  <button
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                    className="px-5 py-2 bg-indigo-600 text-white text-[0.9rem] font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    Choose files
                  </button>
                </>
              )}

              {(uploadStatus === "uploading" || uploadStatus === "processing") && (
                <div className="flex flex-col items-center animate-fade-in">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
                  <h3 className="text-[0.95rem] font-semibold text-gray-900 mb-1">{uploadMessage}</h3>
                  <p className="text-[0.85rem] text-gray-500">This may take a few moments...</p>
                </div>
              )}

              {uploadStatus === "success" && (
                <div className="flex flex-col items-center animate-fade-in">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h3 className="text-[0.95rem] font-semibold text-emerald-800">{uploadMessage}</h3>
                  <p className="text-[0.85rem] text-emerald-600 mt-1">Redirecting to workspace...</p>
                </div>
              )}

              {uploadStatus === "error" && (
                <div className="flex flex-col items-center animate-fade-in">
                  <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="text-[0.95rem] font-semibold text-red-800">Upload failed</h3>
                  <p className="text-[0.85rem] text-red-600 mb-5">{uploadMessage}</p>
                  <button
                    onClick={(e) => { e.stopPropagation(); setUploadStatus("idle"); setIsUploading(false); }}
                    className="px-5 py-2 bg-white border border-red-200 text-red-700 text-[0.9rem] font-medium rounded-lg hover:bg-red-50 transition-colors shadow-sm"
                  >
                    Try again
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>

      </div>


      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <AuthPromptModal
        isOpen={showAuthPrompt}
        onSignIn={() => { setShowAuthPrompt(false); setShowAuthModal(true); }}
        onDismiss={() => setShowAuthPrompt(false)}
      />
    </>
  );
}
