"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X } from "lucide-react";

interface AuthPromptModalProps {
  isOpen: boolean;
  onSignIn: () => void;
  onDismiss: () => void;
}

export function AuthPromptModal({ isOpen, onSignIn, onDismiss }: AuthPromptModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="prompt-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] flex items-center justify-center bg-black/15 backdrop-blur-sm p-4"
        onClick={onDismiss}
      >
        <motion.div
          key="prompt-card"
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-[360px] bg-white border border-gray-200 rounded-2xl shadow-xl p-6 text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onDismiss}
            className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
          >
            <X size={16} />
          </button>

          <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-6 h-6 text-indigo-600" />
          </div>
          <h3 className="text-[1.05rem] font-bold text-gray-900 mb-1">Sign in to save your work</h3>
          <p className="text-[0.85rem] text-gray-500 mb-6 leading-relaxed">
            Create a free account to keep your chat history, documents, and analysis accessible anytime.
          </p>

          <div className="flex flex-col gap-2">
            <button
              onClick={onSignIn}
              className="w-full h-10 bg-indigo-600 text-white text-[0.9rem] font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              Sign in or create account
            </button>
            <button
              onClick={onDismiss}
              className="w-full h-10 text-gray-500 text-[0.9rem] font-medium rounded-lg hover:bg-gray-50 hover:text-gray-700 transition-colors"
            >
              Continue as guest
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
