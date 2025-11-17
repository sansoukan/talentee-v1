"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { getSystemVideo } from "@/lib/videoManager"
import { preloadSystemVideos } from "@/lib/preloadSystemVideos"
import { useNovaRealtimeVoice } from "@/hooks/useNovaRealtimeVoice"
import { NOVA_SESSION_CONFIG } from "@/config/novaSessionConfig"
import NovaTimer from "@/components/NovaTimer"
import RecordingControl from "@/components/RecordingControl"
import { NovaPlaylistManager } from "@/lib/NovaPlaylistManager"
import { NovaIdleManager_Playlist } from "@/lib/NovaIdleManager_Playlist"
import NovaChatBox_TextOnly from "@/components/NovaChatBox_TextOnly"
import { enableNovaTranscription, disableNovaTranscription } from "@/lib/voice-utils"
import { motion, AnimatePresence } from "framer-motion"

export default function NovaEngine_Playlist({ sessionId }: { sessionId: string }) {
  const router = useRouter()
  const recordingRef = useRef<any>(null)
  const chatRef = useRef<any>(null)
  const playlist = useRef(new NovaPlaylistManager()).current
  const idleMgrRef = useRef<any>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const userCameraRef = useRef<HTMLVideoElement | null>(null)

  const startTimeRef = useRef<number | null>(null)
  const pausesRef = useRef<number[]>([])
  const lastSilentAtRef = useRef<number | null>(null)

  const [session, setSession] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [videoSrc, setVideoSrc] = useState<string>("/placeholder.mp4")
  const [isPlaying, setIsPlaying] = useState(false)
  const [videoPaused, setVideoPaused] = useState(false)
  const [audioUnlocked, setAudioUnlocked] = useState(false)
  const [lastFollowupText, setLastFollowupText] = useState<string | null>(null)
  const [hovered, setHovered] = useState(false)
  const [userCameraHovered, setUserCameraHovered] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [micEnabled, setMicEnabled] = useState(false)
  const [videoToQuestionMap, setVideoToQuestionMap] = useState<Record<string, any>>({})
  const [userCameraStream, setUserCameraStream] = useState<MediaStream | null>(null)
  const [showDashboardButton, setShowDashboardButton] = useState(false)
  const [showPreparingOverlay, setShowPreparingOverlay] = useState(false)

  const responseMetrics = useRef({
    startTime: 0,
    detectedPauses: [] as number[],
    lastSilenceTime: null as number | null,
    currentTranscript: "",
    currentQuestionId: null as string | null,
    scoring_axes: null,
    feedbackVideo: null,
    expectedAnswer: null,
    currentScore: null,
    currentScoreAuto: null,
  })

  const novaVoice = useNovaRealtimeVoice(session?.lang || "en")
  const durationSecSafe = useMemo(() => session?.duration_target ?? NOVA_SESSION_CONFIG.durationSec, [session])

  useEffect(() => {
    ;(async () => {
      console.log("📦 Préchargement des vidéos système...")
      await preloadSystemVideos("en")
      console.log("✅ Préchargement terminé")
    })()
  }, [])

  useEffect(() => {
    ;(async () => {
      console.log("📡 Chargement de la session et des questions...")
      let attempts = 0
      let json: any = null
      let res: any = null

      while (attempts < 6) {
        try {
          res = await fetch(`/api/engine/orchestrate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id: sessionId }),
          })
          json = await res.json()
        } catch {
          json = null
        }

        if (res.ok && (json?.questions?.length > 0 || json?.action === "INIT_Q1")) {
          console.log(
            `✅ Tentative ${attempts + 1}: séquence orchestrée reçue (${json?.questions?.length || 1} question(s))`,
          )
          break
        } else {
          console.warn(
            `⚠️ Tentative ${attempts + 1}: orchestrate a renvoyé ${res.status} — payload: ${JSON.stringify(json)}`,
          )
        }

        console.warn(`⏳ Tentative ${attempts + 1} — orchestration encore en attente → nouvelle vérif dans 2s...`)
        await new Promise((r) => setTimeout(r, 2000))
        attempts++
      }
      if (!json?.questions?.length && json?.action !== "INIT_Q1") {
        console.error("❌ Aucune question reçue après 6 tentatives → redirection vers le Dashboard.")
        router.push("/dashboard")
        return
      }

      if (!json?.id && !json?.session_id) {
        console.error("❌ Session introuvable après 6 tentatives → redirection vers le Dashboard.")
        router.push("/dashboard")
        return
      }

      console.log("🚀 Nova Engine prêt à démarrer (session:", sessionId, ", status:", json.status, ")")
      console.log("📊 Nombre de questions:", json.questions?.length || 0)

      playlist.reset?.()
      console.log("♻️ Playlist réinitialisée avant nouvelle simulation")

      setSession(json)
      setQuestions(json.questions || [])
      setHasStarted(false)
      setIsPlaying(false)
      setVideoSrc(null)
    })()
  }, [sessionId, playlist, router])

  useEffect(() => {
    if (!session) return

    idleMgrRef.current = new NovaIdleManager_Playlist({
      lang: session.lang || "en",
      playlist,
      onNextQuestion: async () => {
        const next = questions[currentIndex + 1]
        if (next) {
          const lang = session?.lang || "en"
          const nextVideo =
            next?.video_url_en ||
            next?.video_url_fr ||
            "https://qpnalviccuopdwfscoli.supabase.co/storage/v1/object/public/videos/system/question_missing.mp4"

          playlist.add(nextVideo)
          setVideoToQuestionMap((prev) => ({ ...prev, [nextVideo]: next }))
          playlist.isPlaying = false
          playlist.next()
          setCurrentIndex((i) => i + 1)
        } else {
          console.log("🏁 Fin des questions → vidéos de clôture")
          const end1 = await getSystemVideo("nova_end_interview_en", session.lang || "en")
          const end2 = await getSystemVideo("nova_feedback_final", session.lang || "en")
          playlist.add(end1, end2)
          playlist.isPlaying = false
          playlist.next()
        }
      },
      getFollowupText: async () => lastFollowupText,
    })

    console.log("🧠 IdleManager_Playlist initialisé")
  }, [session, questions, currentIndex, playlist, lastFollowupText])

  useEffect(() => {
    playlist.subscribe((next) => {
      if (!next) {
        console.log("⏸ Playlist vide — attente de clips.")
        return
      }

      const v = videoRef.current
      if (!v) return

      const preload = document.createElement("video")
      preload.src = next
      preload.preload = "auto"
      preload.load()

      v.classList.add("loading")

      preload.addEventListener(
        "canplaythrough",
        () => {
          v.src = next
          v.load()

          v.addEventListener(
            "canplay",
            () => {
              v.classList.remove("loading")
              v.classList.add("ready")
              v.play().catch((err) => console.warn("Autoplay blocked", err))
            },
            { once: true },
          )
        },
        { once: true },
      )

      console.log("🎬 Lecture du prochain clip:", next)
      setVideoSrc(next)
    })
  }, [playlist])

  useEffect(() => {
    const src = typeof videoSrc === "string" ? videoSrc : videoSrc?.url || ""

    const micActivePatterns = ["idle_listen", "idle_smile", "listen_idle_01"]

    const shouldEnableMic = micActivePatterns.some((p) => src.includes(p))

    if (shouldEnableMic && !micEnabled) {
      console.log("🎤 Micro ACTIVÉ pour :", src)
      enableNovaTranscription()
      setMicEnabled(true)
    } else if (!shouldEnableMic && micEnabled) {
      console.log("🔇 Micro DÉSACTIVÉ pendant :", src)
      disableNovaTranscription()
      setMicEnabled(false)
    }
  }, [videoSrc, micEnabled])

  useEffect(() => {
    async function setupUserCamera() {
      console.log("[v0] 📷 Starting user camera setup...")
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: false,
        })
        console.log("[v0] ✅ Camera stream obtained:", stream)
        console.log("[v0] Video tracks:", stream.getVideoTracks())
        setUserCameraStream(stream)
        if (userCameraRef.current) {
          userCameraRef.current.srcObject = stream
          console.log("[v0] ✅ Stream assigned to video element")
        } else {
          console.log("[v0] ⚠️ userCameraRef.current is null")
        }
      } catch (err) {
        console.error("[v0] ❌ Could not access user camera:", err)
      }
    }

    setupUserCamera()

    return () => {
      console.log("[v0] 🧹 Cleaning up camera stream...")
      if (userCameraStream) {
        userCameraStream.getTracks().forEach((track) => {
          console.log("[v0] Stopping track:", track.label)
          track.stop()
        })
      }
    }
  }, [])

  useEffect(() => {
    console.log("[v0] 🔄 Camera stream effect triggered")
    console.log("[v0] userCameraRef.current:", userCameraRef.current)
    console.log("[v0] userCameraStream:", userCameraStream)
    if (userCameraRef.current && userCameraStream) {
      userCameraRef.current.srcObject = userCameraStream
      console.log("[v0] ✅ Stream re-assigned to video element")
    }
  }, [userCameraStream])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && hasStarted) {
        e.preventDefault()
        const v = videoRef.current
        if (!v) return

        if (isPlaying) {
          v.pause()
          setVideoPaused(true)
          setIsPlaying(false)
          console.log("⏸ Pause vidéo (spacebar):", videoSrc)
        } else {
          v.play()
          setVideoPaused(false)
          setIsPlaying(true)
          console.log("▶️ Reprise vidéo (spacebar):", videoSrc)
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [hasStarted, isPlaying, videoSrc])

  useEffect(() => {
    ;(window as any).__novaResponseMetrics = responseMetrics.current
    ;(window as any).__novaSessionId = sessionId
    ;(window as any).__novaUserId = session?.user_id
  }, [sessionId, session])

  const handleStart = async () => {
    playlist.reset?.()
    console.log("♻️ Playlist nettoyée avant démarrage")
    if (!session) return console.warn("⚠️ Session non chargée")
    const lang = session?.lang || "en"
    try {
      const intro1 = await getSystemVideo("intro_en_1", lang)
      const intro2 = await getSystemVideo("intro_en_2", lang)
      playlist.add(intro1)
      playlist.add(intro2)
      console.log("🎞️ Playlist initialisée avec intro_1 + intro_2")
      setIsPlaying(true)
      setVideoPaused(false)
      setHasStarted(true)
      enableNovaTranscription()
      recordingRef.current?.startRecording()
      const v = videoRef.current
      if (v) {
        v.muted = true
        await v
          .play()
          .then(() => console.log("▶️ Lecture vidéo démarrée"))
          .catch((err) => console.warn("🔇 Autoplay bloqué:", err))
      }
    } catch (err) {
      console.error("❌ Erreur pendant le handleStart:", err)
    }
  }

  const handleEnded = async () => {
    console.log("⏹ Clip terminé:", videoSrc)
    playlist.next()
    const currentSrc = typeof videoSrc === "string" ? videoSrc : videoSrc?.url || ""

    if (currentSrc.includes("intro_en_1")) {
      console.log("➡️ Fin intro_1 détectée — lancement intro_2")
      const nextIntro = await getSystemVideo("intro_en_2", session?.lang || "en")
      playlist.add(nextIntro)
      playlist.isPlaying = false
      playlist.next()
      return
    }

    if (currentSrc.includes("intro_en_2")) {
      console.log("➡️ Fin intro_2 — appel orchestrateur pour obtenir la séquence complète")

      const res = await fetch("/api/engine/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      })
      const json = await res.json()

      if (res.ok && json?.action === "INIT_Q1" && json?.question) {
        const q1 = json.question
        const lang = session?.lang || "en"
        const q1Video =
          (lang === "fr" ? q1?.video_url_fr || q1?.video_url_en : q1?.video_url_en || q1?.video_url_fr) ||
          "https://qpnalviccuopdwfscoli.supabase.co/storage/v1/object/public/videos/system/question_missing.mp4"
        playlist.add(q1Video)
        setVideoToQuestionMap((prev) => ({ ...prev, [q1Video]: q1 }))
        playlist.isPlaying = false
        playlist.next()
        console.log("🎥 Lancement question initiale:", q1Video)
        return
      }

      if (res.ok && json?.action === "INIT_SEQUENCE" && Array.isArray(json.questions)) {
        console.log(`🧠 Séquence complète reçue (${json.questions.length} questions)`)
        setQuestions(json.questions)
        setSession((prev) => ({ ...prev, questions: json.questions }))
        const firstQ = json.questions[0]
        if (!firstQ) {
          console.warn("⚠️ INIT_SEQUENCE vide")
          return
        }

        const lang = session?.lang || "en"
        const firstVideo =
          (lang === "fr"
            ? firstQ?.video_url_fr || firstQ?.video_url_en
            : firstQ?.video_url_en || firstQ?.video_url_fr) ||
          "https://qpnalviccuopdwfscoli.supabase.co/storage/v1/object/public/videos/system/question_missing.mp4"

        playlist.add(firstVideo)
        setVideoToQuestionMap((prev) => ({ ...prev, [firstVideo]: firstQ }))
        playlist.isPlaying = false
        playlist.next()
        console.log("🎥 Démarrage de la première question de la séquence:", firstVideo)
        return
      }

      console.warn("⚠️ Aucune question valide reçue après intro_2", json)
      return
    }

    if (currentSrc.includes("q_0001")) {
      console.log("⏭️ Fin q_0001 — relance orchestrateur pour la séquence complète")
      const res = await fetch("/api/engine/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      })
      const json = await res.json()
      if (res.ok && json?.questions?.length > 0) {
        setQuestions(json.questions)
        setSession(json)
        const nextQ = json.questions[1]
        if (nextQ) {
          const lang = session?.lang || "en"
          const nextVideo =
            (lang === "fr" ? nextQ?.video_url_fr || nextQ?.video_url_en : nextQ?.video_url_en || nextQ?.video_url_fr) ||
            "https://qpnalviccuopdwfscoli.supabase.co/storage/v1/object/public/videos/system/question_missing.mp4"
          setCurrentIndex(currentIndex + 1)
          playlist.add(nextVideo)
          setVideoToQuestionMap((prev) => ({ ...prev, [nextVideo]: nextQ }))
          playlist.isPlaying = false
          playlist.next()
        }
      }
      return
    }

    if (currentSrc.includes("q_")) {
      console.log("🧠 Fin de question — ajout de idle_listen")
      const currentQuestion = videoToQuestionMap[videoSrc as string]
      if (currentQuestion) {
        responseMetrics.current.currentQuestionId = currentQuestion.id
      }
      const idle = await getSystemVideo("idle_listen", session.lang || "en")
      playlist.add(idle)
      playlist.isPlaying = false
      playlist.next()

      idleMgrRef.current?.resetContext?.()
      idleMgrRef.current?.startLoop?.()
      return
    }

    if (currentSrc.includes("idle_listen")) {
      const nextIndex = currentIndex + 1
      const nextQuestion = questions[nextIndex]
      if (nextQuestion) {
        const nextVideo =
          nextQuestion?.video_url_en ||
          nextQuestion?.video_url_fr ||
          "https://qpnalviccuopdwfscoli.supabase.co/storage/v1/object/public/videos/system/question_missing.mp4"
        setCurrentIndex(nextIndex)
        playlist.add(nextVideo)
        setVideoToQuestionMap((prev) => ({ ...prev, [nextVideo]: nextQuestion }))
        playlist.isPlaying = false
        playlist.next()
      } else {
        console.log("🏁 Fin des questions → séquence de clôture premium")
        const end1 = await getSystemVideo("nova_end_simulation", session.lang || "en")
        const end2 = await getSystemVideo("nova_prepare_feedback", session.lang || "en")
        const idle = await getSystemVideo("idle_listen", session.lang || "en")

        playlist.add(end1)
        playlist.add(end2)
        playlist.add(idle)

        playlist.isPlaying = false
        playlist.next()

        try {
          console.log("📢 Generating final session feedback...")

          const res = await fetch("/api/session/feedback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id: sessionId }),
          })

          const fb = await res.json()

          if (fb.ok) {
            if (fb.final_text) {
              chatRef.current?.addMessage("nova", fb.final_text)
            }
            if (fb.audio_base64) {
              const audio = new Audio(`data:audio/mp3;base64,${fb.audio_base64}`)
              audio.play().catch((err) => console.warn("Audio error:", err))
            }
          } else {
            console.warn("⚠️ Final feedback error:", fb.error)
          }

          setShowDashboardButton(true)
        } catch (err) {
          console.error("❌ Error generating final feedback:", err)
        }
      }
      return
    }

    if (playlist.size() === 0) {
      const idle = await getSystemVideo("idle_listen", session.lang || "en")
      playlist.add(idle)
      playlist.isPlaying = false
      playlist.next()
    }
  }

  async function handleUserChatMessage(message: string) {
    console.log("💬 User message:", message)
    try {
      const lastQuestion = chatRef.current?.getLastQuestion() || null
      const res = await fetch("/api/nova-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userMessage: message, lastQuestion }),
      })
      const data = await res.json()
      console.log("🧠 Nova response:", data)
      chatRef.current?.addMessage("nova", data.reply || "I'm here to help!")
    } catch (err) {
      console.error("❌ nova-chat error:", err)
      chatRef.current?.addMessage("nova", "Sorry, I couldn't process your message.")
    }
  }

  const handleSessionEnd = async () => {
    console.log("⏹ Fin de session par timer")

    playlist.reset?.()
    setIsPlaying(false)
    setHasStarted(false)
    setMicEnabled(false)
    videoRef.current?.pause()

    idleMgrRef.current?.showEndScreen?.()

    try {
      await fetch("/api/session/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      })
      console.log("✅ Session marquée terminée en base:", sessionId)
    } catch (err) {
      console.warn("⚠️ Erreur enregistrement fin session:", err)
    }

    try {
      console.log("📢 Generating final session feedback (timer mode)...")

      setShowPreparingOverlay(true)
      chatRef.current?.addMessage("nova", "Give me a moment to prepare your final feedback…")

      const res = await fetch("/api/session/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      })

      const fb = await res.json()

      setShowPreparingOverlay(false)

      if (fb.ok) {
        if (fb.final_text) {
          chatRef.current?.addMessage("nova", fb.final_text)
        }
        if (fb.audio_base64) {
          const audio = new Audio(`data:audio/mp3;base64,${fb.audio_base64}`)
          audio.play().catch((err) => console.warn("Audio error:", err))
        }
      } else {
        console.warn("⚠️ Final feedback (timer) error:", fb.error)
      }
    } catch (err) {
      console.error("❌ Error generating final feedback (timer):", err)
      setShowPreparingOverlay(false)
    }

    setShowDashboardButton(true)
  }

  return (
    <main className="flex h-screen w-screen bg-black text-white overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-14 bg-gradient-to-b from-black/90 to-black/50 backdrop-blur-sm flex items-center justify-between px-8 z-20">
        <span className="text-base font-semibold tracking-wide">Nova Stream</span>
        <div className="flex items-center gap-3">
          {isPlaying && (
            <span className="flex items-center gap-2 text-xs font-medium text-gray-400">
              <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
              Live
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 pt-14 overflow-hidden">
        <div
          className="flex-1 flex flex-col items-center justify-center bg-black relative group"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <div className="relative w-full max-w-[95%] lg:max-w-[85%] aspect-video">
            {videoSrc ? (
              <video
                ref={videoRef}
                src={typeof videoSrc === "string" ? videoSrc : videoSrc?.url || ""}
                autoPlay
                playsInline
                preload="auto"
                muted={!audioUnlocked}
                onCanPlay={() => {
                  const v = videoRef.current
                  if (!v) return
                  v.play().catch(() => console.warn("⚠️ Autoplay bloqué:", videoSrc))
                }}
                onPlay={() => {
                  console.log("▶️ Lecture en cours:", videoSrc)
                  setIsPlaying(true)
                  const src = typeof videoSrc === "string" ? videoSrc : videoSrc?.url || ""
                  setMicEnabled(src.includes("idle_listen"))
                  const q = videoToQuestionMap[videoSrc as string]
                  if (q) {
                    const lang = session?.lang || "en"
                    const questionText = lang === "fr" ? q.question_fr || q.question_en : q.question_en || q.question_fr

                    chatRef.current?.addMessage("nova", questionText)
                    console.log("🧩 Question affichée:", q.id, questionText)
                  }
                }}
                onPause={() => console.log("⏸ Pause détectée:", videoSrc)}
                onEnded={handleEnded}
                className="w-full h-full object-cover rounded-lg shadow-2xl shadow-black/50 transition-opacity duration-250"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-lg flex items-center justify-center">
                <div className="text-gray-600 text-sm">Loading...</div>
              </div>
            )}

            {!hasStarted && (
              <button
                onClick={async (e) => {
                  e.stopPropagation()
                  console.log("🎯 Bouton START cliqué !")
                  await handleStart()
                }}
                className="absolute inset-0 m-auto w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 active:scale-95 flex items-center justify-center border border-white/20 shadow-2xl transition-all duration-300 ease-out cursor-pointer z-30 animate-pulse hover:animate-none group/start"
                aria-label="Start session"
              >
                <svg
                  className="w-10 h-10 lg:w-12 lg:h-16 text-white ml-1 group-hover/start:scale-110 transition-transform duration-300"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            )}

            {hasStarted && (
              <AnimatePresence>
                {hovered && !isPlaying && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 flex items-center justify-center z-20"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        const v = videoRef.current
                        if (!v) return

                        if (isPlaying) {
                          v.pause()
                          setVideoPaused(true)
                          setIsPlaying(false)
                          console.log("⏸ Pause vidéo:", videoSrc)
                        } else {
                          v.play()
                          setVideoPaused(false)
                          setIsPlaying(true)
                          console.log("▶️ Reprise vidéo:", videoSrc)
                        }
                      }}
                      className="group/playpause"
                      aria-label={isPlaying ? "Pause video" : "Play video"}
                    >
                      <div className="relative transition-all duration-300 ease-out group-hover/playpause:scale-110 active:scale-95">
                        <svg
                          className="w-12 h-12 lg:w-16 lg:h-16 text-white opacity-50 group-hover/playpause:opacity-100 transition-opacity duration-300 drop-shadow-2xl ml-1"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            )}

            {!audioUnlocked && isPlaying && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 animate-[fadeIn_0.5s_ease-out]">
                <button
                  onClick={async () => {
                    const v = videoRef.current
                    if (!v) return
                    v.muted = false
                    await v.play().catch(() => console.warn("🔇 Impossible d'activer le son"))
                    setAudioUnlocked(true)
                  }}
                  className="group/audio relative px-6 py-3 rounded-full bg-white/95 hover:bg-white backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 ease-out hover:scale-105 active:scale-95"
                  aria-label="Unmute video"
                >
                  <div className="flex items-center gap-2.5">
                    <svg
                      className="w-5 h-5 lg:w-16 lg:h-16 text-black"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                      />
                    </svg>
                    <span className="text-sm font-semibold text-black">Unmute</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          <div
            onClick={(e) => {
              if (!hasStarted) return
              e.stopPropagation()
              const v = videoRef.current
              if (!v) return

              if (isPlaying) {
                v.pause()
                setVideoPaused(true)
                setIsPlaying(false)
                console.log("⏸ Pause vidéo (click):", videoSrc)
              } else {
                v.play()
                setVideoPaused(false)
                setIsPlaying(true)
                console.log("▶️ Reprise vidéo (click):", videoSrc)
              }
            }}
            className="absolute inset-0 cursor-pointer z-10"
          />

          <div className="absolute bottom-6 right-6 z-20">
            <NovaTimer totalMinutes={durationSecSafe / 60} onHardStop={handleSessionEnd} />
          </div>
        </div>

        <div className="w-[340px] bg-gradient-to-b from-gray-950 to-black border-l border-gray-900 flex flex-col">
          <div className="flex-1 overflow-hidden">
            <NovaChatBox_TextOnly ref={chatRef} onUserMessage={handleUserChatMessage} />
          </div>

          <div className="p-4 border-t border-gray-900 bg-black/50 backdrop-blur-sm">
            <RecordingControl
              ref={recordingRef}
              sessionId={sessionId}
              userId={session?.user_id}
              onTranscript={(transcript: string) => {
                responseMetrics.current.currentTranscript = transcript
              }}
              onSilence={async (metrics) => {
                console.log("🔇 Silence détecté → IdleManager déclenché")

                const transcript = responseMetrics.current.currentTranscript || ""
                const question_id = responseMetrics.current.currentQuestionId

                const duration_ms = metrics?.duration_ms || 0
                const pauses_count = metrics?.pauses_count || 0

                const speaking_speed_wpm =
                  transcript.trim().length > 0 && duration_ms > 0
                    ? Math.round(transcript.split(" ").length / (duration_ms / 60000))
                    : 0

                const hesitations_count = transcript.match(/(euh|uh|erm|hum)/gi)?.length || 0

                const emotions_snapshot = await fetch(
                  `/api/emotions/latest?session_id=${sessionId}&question_id=${question_id}`,
                )
                  .then((r) => r.json())
                  .catch(() => null)

                const stress_score = emotions_snapshot?.stress ?? null
                const confidence_score = emotions_snapshot?.confidence ?? null
                const eye_contact_score = emotions_snapshot?.eye_contact ?? null
                const posture_score = emotions_snapshot?.posture_score ?? null

                const scoring_axes = (responseMetrics.current as any).scoring_axes || null
                const feedback_video_selected = (responseMetrics.current as any).feedbackVideo || null
                const expected_answer_used = (responseMetrics.current as any).expectedAnswer || null

                const score = (responseMetrics.current as any).currentScore || null
                const score_auto = (responseMetrics.current as any).currentScoreAuto || null

                await fetch("/api/memoire", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    user_id: session?.user_id,
                    session_id: sessionId,
                    question_id,

                    transcript,
                    score,
                    score_auto,

                    duration_ms,
                    pauses_count,
                    speaking_speed_wpm,
                    hesitations_count,

                    stress_score,
                    confidence_score,
                    eye_contact_score,
                    posture_score,
                    emotions_snapshot,

                    scoring_axes,
                    feedback_video_selected,
                    expected_answer_used,

                    lang: session?.lang,
                  }),
                })

                idleMgrRef.current?.handleSilence()
              }}
              onSpeaking={async () => {
                console.log("🗣️ Détection de parole → IdleManager averti")

                if (!startTimeRef.current) {
                  startTimeRef.current = performance.now()
                  pausesRef.current = []
                  lastSilentAtRef.current = null
                }

                if (responseMetrics.current.startTime === 0) {
                  responseMetrics.current.startTime = performance.now()
                  responseMetrics.current.detectedPauses = []
                  responseMetrics.current.lastSilenceTime = null
                  console.log("⏱️ Response timing started")
                }

                if (lastSilentAtRef.current === null) {
                  lastSilentAtRef.current = performance.now()
                }

                idleMgrRef.current?.onUserSpeaking()
              }}
            />
          </div>
        </div>
      </div>

      {showDashboardButton && (
        <button
          onClick={() => router.push("/dashboard")}
          className="fixed bottom-6 right-6 bg-white text-black px-6 py-3 rounded-xl shadow-lg hover:scale-105 transition z-50 font-semibold"
        >
          Return to dashboard
        </button>
      )}

      {showPreparingOverlay && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center space-y-4 animate-pulse">
            <div className="text-white text-lg font-semibold">Nova is preparing your final feedback…</div>
            <div className="w-8 h-8 mx-auto border-4 border-white/40 border-t-white rounded-full animate-spin"></div>
          </div>
        </div>
      )}
    </main>
  )
}
