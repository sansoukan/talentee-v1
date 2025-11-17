/**
 * ======================================================
 *  🧠 Nova Voice Utilities — V10 (Whisper + Deepgram + Speech Hooks)
 * ------------------------------------------------------
 *  🔊 speak(text)             → appelle /api/tts (ElevenLabs ou OpenAI)
 *  🎙 transcribeAudio(blob)   → envoie l’audio vers /api/stt (Whisper)
 *  🎧 novaOnSpeechStart(cb)   → hook début de parole (NovaEngine V5)
 *  🔇 novaOnSilence(cb)       → hook silence/parole stoppée (NovaEngine V5)
 *  🧩 enable/disableTranscription → contrôle sécurité micro
 * ======================================================
 */

let ALLOW_TRANSCRIPTION = false;
const BASE_URL =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
    : process.env.NEXT_PUBLIC_SITE_URL || "";

/* ======================================================
   🔒 VERROU TRANSCRIPTION
   ====================================================== */
export function enableNovaTranscription() {
  console.log("🎙️ Nova transcription ENABLED (client)");
  ALLOW_TRANSCRIPTION = true;
}

export function disableNovaTranscription() {
  console.log("🔒 Nova transcription DISABLED (client)");
  ALLOW_TRANSCRIPTION = false;
}

/* ======================================================
   🔵 HOOKS NOVAENGINE V5 : Speech Start / Silence
   ====================================================== */
export function novaOnSpeechStart(cb: () => void) {
  (window as any).__novaSpeechStart = cb;
}

export function novaOnSilence(cb: () => void) {
  (window as any).__novaSilence = cb;
}

/* ======================================================
   🔊 SPEAK — client → /api/tts
   ====================================================== */
export async function speak(
  text: string,
  lang: "en" | "fr" = "en",
  provider: "elevenlabs" | "openai" = "elevenlabs"
) {
  try {
    if (typeof window === "undefined") return null;
    if (!text || !text.trim()) return null;

    console.log(`🗣️ speak(): [${provider}] ${lang} → "${text}"`);

    const res = await fetch(`${BASE_URL}/api/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, lang, provider }),
    });

    if (!res.ok) throw new Error(`TTS request failed (${res.status})`);

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.volume = 1.0;
    audio.playbackRate = 1.0;
    await audio.play().catch(() => {});
    return audio;
  } catch (err) {
    console.error("❌ speak() error:", err);
    return null;
  }
}

/* ======================================================
   🎧 TRANSCRIBE AUDIO — client → /api/stt
   ====================================================== */
export async function transcribeAudio(fileOrBlob: Blob | File | string): Promise<string> {
  try {
    if (!ALLOW_TRANSCRIPTION) {
      console.warn("🚫 transcribeAudio() blocked (transcription disabled)");
      return "";
    }

    if (typeof window === "undefined") return "";

    let blob: Blob | null = null;
    if (fileOrBlob instanceof Blob || fileOrBlob instanceof File) {
      blob = fileOrBlob;
    } else if (typeof fileOrBlob === "string") {
      const resp = await fetch(fileOrBlob);
      blob = await resp.blob();
    }

    if (!blob) throw new Error("Invalid or empty audio blob.");

    const sizeKB = Math.round(blob.size / 1024);
    console.log(`🎧 Audio ready (${sizeKB} KB) → sending to Whisper STT...`);

    if (blob.size < 2000) {
      console.warn("⚠️ Audio too short (<2KB) — skipping transcription.");
      return "";
    }

    const form = new FormData();
    form.append("file", blob, "recording.webm");

    const STT_URL = `${BASE_URL}/api/stt`;
    let res = await fetch(STT_URL, { method: "POST", body: form });

    if (!res.ok) {
      const errorText = await res.text();
      console.warn(
        `⚠️ Whisper STT failed (${res.status}) → fallback Deepgram.`,
        errorText
      );

      try {
        const DG_URL = `${BASE_URL}/api/deepgram-proxy`;
        res = await fetch(DG_URL, { method: "POST", body: form });
      } catch (dgErr) {
        console.error("❌ Deepgram fallback failed:", dgErr);
        return "";
      }
    }

    const data = await res.json();
    const text = data?.text?.trim?.() || "";
    const provider = data?.provider || (res.ok ? "openai" : "deepgram");

    if (!text) {
      console.warn(`🤔 ${provider.toUpperCase()} returned empty transcript.`);
      return "";
    }

    console.log(`✅ STT (${provider}) → "${text}"`);
    return text;
  } catch (err: any) {
    console.error("❌ transcribeAudio() error:", err);
    return "";
  }
}

/* ======================================================
   🧹 CLEANUP
   ====================================================== */
export function cleanTempFiles() {
  return;
}
