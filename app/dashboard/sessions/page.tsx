"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"

// ⭐ Mobile Layout global
import MobileLayout from "@/components/MobileLayout"

export default function SessionsDashboard() {
  const router = useRouter()
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth")
        return
      }

      const { data, error } = await supabase
        .from("nova_sessions")
        .select(`
          id,
          created_at,
          score_global,
          final_feedback_summary,
          type_entretien,
          domain,
          sub_domain,
          duration,
          duration_target
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) console.error("❌ Error loading sessions:", error)

      setSessions(data || [])
      setLoading(false)
    })()
  }, [router])

  if (loading) {
    return (
      <MobileLayout>
        <main className="h-screen flex items-center justify-center bg-[#0A0A0A]">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 rounded-full border-2 border-white/20 border-t-white/80 animate-spin" />
            <p className="text-gray-400 text-lg font-light tracking-tight">
              Loading your sessions…
            </p>
          </div>
        </main>
      </MobileLayout>
    )
  }

  return (
    <MobileLayout>
      <main className="min-h-screen bg-[#0A0A0A] px-4 sm:px-6 py-10 text-white">
        <div className="max-w-6xl mx-auto">

          {/* HEADER */}
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-3 bg-gradient-to-r from-blue-400 via-purple-300 to-blue-400 bg-clip-text text-transparent">
            Your Sessions
          </h1>
          <p className="text-gray-400 text-sm mb-10">
            View and manage all your interview simulations
          </p>

          {/* NO SESSIONS */}
          {sessions.length === 0 ? (
            <div className="flex items-center justify-center py-32">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-xl">
                  <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm">You have no sessions yet.</p>
              </div>
            </div>
          ) : (

            /* GRID MOBILE + DESKTOP */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => router.push(`/dashboard/sessions/${s.id}`)}
                  className="cursor-pointer p-5 rounded-2xl border border-white/10 bg-gradient-to-br 
                             from-white/[0.08] via-white/[0.04] to-black/40 backdrop-blur-xl 
                             hover:shadow-[0_0_40px_rgba(255,255,255,0.12)] hover:border-white/20 
                             transition-all duration-300 hover:-translate-y-1"
                >
                  {/* HEADER */}
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-xs text-gray-500">
                      {new Date(s.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    <span className="px-3 py-1.5 bg-white/10 text-xs font-medium rounded-full border border-white/10">
                      {s.type_entretien?.replace("_", " ") || "Interview"}
                    </span>
                  </div>

                  {/* TITLE */}
                  <h2 className="text-lg sm:text-xl font-semibold mb-2 text-white/95">
                    {s.domain ? `${s.domain}${s.sub_domain ? " · " + s.sub_domain : ""}` : "Interview Session"}
                  </h2>

                  {/* SUMMARY */}
                  <p className="text-sm text-gray-400 leading-relaxed line-clamp-3 mb-5">
                    {s.final_feedback_summary || "No final feedback was generated for this session."}
                  </p>

                  {/* FOOTER */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-400" />
                      <span className="text-blue-400 font-semibold text-sm">
                        Score: {s.score_global ?? "—"}
                      </span>
                    </div>

                    <span className="text-xs text-gray-500">
                      {Math.round((s.duration / 60) * 10) / 10} /{" "}
                      {Math.round((s.duration_target / 60) * 10) / 10} min
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </MobileLayout>
  )
}
