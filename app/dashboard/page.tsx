"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, Folder, Settings, LogOut, Rocket } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

import AskNova from "@/components/AskNova";
import CVOfferSection from "@/components/CVOfferSection";
import DashboardArticlesPreview from "@/components/DashboardArticlesPreview";
import DashboardProArticles from "@/components/DashboardProArticles";
import InterviewTips from "@/components/InterviewTips";
import SettingsPanel from "@/components/SettingsPanel";
import NovaToast from "@/components/NovaToast";

// ⭐ Our mobile global layout
import MobileLayout from "@/components/MobileLayout";

const navItems = [
  { id: "dashboard", label: "Ask Nova", emoji: "💬", icon: BarChart3 },
  { id: "recent", label: "Recent Sessions", emoji: "🕓", icon: Folder },
  { id: "cv-offer", label: "Analyze CV/Offer", emoji: "📄", icon: Rocket },
  { id: "settings", label: "Settings", emoji: "⚙️", icon: Settings },
];

function Sidebar({
  active,
  setActive,
  firstName,
  userEmail,
}: {
  active: string;
  setActive: (id: string) => void;
  firstName?: string;
  userEmail?: string;
}) {
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/auth");
  }

  return (
    <div className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-black border-r border-white/5 flex-col backdrop-blur-xl">
      <div className="flex items-center justify-center py-8">
        <motion.img
          src="https://qpnalviccuopdwfscoli.supabase.co/storage/v1/object/public/nova-assets/talentee_logo_static.svg"
          alt="Nova RH Logo"
          className="h-12 w-auto object-contain"
          animate={{ opacity: [0.9, 1, 0.9] }}
          transition={{
            duration: 3,
            repeat: Number.POSITIVE_INFINITY,
            ease: [0.16, 1, 0.3, 1],
          }}
        />
      </div>

      <nav className="flex flex-col gap-1 flex-1 px-3">
        {navItems.map((item) => (
          <motion.button
            key={item.id}
            onClick={() => setActive(item.id)}
            whileHover={{ x: 4 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              active === item.id
                ? "bg-white/10 text-white font-medium backdrop-blur-xl"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <span className="text-lg">{item.emoji}</span>
            <span className="text-[15px] tracking-tight">{item.label}</span>
          </motion.button>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-semibold text-white text-sm">
            {firstName?.[0] || "U"}
          </div>
          <div>
            <p className="text-white font-medium text-[15px] tracking-tight">
              {firstName || "User"}
            </p>
            <p className="text-xs text-gray-500 truncate">{userEmail || "—"}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full text-sm text-gray-400 hover:text-white transition"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [active, setActive] = useState("dashboard");
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState<boolean>(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string>("User");
  const [userEmail, setUserEmail] = useState<string>("");
  const [hasUsedTrial, setHasUsedTrial] = useState<boolean>(false);

  const router = useRouter();

  // Load user profile
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) return;

      setUserId(data.user.id);
      setUserEmail(data.user.email || "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("prenom, sms_freemium_used")
        .eq("id", data.user.id)
        .maybeSingle();

      setFirstName(profile?.prenom ?? "User");
      setHasUsedTrial(profile?.sms_freemium_used ?? false);
    })();
  }, []);

  // Load recent sessions
  useEffect(() => {
    if (!userId) return;
    (async () => {
      setSessionsLoading(true);

      const { data, error } = await supabase
        .from("nova_sessions")
        .select(`
          id,
          created_at,
          type_entretien,
          domain,
          sub_domain,
          score_global,
          final_feedback_summary
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!error) {
        setSessions(data || []);
      }

      setSessionsLoading(false);
    })();
  }, [userId]);

  const handleStartSimulation = () => router.push("/session/start");
  const handleFreeTrial = () => router.push("/session/start?trial=true");

  return (
    <MobileLayout>
      {/* Desktop Sidebar */}
      <Sidebar
        active={active}
        setActive={setActive}
        firstName={firstName}
        userEmail={userEmail}
      />

      {/* Desktop content */}
      <main className="hidden md:block ml-64 p-8 space-y-8">
        {active === "dashboard" && (
          <>
            {/* Buttons */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex justify-center gap-4 mb-8"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                onClick={handleStartSimulation}
                className="relative px-10 py-4 rounded-2xl bg-white text-black font-medium"
              >
                🚀 Start Simulation
              </motion.button>

              <motion.button
                onClick={!hasUsedTrial ? handleFreeTrial : undefined}
                disabled={hasUsedTrial}
                className={`px-10 py-4 rounded-2xl font-medium ${
                  hasUsedTrial
                    ? "bg-white/5 text-gray-600 cursor-not-allowed"
                    : "border border-white/10 text-white"
                }`}
              >
                🎁 {hasUsedTrial ? "Trial used" : "Free Trial"}
              </motion.button>
            </motion.div>

            {/* Ask Nova */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/[0.02] border border-white/5 rounded-[28px] p-8"
            >
              <h1 className="text-3xl font-semibold text-white mb-6 text-center">
                Ask Nova — Your AI Interview Coach
              </h1>
              {userId ? (
                <AskNova userId={userId} />
              ) : (
                <div className="text-gray-500 text-center">Loading AskNova…</div>
              )}
            </motion.div>

            {/* Articles + Tips */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <DashboardArticlesPreview onReadMore={() => setActive("content")} />
              <InterviewTips />
            </div>
          </>
        )}

        {/* Reste identique pour recent / cv-offer / settings / content */}
        {active === "recent" && (
          <motion.div className="bg-white/[0.03] border border-white/10 rounded-[28px] p-8 mt-6">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Recent Sessions
            </h2>

            {sessionsLoading && (
              <p className="text-gray-500 text-sm animate-pulse">Loading…</p>
            )}

            {!sessionsLoading && sessions.length === 0 && (
              <p className="text-gray-500 text-sm">No sessions available.</p>
            )}

            {!sessionsLoading &&
              sessions.length > 0 &&
              sessions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => router.push(`/dashboard/sessions/${s.id}`)}
                  className="cursor-pointer p-4 rounded-xl bg-white/[0.05] border border-white/10 hover:bg-white/[0.08]"
                >
                  <p className="text-sm text-gray-400">
                    {new Date(s.created_at).toLocaleString()}
                  </p>
                  <p className="text-white font-medium">
                    {s.domain} {s.sub_domain && `· ${s.sub_domain}`}
                  </p>
                  <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                    {s.final_feedback_summary || "No summary available."}
                  </p>
                  <p className="text-blue-400 text-sm font-medium mt-2">
                    Score: {s.score_global ?? "—"}
                  </p>
                </div>
              ))}
          </motion.div>
        )}

        {active === "cv-offer" && (
          <motion.div className="p-6">
            <CVOfferSection />
          </motion.div>
        )}

        {active === "settings" && (
          <motion.div className="p-6">
            <SettingsPanel />
          </motion.div>
        )}

        {active === "content" && (
          <motion.div className="p-6">
            <DashboardProArticles onBackToDashboard={() => setActive("dashboard")} />
          </motion.div>
        )}
      </main>

      <NovaToast />
    </MobileLayout>
  );
}
