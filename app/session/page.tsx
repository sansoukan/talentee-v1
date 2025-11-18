"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import NovaEngine_Playlist from "@/components/NovaEngine_Playlist";
import { getClientUser, signOutClient } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";
import { novaPrices } from "@/lib/novaPrices";
import PremiumPopup from "@/components/PremiumPopup";
import NovaToast from "@/components/NovaToast";

// ⭐ Mobile layout global
import MobileLayout from "@/components/MobileLayout";

/* ======================================================
 🎯 Durée des simulations par type
====================================================== */
const DURATION_MAP: Record<string, number> = {
  internship: 1200,
  job_interview: 1200,
  case_study: 1200,
  promotion: 900,
  annual_review: 900,
  goal_setting: 900,
  practice: 900,
  strategic_case: 1200,
};

export default function SessionPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showPremium, setShowPremium] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [type, setType] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [alertPlayed, setAlertPlayed] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<string | null>(null);

  const sid = sp.get("session_id");
  const activeId = useMemo(() => sid || sessionId, [sid, sessionId]);
  const durationSec = useMemo(() => (type ? DURATION_MAP[type] || 1200 : 1200), [type]);
  const alertDelayMs = (durationSec - 120) * 1000;

  /* ======================================================
   1️⃣ Vérifie la connexion utilisateur
  ====================================================== */
  useEffect(() => {
    (async () => {
      const u = await getClientUser();
      if (!u) {
        router.replace("/auth?next=/session");
        return;
      }
      setUser(u);
      setReady(true);
    })();
  }, [router]);

  /* ======================================================
   2️⃣ Polling du statut de la session Stripe
  ====================================================== */
  useEffect(() => {
    if (!sid) return;

    let attempts = 0;
    const checkStatus = async () => {
      const { data } = await supabase
        .from("nova_sessions")
        .select("status, id")
        .eq("id", sid)
        .maybeSingle();

      const status = data?.status || "unknown";
      setSessionStatus(status);

      if (status === "paid" || status === "active" || status === "started") {
        router.replace(`/session?session_id=${sid}`);
      } else if (attempts < 20) {
        attempts++;
        setTimeout(checkStatus, 1500);
      } else {
        router.push("/dashboard");
      }
    };

    checkStatus();
  }, [sid, router]);

  /* ======================================================
   3️⃣ Alerte vocale T-2 minutes
  ====================================================== */
  useEffect(() => {
    if (!activeId) return;

    const timer = setTimeout(() => {
      if (!alertPlayed) {
        const msg = new SpeechSynthesisUtterance("You have two minutes remaining.");
        msg.lang = "en-US";
        window.speechSynthesis.speak(msg);
        setAlertPlayed(true);
      }
    }, alertDelayMs);

    return () => clearTimeout(timer);
  }, [activeId, alertDelayMs, alertPlayed]);

  /* ======================================================
   4️⃣ Start simulation
  ====================================================== */
  async function startSimulation(selectedType: string) {
    setLoading(true);
    setErrorMsg(null);

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, career_stage, domain, goal")
        .eq("id", user.id)
        .single();

      if (!profile) {
        router.push("/onboarding");
        return;
      }

      const duration = DURATION_MAP[selectedType] || 900;

      const payload = {
        user_id: profile.id,
        option: selectedType,
        domain: profile.domain,
        goal: profile.goal,
        career_stage: profile.career_stage,
        duration_limit: duration,
      };

      const res = await fetch("/api/engine/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (json?.url) {
        window.location.href = json.url;
        return;
      }

      if (json?.bypass) {
        router.push(`/session?session_id=${json.session_id}`);
        return;
      }

      if (json?.require_cv) {
        setShowPremium(true);
        return;
      }

      if (json?.error) {
        setErrorMsg(json.error);
      } else {
        setSessionId(json.session_id);
      }
    } finally {
      setLoading(false);
    }
  }

  /* ======================================================
   5️⃣ Cas de garde
  ====================================================== */
  if (!ready) {
    return (
      <main className="flex items-center justify-center h-screen bg-black text-white">
        <div className="animate-pulse text-center">
          <h1 className="text-2xl font-semibold mb-2 text-blue-400">
            Nova is preparing your simulation…
          </h1>
          <p className="text-gray-400 text-sm">Please wait a few seconds.</p>
        </div>
      </main>
    );
  }

  if (activeId && (!activeId.match(/^[0-9a-fA-F-]{36}$/) || activeId === "[object Object]")) {
    return (
      <main className="flex items-center justify-center h-screen bg-black text-white">
        <h1 className="text-2xl font-bold text-red-500">Invalid session ID</h1>
      </main>
    );
  }

  if (sid && sessionStatus === "pending") {
    return (
      <main className="flex items-center justify-center h-screen bg-black text-white">
        <div className="animate-pulse text-center">
          <h1 className="text-2xl font-semibold text-blue-400">Nova is preparing your session…</h1>
          <p className="text-gray-400 text-sm">Please wait…</p>
        </div>
      </main>
    );
  }

  /* ======================================================
   6️⃣ Lancement NovaEngine_Playlist
  ====================================================== */
  if (activeId) {
    return (
      <MobileLayout>
        <main className="relative min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white flex items-center justify-center">
          <NovaEngine_Playlist sessionId={activeId} />
          <NovaToast />
        </main>
      </MobileLayout>
    );
  }

  /* ======================================================
   7️⃣ Page de sélection par défaut
  ====================================================== */

  return (
    <MobileLayout>
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white p-6 flex flex-col gap-8">

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-blue-400">Nova Simulation</h1>
            <p className="text-gray-400 text-sm">{user?.email}</p>
          </div>
          <button
            onClick={signOutClient}
            className="text-sm bg-gray-800 px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            Sign out
          </button>
        </div>

        <div className="bg-gray-800/60 rounded-xl p-6 border border-white/10">
          <p className="text-lg font-semibold mb-2">Choose your interview type:</p>
          <ul className="text-sm text-gray-400 list-disc list-inside space-y-1">
            <li>Each session lasts between 15 and 20 minutes.</li>
            <li>At the end, Nova generates your feedback automatically.</li>
            <li>Students get their first simulation free.</li>
          </ul>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {Object.entries(DURATION_MAP).map(([key, dur]) => (
            <div
              key={key}
              onClick={() => setType(key)}
              className={`p-6 rounded-xl border ${
                type === key
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-gray-700 bg-gray-900/40 hover:border-blue-400/50"
              } cursor-pointer transition`}
            >
              <strong className="capitalize block text-white text-lg">{key.replace("_", " ")}</strong>
              <p className="text-gray-400 text-sm mt-2">
                Duration: {Math.floor(dur / 60)} min
              </p>
              <p className="text-blue-400 text-sm mt-1 font-semibold">
                ${novaPrices.find((p) => p.id === key)?.price.toFixed(2) || "3.99"}
              </p>
            </div>
          ))}
        </div>

        {errorMsg && <p className="text-red-400 text-sm">{errorMsg}</p>}

        <div className="flex justify-end mt-4">
          <button
            disabled={!type || loading}
            onClick={() => startSimulation(type!)}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              type
                ? "bg-blue-600 hover:bg-blue-500 text-white"
                : "bg-gray-600 text-gray-400 cursor-not-allowed"
            }`}
          >
            {loading ? "Starting…" : "Start simulation"}
          </button>
        </div>

        {showPremium && <PremiumPopup onClose={() => setShowPremium(false)} />}

        <NovaToast />
      </main>
    </MobileLayout>
  );
}
