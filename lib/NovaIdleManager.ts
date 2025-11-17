/**
 * NovaIdleManager V4 — Gestion intelligente du silence (compat EngineV2)
 * ----------------------------------------------------
 * 🎧 Tant que l'utilisateur parle :
 *     → idle_listen ×5 puis idle_smile (boucle infinie)
 * 🧠 Silence avant 1re parole : patience
 * 🔇 Silence après réponse : Clarify_end_alt + Clarify_end + voix ElevenLabs
 * 🔁 Après relance : retour idle
 * 🔚 Double silence : onNextQuestion()
 */

import { getSystemVideo } from "@/lib/videoManager";

export type IdleManagerOptions = {
  lang: string;
  videoRef: HTMLVideoElement;
  onNextQuestion: () => Promise<void>;
  getFollowupText?: () => Promise<string | null>;
};

export class NovaIdleManager {
  private lang: string;
  private videoRef: HTMLVideoElement;
  private onNextQuestion: () => Promise<void>;
  private getFollowupText?: () => Promise<string | null>;

  private isLooping = false;
  private silenceTimer: any = null;
  private listenCounter = 0;
  private hasSpoken = false; // réflexion vs fin de réponse
  private relanceCount = 0;  // limite relances

  constructor(opts: IdleManagerOptions) {
    this.lang = opts.lang;
    this.videoRef = opts.videoRef;
    this.onNextQuestion = opts.onNextQuestion;
    this.getFollowupText = opts.getFollowupText;
  }

  /* ======================================================
     🎧 Boucle écoute visuelle (idle_listen x5 → idle_smile)
  ====================================================== */
  async startLoop() {
    if (this.isLooping) return;
    this.isLooping = true;
    console.log("🎧 NovaIdleManager — boucle d'écoute démarrée");

    while (this.isLooping) {
      try {
        const key = this.listenCounter >= 5 ? "idle_smile" : "idle_listen";
        const url = await getSystemVideo(key, this.lang);
        if (!url) throw new Error("🎞️ Video non trouvée: " + key);

        this.videoRef.src = url;
        this.videoRef.muted = false;
        this.videoRef.loop = false;

        await this.videoRef.play().catch(() => {});
        await new Promise<void>((resolve) => {
          this.videoRef.onended = () => resolve();
        });

        this.listenCounter = this.listenCounter >= 5 ? 0 : this.listenCounter + 1;
      } catch (e) {
        console.warn("⚠️ IdleManager loop error:", e);
        await new Promise((r) => setTimeout(r, 300));
      }
    }
  }

  stopLoop() {
    this.isLooping = false;
    if (this.silenceTimer) clearTimeout(this.silenceTimer);
    try { this.videoRef.pause(); } catch {}
    console.log("🛑 NovaIdleManager — boucle stoppée");
  }

  /* ======================================================
     🧠 Parole utilisateur / contexte
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
     🔇 Gestion du silence
  ====================================================== */
  resetSilenceTimer() {
    if (this.silenceTimer) clearTimeout(this.silenceTimer);
    this.silenceTimer = setTimeout(() => this.handleSilence(), 5000);
  }

  async handleSilence() {
    console.log("🔇 5s de silence détectées");

    // 1) Silence de réflexion (avant 1re parole) → patience
    if (!this.hasSpoken) {
      console.log("🤔 Silence initial — patience");
      this.resetSilenceTimer();
      return;
    }

    // 2) Silence après réponse
    this.stopLoop();

    // Deuxième silence consécutif → question suivante
    if (this.relanceCount >= 1) {
      console.log("⏭️ Double silence → question suivante");
      this.relanceCount = 0;
      await this.onNextQuestion?.();
      return;
    }

    this.relanceCount++;
    await this.playClarifySequence();
  }

  /* ======================================================
     🗣 Séquence Clarify (relance GPT + ElevenLabs)
  ====================================================== */
  private async playClarifySequence() {
    try {
      console.log("🎞 Clarify sequence");

      // 1. Clip court
      const clar1 = await getSystemVideo("clarify_end_alt", this.lang);
      this.videoRef.src = clar1;
      await this.videoRef.play().catch(() => {});
      await new Promise<void>((r) => (this.videoRef.onended = () => r()));

      // 2. Texte GPT (ou défaut)
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
        followText = gptData.followup_text || "Do you want me to repeat the question?";
      }

      // 3. Voix ElevenLabs
      try {
        const tts = await fetch("/api/nova-speak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: followText, lang: this.lang }),
        });
        if (tts.ok) {
          const blob = await tts.blob();
          const audioUrl = URL.createObjectURL(blob);
          const audio = new Audio(audioUrl);
          audio.volume = 1.0;
          audio.playbackRate = 1.0;
          await audio.play().catch(() => {});
        }
        console.log("💬 Relance Nova:", followText);
      } catch (err) {
        console.warn("⚠️ Erreur ElevenLabs:", err);
      }

      // 4. Clip principal
      const clar2 = await getSystemVideo("clarify_end", this.lang);
      this.videoRef.src = clar2;
      await this.videoRef.play().catch(() => {});
      await new Promise<void>((r) => (this.videoRef.onended = () => r()));

      // 5. Retour idle
      console.log("🔁 Retour idle listen après clarify");
      this.startLoop();
      this.resetSilenceTimer();
    } catch (e) {
      console.error("❌ Clarify sequence error:", e);
      await this.onNextQuestion?.();
    }
  }

  /* ======================================================
     🔚 Passage manuel à la question suivante
  ====================================================== */
  async forceNextQuestion() {
    this.stopLoop();
    await this.onNextQuestion?.();
  }
}