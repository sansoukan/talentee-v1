/**
 * ======================================================
 *  🎞️ preloadSystemVideos — V3.1 SafeFetch
 * ------------------------------------------------------
 *  📦 Précharge toutes les vidéos système de Nova RH :
 *  intros, idle, clarify, feedbacks, fins.
 *  Les intros sont forcées en anglais (intro_en_1 / intro_en_2)
 *  et toutes les URLs sont sécurisées avant HEAD.
 * ======================================================
 */

import { NOVA_VIDEO_URLS } from "@/config/NovaVideoUrls";

/**
 * Précharge les vidéos système pour une langue donnée
 * @param lang "en" | "fr" | "es" (utilisé pour clarify/feedback)
 */
export async function preloadSystemVideos(lang: string = "en") {
  try {
    console.log(`🚀 Préchargement des vidéos système [lang=${lang}]...`);

    const keys = [
      // Intros → 🔒 fixées en anglais
      "intro_en_1",
      "intro_en_2",

      // Idle loop
      "idle_listen",
      "idle_smile",

      // Clarify relance
      "clarify_end_alt",
      "clarify_end",

      // Feedbacks
      "nova_feedback_positive",
      "nova_feedback_neutral",

      // Fin d’entretien
      "nova_end_interview_en",
      "nova_feedback_final",
    ];

    // ⚡ Préchargement parallèle
    await Promise.all(
      keys.map(async (key) => {
        let url: any = NOVA_VIDEO_URLS[key];

        // 🧠 Normalisation : accepte string ou {url}
        if (typeof url !== "string") {
          console.warn(`⚠️ [preloadSystemVideos] URL non-string détectée pour ${key}:`, url);
          if (url && typeof url === "object" && "url" in url) {
            url = url.url;
          } else {
            console.error(`❌ [preloadSystemVideos] URL invalide pour ${key}, ignorée.`);
            return;
          }
        }

        if (!url || typeof url !== "string" || !url.startsWith("http")) {
          console.error(`❌ [preloadSystemVideos] URL malformée pour ${key}:`, url);
          return;
        }

        try {
          const res = await fetch(url, { method: "HEAD" });
          console.log(`🔍 [preloadSystemVideos] HEAD ${key} → ${res.status}`);

          if (res.ok) {
            const video = document.createElement("video");
            video.src = url;
            video.preload = "auto";
            video.load();
            console.log(`✅ Préchargée : ${key}`);
          } else {
            console.warn(`⚠️ [preloadSystemVideos] ${key} inaccessible (status ${res.status})`);
          }
        } catch (err) {
          console.warn(`⚠️ [preloadSystemVideos] Erreur HEAD pour ${key}:`, err);
        }
      })
    );

    console.log("🎬 Toutes les vidéos système sont préchargées ✅");
  } catch (err) {
    console.error("❌ Erreur preloadSystemVideos :", err);
  }
}
