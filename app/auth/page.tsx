"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";

// ⭐ Mobile Layout global
import MobileLayout from "@/components/MobileLayout";

type Mode = "signin" | "signup" | "magic";

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const search = useSearchParams();
  const messageParam = search.get("message");

  async function handleSubmit(e: any) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    setOk(null);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth?message=confirm`,
          },
        });
        if (error) throw error;
        setOk("A confirmation email has been sent. Please check your inbox.");
      }

      if (mode === "signin") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        localStorage.setItem("nova_user_id", data.user.id);
        router.push("/dashboard");
      }

      if (mode === "magic") {
        const { error } = await supabase.auth.signInWithOtp({ email });
        if (error) throw error;
        setOk("Magic link sent. Check your inbox.");
      }
    } catch (e: any) {
      setErr(e.message);
    }

    setLoading(false);
  }

  return (
    <MobileLayout>
      <main className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          
          {/* HEADER */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-semibold tracking-tight">Sign in to Nova</h1>
            <p className="text-white/40 mt-2">Access your account or create one</p>

            {messageParam === "confirm" && (
              <p className="mt-4 text-yellow-400 text-sm bg-yellow-400/10 border border-yellow-400/20 px-4 py-2 rounded-xl">
                Please confirm your email before continuing.
              </p>
            )}
          </div>

          {/* MODE SWITCH */}
          <div className="flex gap-2 mb-8 p-1 bg-white/5 rounded-xl">
            {["signin", "signup", "magic"].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m as Mode)}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                  mode === m
                    ? "bg-white/10 backdrop-blur-xl text-white shadow-lg"
                    : "text-white/50 hover:text-white"
                }`}
              >
                {m === "signin" && "Sign in"}
                {m === "signup" && "Sign up"}
                {m === "magic" && "Magic link"}
              </button>
            ))}
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* EMAIL */}
            <div>
              <label className="block text-sm mb-1 text-white/70">Email</label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 
                           text-white placeholder-white/30 focus:outline-none focus:border-white/30"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* PASSWORD */}
            {mode !== "magic" && (
              <div>
                <label className="block text-sm mb-1 text-white/70">Password</label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 
                             text-white placeholder-white/30 focus:outline-none focus:border-white/30"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}

            {/* ERROR */}
            {err && (
              <p className="text-sm text-red-400 bg-red-400/10 px-4 py-3 rounded-xl border border-red-400/20">
                {err}
              </p>
            )}

            {/* OK */}
            {ok && (
              <p className="text-sm text-green-400 bg-green-400/10 px-4 py-3 rounded-xl border border-green-400/20">
                {ok}
              </p>
            )}

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-white/10 backdrop-blur-xl 
                         border border-white/10 text-white font-semibold hover:bg-white/20 
                         disabled:opacity-50 transition-all"
            >
              {loading ? "Processing…" : mode === "signin"
                ? "Sign in"
                : mode === "signup"
                ? "Create account"
                : "Send magic link"}
            </button>
          </form>

          {/* EXTRA LINKS */}
          <div className="text-center mt-8 space-y-3 text-sm">
            <Link href="/auth/reset" className="text-white/50 hover:text-white">
              Forgot your password?
            </Link>

            <p className="text-white/40">
              Back to <Link href="/" className="text-white hover:underline">home</Link>
            </p>
          </div>
        </div>
      </main>
    </MobileLayout>
  );
}
