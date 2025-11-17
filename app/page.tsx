"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getClientUser } from "@/lib/auth";

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
          HOW NOVA PREPARES YOU
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

          <div className="space-y-4 px-4">
            <div className="text-5xl">🔮</div>
            <h3 className="text-2xl font-semibold tracking-tight">Predict</h3>
            <p className="text-zinc-400 text-[15px] leading-relaxed">
              Nova identifies the exact questions you're most likely to face
              based on your role and recruiter patterns.
            </p>
          </div>

          <div className="space-y-4 px-4">
            <div className="text-5xl">🎥</div>
            <h3 className="text-2xl font-semibold tracking-tight">Simulate</h3>
            <p className="text-zinc-400 text-[15px] leading-relaxed">
              Train in real conditions with Nova’s dynamic interview engine —
              reacting to your tone, structure, and answers.
            </p>
          </div>

          <div className="space-y-4 px-4">
            <div className="text-5xl">📈</div>
            <h3 className="text-2xl font-semibold tracking-tight">Improve</h3>
            <p className="text-zinc-400 text-[15px] leading-relaxed">
              Nova highlights your strengths, fixes your weaknesses, and helps
              you improve 10× faster.
            </p>
          </div>

        </div>
      </section>

      {/* -----------------------------------------------------
          PAIN POINTS SECTION
      ------------------------------------------------------ */}
      <section className="pt-32 pb-36 px-8 max-w-6xl mx-auto text-center" id="learn-more">

        <h2 className="text-5xl font-semibold tracking-tight mb-16">
          If this sounds like you…
        </h2>

        <div className="grid sm:grid-cols-2 gap-12 max-w-4xl mx-auto text-left">

          <div className="space-y-4">
            <h3 className="text-2xl font-semibold">🚫 You don’t know what they’ll ask</h3>
            <p className="text-zinc-400">
              You see generic lists online — but none match your actual role or level.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-2xl font-semibold">😵 You fail to structure your answers</h3>
            <p className="text-zinc-400">
              You know what you want to say, but everything comes out messy.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-2xl font-semibold">🥵 You struggle under pressure</h3>
            <p className="text-zinc-400">
              Silence, stress, bad timing — and you lose points unfairly.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-2xl font-semibold">🤐 You don’t get real feedback</h3>
            <p className="text-zinc-400">
              Friends say “you’re good bro”, but you don’t actually improve.
            </p>
          </div>

        </div>
      </section>

      {/* -----------------------------------------------------
          HOW NOVA FIXES THIS
      ------------------------------------------------------ */}
      <section className="pt-16 pb-24 px-8 max-w-5xl mx-auto">

        <h2 className="text-5xl font-semibold tracking-tight text-center mb-16">
          Nova fixes all of this — instantly.
        </h2>

        <div className="grid sm:grid-cols-3 gap-12 text-center">

          <div className="space-y-3">
            <div className="text-5xl">🎯</div>
            <h3 className="text-xl font-semibold">Ask the right questions</h3>
            <p className="text-zinc-400 text-sm">
              Tailored to your role, seniority, and industry. Zero noise.
            </p>
          </div>

          <div className="space-y-3">
            <div className="text-5xl">✨</div>
            <h3 className="text-xl font-semibold">Train like the real thing</h3>
            <p className="text-zinc-400 text-sm">
              Video-based, dynamic, and adaptive — not a boring static quiz.
            </p>
          </div>

          <div className="space-y-3">
            <div className="text-5xl">🧠</div>
            <h3 className="text-xl font-semibold">Get better 10× faster</h3>
            <p className="text-zinc-400 text-sm">
              With detailed feedback on structure, clarity, pace, and more.
            </p>
          </div>

        </div>

      </section>

      <AuthPopup open={showAuth} onClose={() => setShowAuth(false)} />
    </main>
  );
}