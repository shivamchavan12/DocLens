"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthModal } from "@/components/AuthModal";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showModal, setShowModal] = useState(true);

  useEffect(() => {
    if (!loading && user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center relative">
      {/* Subtle background decoration */}
      <div className="absolute top-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-100/40 via-transparent to-transparent pointer-events-none" />

      <AuthModal
        isOpen={showModal}
        onClose={() => router.push("/")}
        defaultTab="signin"
      />

      {/* Fallback content behind modal */}
      <div className="text-center relative z-10">
        <p className="text-gray-400 text-[0.9rem]">Redirecting...</p>
      </div>
    </div>
  );
}
