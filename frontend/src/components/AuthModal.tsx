"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { X, Command, Loader2, AlertCircle } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "signin" | "signup";
}

export function AuthModal({ isOpen, onClose, defaultTab = "signin" }: AuthModalProps) {
  const { signInWithGoogle, signUpWithEmail, signInWithEmail } = useAuth();
  const [tab, setTab] = useState<"signin" | "signup">(defaultTab);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Sign-in fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Sign-up fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");

  const resetFields = () => {
    setEmail(""); setPassword("");
    setFirstName(""); setLastName("");
    setSignUpEmail(""); setSignUpPassword("");
    setError("");
  };

  const switchTab = (t: "signin" | "signup") => {
    resetFields();
    setTab(t);
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError("");
      await signInWithGoogle();
      onClose();
    } catch (err: any) {
      setError(err.message || "Google sign-in failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    try {
      setIsLoading(true);
      setError("");
      await signInWithEmail(email, password);
      onClose();
    } catch (err: any) {
      const code = err?.code || "";
      if (code === "auth/invalid-credential" || code === "auth/wrong-password") {
        setError("Invalid email or password.");
      } else if (code === "auth/user-not-found") {
        setError("No account found with this email.");
      } else {
        setError(err.message || "Sign-in failed.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !signUpEmail.trim() || !signUpPassword.trim()) return;
    if (signUpPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    try {
      setIsLoading(true);
      setError("");
      await signUpWithEmail(signUpEmail, signUpPassword, firstName.trim(), lastName.trim());
      onClose();
    } catch (err: any) {
      const code = err?.code || "";
      if (code === "auth/email-already-in-use") {
        setError("An account with this email already exists.");
      } else if (code === "auth/weak-password") {
        setError("Password is too weak. Use at least 6 characters.");
      } else {
        setError(err.message || "Sign-up failed.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="auth-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          key="auth-card"
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-[400px] bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 pb-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Command size={16} className="text-white" />
              </div>
              <span className="font-semibold text-gray-900">DocLens</span>
            </div>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex px-5 pt-5 gap-1 border-b border-gray-100">
            <button
              onClick={() => switchTab("signin")}
              className={`flex-1 pb-3 text-[0.9rem] font-medium border-b-2 transition-colors ${
                tab === "signin" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              Sign in
            </button>
            <button
              onClick={() => switchTab("signup")}
              className={`flex-1 pb-3 text-[0.9rem] font-medium border-b-2 transition-colors ${
                tab === "signup" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              Create account
            </button>
          </div>

          {/* Content */}
          <div className="p-5">
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 flex items-start gap-2">
                <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-[0.85rem] text-red-600 font-medium">{error}</p>
              </div>
            )}

            {tab === "signin" ? (
              <form onSubmit={handleEmailSignIn} className="space-y-3">
                <div>
                  <label className="block text-[0.8rem] font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full h-10 px-3 text-[0.9rem] bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[0.8rem] font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full h-10 px-3 text-[0.9rem] bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-10 bg-indigo-600 text-white text-[0.9rem] font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : "Sign in"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleEmailSignUp} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[0.8rem] font-medium text-gray-700 mb-1">First name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="John"
                      required
                      className="w-full h-10 px-3 text-[0.9rem] bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[0.8rem] font-medium text-gray-700 mb-1">Last name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                      className="w-full h-10 px-3 text-[0.9rem] bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[0.8rem] font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full h-10 px-3 text-[0.9rem] bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[0.8rem] font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    required
                    minLength={6}
                    className="w-full h-10 px-3 text-[0.9rem] bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-10 bg-indigo-600 text-white text-[0.9rem] font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : "Create account"}
                </button>
              </form>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-[1px] bg-gray-200" />
              <span className="text-[0.8rem] text-gray-400 font-medium">or</span>
              <div className="flex-1 h-[1px] bg-gray-200" />
            </div>

            {/* Google */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full h-10 flex items-center justify-center gap-2.5 bg-white border border-gray-300 rounded-lg text-[0.9rem] font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>

            <p className="text-center text-[0.75rem] text-gray-400 mt-4">
              By continuing, you agree to our Terms and Privacy Policy.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
