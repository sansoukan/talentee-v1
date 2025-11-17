"use client";

import { useState } from "react";
import { useRouter } from 'next/navigation';
import { motion } from "framer-motion";
import { getClientUser } from "@/lib/auth";

/* -----------------------------------------------------
   PREMIUM ICON COMPONENTS - Apple Style
------------------------------------------------------ */
function PredictIcon() {
  return (
    <div className="relative w-16 h-16 mx-auto mb-6">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-violet-500/20 rounded-2xl blur-xl" />
      <div className="relative w-full h-full bg-gradient-to-br from-blue-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg">
        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      </div>
    </div>
  );
}

function SimulateIcon() {
  return (
    <div className="relative w-16 h-16 mx-auto mb-6">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl blur-xl" />
      <div className="relative w-full h-full bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </div>
    </div>
  );
}

function ImproveIcon() {
  return (
    <div className="relative w-16 h-16 mx-auto mb-6">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-2xl blur-xl" />
      <div className="relative w-full h-full bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      </div>
    </div>
  );
}

function AlertIcon() {
  return (
    <div className="relative w-12 h-12 mb-4">
      <div className="absolute inset-0 bg-red-500/10 rounded-xl blur-lg" />
      <div className="relative w-full h-full bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-xl border border-red-500/20 flex items-center justify-center">
        <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
    </div>
  );
}

function ConfusedIcon() {
  return (
    <div className="relative w-12 h-12 mb-4">
      <div className="absolute inset-0 bg-orange-500/10 rounded-xl blur-lg" />
      <div className="relative w-full h-full bg-gradient-to-br from-orange-500/10 to-amber-500/10 rounded-xl border border-orange-500/20 flex items-center justify-center">
        <svg className="w-6 h-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    </div>
  );
}

function StressIcon() {
  return (
    <div className="relative w-12 h-12 mb-4">
      <div className="absolute inset-0 bg-rose-500/10 rounded-xl blur-lg" />
      <div className="relative w-full h-full bg-gradient-to-br from-rose-500/10 to-pink-500/10 rounded-xl border border-rose-500/20 flex items-center justify-center">
        <svg className="w-6 h-6 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    </div>
  );
}

function FeedbackIcon() {
  return (
    <div className="relative w-12 h-12 mb-4">
      <div className="absolute inset-0 bg-yellow-500/10 rounded-xl blur-lg" />
      <div className="relative w-full h-full bg-gradient-to-br from-yellow-500/10 to-amber-500/10 rounded-xl border border-yellow-500/20 flex items-center justify-center">
        <svg className="w-6 h-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
        </svg>
      </div>
    </div>
  );
}

function TargetIcon() {
  return (
    <div className="relative w-14 h-14 mx-auto mb-5">
      <div className="absolute inset-0 bg-blue-500/20 rounded-2xl blur-xl" />
      <div className="relative w-full h-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl border border-blue-500/30 flex items-center justify-center backdrop-blur-sm">
        <svg className="w-7 h-7 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
    </div>
  );
}

function SparkleIcon() {
  return (
    <div className="relative w-14 h-14 mx-auto mb-5">
      <div className="absolute inset-0 bg-violet-500/20 rounded-2xl blur-xl" />
      <div className="relative w-full h-full bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-2xl border border-violet-500/30 flex items-center justify-center backdrop-blur-sm">
        <svg className="w-7 h-7 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      </div>
    </div>
  );
}

function BrainIcon() {
  return (
    <div className="relative w-14 h-14 mx-auto mb-5">
      <div className="absolute inset-0 bg-emerald-500/20 rounded-2xl blur-xl" />
      <div className="relative w-full h-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-2xl border border-emerald-500/30 flex items-center justify-center backdrop-blur-sm">
        <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      </div>
    </div>
  );
}

