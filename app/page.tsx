"use client";

import { useState } from "react";
import { useRouter } from 'next/navigation';
import { motion } from "framer-motion";
import { getClientUser } from "@/lib/auth";

/* Premium Icons (re-used) */
function PredictIcon() {
  return (
    <div className="relative w-14 h-14 mx-auto mb-4 sm:w-16 sm:h-16">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-violet-500/20 rounded-2xl blur-xl" />
      <div className="relative w-full h-full bg-gradient-to-br from-blue-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg">
        <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      </div>
    </div>
  );
}

function SimulateIcon() {
  return (
    <div className="relative w-14 h-14 mx-auto mb-4 sm:w-16 sm:h-16">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl blur-xl" />
      <div className="relative w-full h-full bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
        <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </div>
    </div>
  );
}

function ImproveIcon() {
  return (
    <div className="relative w-14 h-14 mx-auto mb-4 sm:w-16 sm:h-16">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-2xl blur-xl" />
      <div className="relative w-full h-full bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
        <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [showAuth, setShowAuth] = useState(false);

  async function handleStart() {
    const user = await getClientUser();
    if (!user) return setShowAuth(true);
    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen bg-black text-white overflow-x-hidden relative">

      {/* BG */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900/20 via-black to-black" />

      {/* HEADER */}
      <header className="relative z-20 px-6 sm:px-8 lg:px-16 pt-6 pb-4">
        <div className="max-w-[1400px] mx-auto flex justify-between items-center">
          <img
            src="https://qpnalviccuopdwfscoli.supabase.co/storage/v1/object/public/nova-assets/talentee_logo_static.svg"
            className="h-9 sm:h-10"
            alt="Nova logo"
          />
          <button
            onClick={() => router.push("/auth")}
            className="hidden sm:block px-6 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/10"
          >
            Sign in
          </button>
        </div>
      </header>

      {/* HERO */}
      <section className="relative z-20 max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-16 pt-14 sm:pt-20 lg:pt-28 pb-20 grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">

        {/* TEXT */}
        <div className="space-y-10 text-center lg:text-left">
          <h1 className="text-5xl sm:text-6xl lg:text-[74px] font-semibold leading-tight tracking-[-0.03em]">
            <span className="block text-white">Train for the</span>
            <span className="block bg-gradient-to-r from-blue-400 to-violet-500 bg-clip-text text-transparent">
              questions
            </span>
            <span className="block text-white">you're most</span>
            <span className="block text-white">likely to face.</span>
          </h1>

          <p className="text-lg sm:text-xl lg:text-2xl text-zinc-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
            Nova predicts the exact interview questions recruiters will ask you —  
            then prepares you to answer them with confidence.
          </p>

          <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleStart}
              className="px-8 py-[14px] bg-white text-black rounded-full font-medium text-[17px] shadow-lg hover:shadow-xl"
            >
              Start training
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() =>
                document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })
              }
              className="px-8 py-[14px] border border-white/20 rounded-full text-white font-medium text-[17px] hover:bg-white/5"
            >
              Learn more
            </motion.button>
          </div>
        </div>

        {/* VIDEO */}
        <div className="relative w-full">
          <video
            src="https://qpnalviccuopdwfscoli.supabase.co/storage/v1/object/public/videos/welcom.mp4"
            poster="https://qpnalviccuopdwfscoli.supabase.co/storage/v1/object/public/public-assets/17608929945463sl9bxar.png"
            playsInline
            controls
            className="w-full aspect-video rounded-[24px] object-cover shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
          />
        </div>

      </section>

      {/* COMPANY LOGOS */}
      <section className="py-20 px-6 sm:px-8 relative overflow-hidden">
        <p className="text-zinc-500 text-sm text-center mb-16">Candidates train for interviews at companies like</p>

        <div className="flex gap-14 items-center overflow-x-auto no-scrollbar px-4 pb-2">
          {[
            "google-1-1.svg",
            "meta-3.svg",
            "tesla-motors.svg",
            "deloiteblanc.png",
            "PWC-Logo-PNG.png",
            "mckinzeywhite.png",
            "bcg-3.svg",
          ].map((logo, i) => (
            <img
              key={i}
              draggable={false}
              src={`https://qpnalviccuopdwfscoli.supabase.co/storage/v1/object/public/public-assets/logos/${logo}`}
              className="h-10 opacity-70 hover:opacity-100 transition"
            />
          ))}
        </div>
      </section>

      {/* HOW NOVA PREPARES YOU */}
      <section id="how-it-works" className="pt-20 pb-16 px-8 max-w-5xl mx-auto text-center">
        <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-12">
          How Nova prepares you
        </h2>

        <p className="text-zinc-400 text-lg max-w-3xl mx-auto leading-relaxed font-light mb-16">
          Nova predicts, simulates, and improves your interview performance — focusing only on what actually matters.
        </p>

        <div className="grid sm:grid-cols-3 gap-12">

          <div className="space-y-4 px-2">
            <PredictIcon />
            <h3 className="text-xl sm:text-2xl font-semibold">Predict</h3>
            <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
              Nova identifies the exact questions recruiters ask based on your role and industry.
            </p>
          </div>

          <div className="space-y-4 px-2">
            <SimulateIcon />
            <h3 className="text-xl sm:text-2xl font-semibold">Simulate</h3>
            <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
              Train in real conditions with Nova’s adaptive interview engine.
            </p>
          </div>

          <div className="space-y-4 px-2">
            <ImproveIcon />
            <h3 className="text-xl sm:text-2xl font-semibold">Improve</h3>
            <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
              Improve 10× faster with precise, personalized feedback.
            </p>
          </div>

        </div>
      </section>

      {/* AUTH POPUP */}
      {showAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xl p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-950/90 border border-white/10 rounded-3xl p-10 w-full max-w-sm text-center"
          >
            <h3 className="text-3xl font-semibold text-white mb-4">Sign in required</h3>
            <p className="text-zinc-400 mb-8 leading-relaxed">
              Please sign in or create an account to begin your training.
            </p>
            <button
              onClick={() => router.push("/auth")}
              className="w-full py-3 bg-white text-black rounded-full font-semibold mb-3"
            >
              Continue
            </button>
            <button
              onClick={() => setShowAuth(false)}
              className="text-zinc-500 hover:text-zinc-300 text-sm"
            >
              Not now
            </button>
          </motion.div>
        </div>
      )}

    </main>
  );
}
