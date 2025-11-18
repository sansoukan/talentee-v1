"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, CheckCircle2, Eye, EyeOff } from "lucide-react";

// ⭐ MOBILE LAYOUT
import MobileLayout from "@/components/MobileLayout";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleUpdate = async () => {
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setDone(true);

    setTimeout(() => {
      router.push("/auth");
    }, 2000);
  };

  /* ======================================================
        SUCCESS SCREEN
  ====================================================== */
  if (done)
    return (
      <MobileLayout>
        <div className="min-h-screen bg-black flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br 
              from-emerald-500 to-teal-600 flex items-center justify-center"
            >
              <CheckCircle2 className="w-12 h-12 text-white" />
            </motion.div>

            <h2 className="text-3xl font-semibold text-white mb-3">
              Password updated
            </h2>
            <p className="text-gray-400 text-lg">
              You can now log in with your new password.
            </p>
          </motion.div>
        </div>
      </MobileLayout>
    );

  /* ======================================================
        MAIN SCREEN
  ====================================================== */
  return (
    <MobileLayout>
      <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">

        {/* BG Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 via-purple-950/20 to-black pointer-events-none" />
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full relative"
        >
          {/* Glass Card */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">

            {/* HEADER */}
            <div className="mb-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br 
              from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">New password</h1>
              <p className="text-gray-400">Choose a secure password.</p>
            </div>

            {/* New Password */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                New password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full px-4 py-3.5 bg-white/5 border border-white/10 
                  rounded-xl text-white placeholder-gray-500 focus:outline-none 
                  focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Confirm password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full px-4 py-3.5 bg-white/5 border border-white/10 
                  rounded-xl text-white placeholder-gray-500 focus:outline-none 
                  focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl"
              >
                <p className="text-red-400 text-sm">{error}</p>
              </motion.div>
            )}

            {/* Requirements */}
            <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
              <p className="text-xs text-gray-400 mb-2">
                Your password must include:
              </p>
              <ul className="space-y-1 text-xs text-gray-500">
                <li className={password.length >= 8 ? "text-emerald-400" : ""}>
                  • At least 8 characters
                </li>
                <li
                  className={
                    password === confirmPassword && password.length > 0
                      ? "text-emerald-400"
                      : ""
                  }
                >
                  • Both passwords match
                </li>
              </ul>
            </div>

            {/* Update button */}
            <button
              onClick={handleUpdate}
              disabled={loading || !password || !confirmPassword}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 
              rounded-xl font-semibold text-white shadow-lg hover:scale-[1.02] 
              disabled:opacity-50 transition-all"
            >
              {loading ? "Updating…" : "Update my password"}
            </button>

            {/* Back */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-6 text-center"
            >
              <button
                onClick={() => router.push("/auth")}
                className="text-gray-400 hover:text-white text-sm"
              >
                Back to login
              </button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </MobileLayout>
  );
}