/* -----------------------------------------------------
   AUTH POPUP
------------------------------------------------------ */
function AuthPopup({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-xl grid place-items-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", duration: 0.4, bounce: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-zinc-950/90 backdrop-blur-2xl rounded-3xl p-10 w-full max-w-md border border-white/5"
      >
        <h3 className="text-3xl font-semibold text-white mb-4 tracking-tight">
          Sign in required
        </h3>

        <p className="text-zinc-400 mb-8 text-[17px] leading-relaxed font-light">
          Please sign in or create an account to launch your simulation. Your
          progress will be saved automatically.
        </p>

        <a
          href="/auth"
          className="block text-center py-4 px-8 rounded-full bg-white hover:bg-zinc-100 text-black font-medium text-[17px] transition-all duration-200 mb-4"
        >
          Continue
        </a>

        <div className="text-center">
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 text-[15px] transition-colors duration-200"
          >
            Not now
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* -----------------------------------------------------
   LANDING PAGE
------------------------------------------------------ */
export default function LandingPage() {
  const router = useRouter();
  const [showAuth, setShowAuth] = useState(false);

  async function handleStart() {
    const user = await getClientUser();
    if (!user) {
      setShowAuth(true);
      return;
    }
    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen bg-black text-white overflow-hidden relative">

      {/* BACKGROUND */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900/10 via-black to-black" />

      {/* HEADER */}
      <header className="relative z-20 px-6 sm:px-8 lg:px-16 pt-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-[1400px] mx-auto"
        >
          <img
            src="https://qpnalviccuopdwfscoli.supabase.co/storage/v1/object/public/nova-assets/talentee_logo_static.svg"
            alt="Nova RH"
            className="h-10"
          />
        </motion.div>
      </header>

      {/* HERO */}
      <div className="relative z-10">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-16 pt-20 pb-32 grid lg:grid-cols-2 gap-20 items-center">

          {/* LEFT CONTENT */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-12"
          >
            <h1 className="text-6xl sm:text-7xl lg:text-[80px] font-semibold leading-[1.05] tracking-[-0.025em]">
              <span className="block text-white">Train for the</span>
              <span className="block bg-gradient-to-r from-blue-400 to-violet-500 bg-clip-text text-transparent">
                questions
              </span>
              <span className="block text-white">you're most</span>
              <span className="block text-white">likely to face.</span>
            </h1>

            <p className="text-xl sm:text-2xl text-zinc-400 leading-relaxed font-light max-w-[600px] tracking-[-0.01em]">
              Nova analyzes your role, predicts what recruiters will ask, and
              prepares you on the exact points that matter — including how to
              answer them with confidence.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleStart}
                className="px-9 py-[18px] bg-white text-black rounded-full font-medium text-[17px] transition-all shadow-[0_0_25px_rgba(255,255,255,0.15)] hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]"
              >
                Start training
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-9 py-[18px] border border-white/20 rounded-full text-white font-medium text-[17px] hover:bg-white/5 transition-all"
                onClick={() =>
                  document
                    .getElementById("learn-more")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Learn more
              </motion.button>
            </div>
          </motion.div>

          {/* VIDEO */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.15 }}
            className="relative w-full"
          >
            <video
              src="https://qpnalviccuopdwfscoli.supabase.co/storage/v1/object/public/videos/welcom.mp4"
              poster="https://qpnalviccuopdwfscoli.supabase.co/storage/v1/object/public/public-assets/17608929945463sl9bxar.png"
              controls
              playsInline
              className="w-full aspect-video rounded-[28px] object-cover shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
            />
          </motion.div>
        </div>
      </div>

      {/* -----------------------------------------------------
          LOGOS CAROUSEL PREMIUM
      ------------------------------------------------------ */}
      <section className="relative py-24 px-6 w-full max-w-7xl mx-auto overflow-hidden">

        <p className="text-zinc-500 text-sm text-center mb-12 tracking-wide">
          Candidates train for interviews at companies like
        </p>

        {/* LEFT GRADIENT */}
        <div className="absolute left-0 top-0 h-full w-32 bg-gradient-to-r from-black via-black/50 to-transparent pointer-events-none z-20"></div>

        {/* RIGHT GRADIENT */}
        <div className="absolute right-0 top-0 h-full w-32 bg-gradient-to-l from-black via-black/50 to-transparent pointer-events-none z-20"></div>

        <div className="flex flex-nowrap gap-20 items-center animate-logoScroll hover:[animation-play-state:paused] select-none">

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
              className="h-10 opacity-80 hover:opacity-100 transition duration-300"
            />
          ))}

          {/* COPY LOOP */}
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
              key={`loop-${i}`}
              draggable={false}
              src={`https://qpnalviccuopdwfscoli.supabase.co/storage/v1/object/public/public-assets/logos/${logo}`}
              className="h-10 opacity-80 hover:opacity-100 transition duration-300"
            />
          ))}
        </div>
      </section>

      {/* -----------------------------------------------------
          HOW NOVA PREPARES YOU - PREMIUM ICONS
      ------------------------------------------------------ */}
      <section className="pt-32 pb-20 px-8 max-w-6xl mx-auto text-center">
        <h2 className="text-5xl font-semibold tracking-tight mb-10">
          How Nova prepares you
        </h2>

        <p className="text-zinc-400 text-xl max-w-4xl mx-auto leading-relaxed font-light mb-20">
          Nova predicts, simulates, and improves your interview performance —
          focusing only on what actually matters for your next role.
        </p>

        <div className="grid sm:grid-cols-3 gap-14">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4 px-4"
          >
            <PredictIcon />
            <h3 className="text-2xl font-semibold tracking-tight">Predict</h3>
            <p className="text-zinc-400 text-[15px] leading-relaxed">
              Nova identifies the exact questions you're most likely to face
              based on your role and recruiter patterns.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-4 px-4"
          >
            <SimulateIcon />
            <h3 className="text-2xl font-semibold tracking-tight">Simulate</h3>
            <p className="text-zinc-400 text-[15px] leading-relaxed">
              Train in real conditions with Nova's dynamic interview engine —
              reacting to your tone, structure, and answers.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-4 px-4"
          >
            <ImproveIcon />
            <h3 className="text-2xl font-semibold tracking-tight">Improve</h3>
            <p className="text-zinc-400 text-[15px] leading-relaxed">
              Nova highlights your strengths, fixes your weaknesses, and helps
              you improve 10× faster.
            </p>
          </motion.div>

        </div>
      </section>

      {/* -----------------------------------------------------
          PAIN POINTS SECTION - PREMIUM ICONS
      ------------------------------------------------------ */}
      <section className="pt-32 pb-36 px-8 max-w-6xl mx-auto text-center" id="learn-more">

        <h2 className="text-5xl font-semibold tracking-tight mb-16">
          If this sounds like you…
        </h2>

        <div className="grid sm:grid-cols-2 gap-12 max-w-4xl mx-auto text-left">

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <AlertIcon />
            <h3 className="text-2xl font-semibold">You don't know what they'll ask</h3>
            <p className="text-zinc-400">
              You see generic lists online — but none match your actual role or level.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-4"
          >
            <ConfusedIcon />
            <h3 className="text-2xl font-semibold">You fail to structure your answers</h3>
            <p className="text-zinc-400">
              You know what you want to say, but everything comes out messy.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-4"
          >
            <StressIcon />
            <h3 className="text-2xl font-semibold">You struggle under pressure</h3>
            <p className="text-zinc-400">
              Silence, stress, bad timing — and you lose points unfairly.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="space-y-4"
          >
            <FeedbackIcon />
            <h3 className="text-2xl font-semibold">You don't get real feedback</h3>
            <p className="text-zinc-400">
              Friends say "you're good bro", but you don't actually improve.
            </p>
          </motion.div>

        </div>
      </section>

      {/* -----------------------------------------------------
          HOW NOVA FIXES THIS - PREMIUM ICONS
      ------------------------------------------------------ */}
      <section className="pt-16 pb-24 px-8 max-w-5xl mx-auto">

        <h2 className="text-5xl font-semibold tracking-tight text-center mb-16">
          Nova fixes all of this — instantly.
        </h2>

        <div className="grid sm:grid-cols-3 gap-12 text-center">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-3"
          >
            <TargetIcon />
            <h3 className="text-xl font-semibold">Ask the right questions</h3>
            <p className="text-zinc-400 text-sm">
              Tailored to your role, seniority, and industry. Zero noise.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-3"
          >
            <SparkleIcon />
            <h3 className="text-xl font-semibold">Train like the real thing</h3>
            <p className="text-zinc-400 text-sm">
              Video-based, dynamic, and adaptive — not a boring static quiz.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-3"
          >
            <BrainIcon />
            <h3 className="text-xl font-semibold">Get better 10× faster</h3>
            <p className="text-zinc-400 text-sm">
              With detailed feedback on structure, clarity, pace, and more.
            </p>
          </motion.div>

        </div>

      </section>

      <AuthPopup open={showAuth} onClose={() => setShowAuth(false)} />
    </main>
  );
}
