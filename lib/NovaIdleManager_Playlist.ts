/**
 * ======================================================
 *  🎧 NovaIdleManager_Playlist — V3 Production (+ Écran Fin Nova)
 * ------------------------------------------------------
 *  Gère les boucles d’écoute et relances dans le flux Playlist :
 *  - idle_listen ×5 puis idle_smile
 *  - relance Clarify après 5s de silence
 *  - double silence → question suivante
 *  - voix ElevenLabs intégrée pour les relances GPT
 *  - ajout écran noir + logo Nova à la fin
 * ======================================================
 */

import { getSystemVideo } from "@/lib/videoManager";
import { NovaPlaylistManager } from "@/lib/NovaPlaylistManager";

type IdleManagerOptions = {
  lang: string;
  playlist: NovaPlaylistManager;
  onNextQuestion: () => Promise<void>;
  getFollowupText?: () => Promise<string | null>;
};

export class NovaIdleManager_Playlist {
  private lang: string;
  private playlist: NovaPlaylistManager;
  private onNextQuestion: () => Promise<void>;
  private getFollowupText?: () => Promise<string | null>;
  private silenceTimer: any = null;
  private hasSpoken = false;
  private relanceCount = 0;

  constructor(opts: IdleManagerOptions) {
    this.lang = opts.lang;
    this.playlist = opts.playlist;
    this.onNextQuestion = opts.onNextQuestion;
    this.getFollowupText = opts.getFollowupText;
  }

  /* ======================================================
     🎧 Boucle d'écoute principale (idle_listen → smile)
  ====================================================== */
  async startLoop() {
    console.log("🎧 IdleManager_Playlist — boucle écoute démarrée");
    await this.enqueueIdleSet();
    this.resetSilenceTimer();
  }

  async enqueueIdleSet() {
    try {
      const urls: string[] = [];
      // 5 clips d’écoute + 1 sourire
      for (let i = 1; i <= 5; i++) {
        urls.push(await getSystemVideo("idle_listen", this.lang));
      }
      urls.push(await getSystemVideo("idle_smile", this.lang));
      this.playlist.add(...urls);
    } catch (err) {
      console.warn("⚠️ Impossible d’ajouter idle set:", err);
    }
  }

  stopLoop() {
    console.log("🛑 IdleManager_Playlist — boucle stoppée");
    if (this.silenceTimer) clearTimeout(this.silenceTimer);
  }

  /* ======================================================
     🧠 Tracking de la parole utilisateur
  ====================================================== */
  onUserSpeaking() {
    this.hasSpoken = true;
    this.relanceCount = 0;
    this.resetSilenceTimer();
  }

  resetContext() {
    this.hasSpoken = false;
    this.relanceCount = 0;
    if (this.silenceTimer) clearTimeout(this.silenceTimer);
  }

  /* ======================================================
     🔇 Gestion du silence (5s sans activité)
  ====================================================== */
  resetSilenceTimer() {
    if (this.silenceTimer) clearTimeout(this.silenceTimer);
    this.silenceTimer = setTimeout(() => this.handleSilence(), 5000);
  }

  async handleSilence() {
    console.log("🔇 5s de silence détectées");

    // 🧠 Cas 1 : silence initial (avant toute parole)
    if (!this.hasSpoken) {
      console.log("🤔 Silence initial — patience");
      this.resetSilenceTimer();
      return;
    }

    // 🧠 Cas 2 : silence après réponse
    if (this.relanceCount >= 1) {
      console.log("⏭️ Double silence → question suivante");
      this.relanceCount = 0;
      await this.onNextQuestion?.();
      return;
    }

    this.relanceCount++;
    await this.enqueueClarifySequence();
  }

  /* ======================================================
     🗣 Séquence Clarify (relance IA + voix ElevenLabs)
  ====================================================== */
  private async enqueueClarifySequence() {
    try {
      console.log("🎞 Clarify sequence — Nova relance IA");

      const clar1 = await getSystemVideo("clarify_end_alt", this.lang);
      const clar2 = await getSystemVideo("clarify_end", this.lang);

      // 🔹 Récupérer texte GPT ou fallback
      let followText = (await this.getFollowupText?.()) || null;
      if (!followText) {
        const res = await fetch("/api/gpt/contextual-followup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: "current_question",
            answer: "",
            lang: this.lang,
          }),
        });
        const gptData = await res.json();
        followText =
          gptData.followup_text || "Do you want me to repeat the question?";
      }

      // 🔊 Lecture vocale ElevenLabs pendant la vidéo Clarify
      try {
        const tts = await fetch("/api/nova-speak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: followText, lang: this.lang }),
        });

        if (tts.ok) {
          const blob = await tts.blob();
          const audioUrl = URL.createObjectURL(blob);
          const audio = new Audio(audioUrl);
          audio.volume = 1.0;
          audio.playbackRate = 1.0;
          await audio.play().catch(() => {});
        }

        console.log("💬 Relance Nova :", followText);
      } catch (err) {
        console.warn("⚠️ Erreur ElevenLabs Clarify :", err);
      }

      // Ajoute les deux vidéos Clarify dans la playlist
      this.playlist.add(clar1, clar2);

      // 🔁 Après la relance → reprendre l’écoute
      setTimeout(() => this.enqueueIdleSet(), 2000);
      this.resetSilenceTimer();
    } catch (err) {
      console.error("❌ Clarify sequence error :", err);
      await this.onNextQuestion?.();
    }
  }

  /* ======================================================
     🖼️ Écran de fin avec logo Nova central
  ====================================================== */
  async showEndScreen() {
    console.log("🕹️ Affichage écran de fin Nova RH");

    // Supprime tout overlay existant
    const existing = document.getElementById("nova-end-screen");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.id = "nova-end-screen";
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.backgroundColor = "black";
    overlay.style.display = "flex";
    overlay.style.flexDirection = "column";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.zIndex = "9999";
    overlay.style.animation = "fadeIn 2s ease-in-out";
    overlay.style.color = "white";
    overlay.style.fontFamily = "Inter, sans-serif";

    // Logo central Nova
    const logo = document.createElement("img");
    logo.src =
      "https://qpnalviccuopdwfscoli.supabase.co/storage/v1/object/public/nova-assets/nova-logo.png";
    logo.alt = "Nova Logo";
    logo.style.width = "160px";
    logo.style.height = "160px";
    logo.style.marginBottom = "24px";
    logo.style.opacity = "0.9";

    // Texte
    const text = document.createElement("div");
    text.innerText = "Session terminée — Merci d’avoir participé";
    text.style.fontSize = "1.5rem";
    text.style.textAlign = "center";
    text.style.opacity = "0.85";

    overlay.appendChild(logo);
    overlay.appendChild(text);
    document.body.appendChild(overlay);

    // Animation fadeIn
    const style = document.createElement("style");
    style.innerHTML = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    // Suppression auto après 6 secondes (optionnel)
    setTimeout(() => {
      overlay.style.transition = "opacity 1s";
      overlay.style.opacity = "0";
      setTimeout(() => overlay.remove(), 1000);
    }, 6000);
  }
}
