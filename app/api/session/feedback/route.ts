import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { SESSION_FEEDBACK_PROMPT } from "@/lib/prompts/prompt_feedback_session";

// ENV VARS
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY!;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "nova_voice_en";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { session_id, lang = "en" } = body || {};

    if (!session_id) {
      return NextResponse.json(
        { ok: false, error: "Missing session_id" },
        { status: 400 }
      );
    }

    /* -----------------------------------------
     * 1️⃣ Fetch SESSION (ENRICHED)
     * ----------------------------------------- */
    const { data: session, error: sessionError } = await supabaseAdmin
      .from("nova_sessions")
      .select(`
        id,
        user_id,
        domain,
        sub_domain,
        score_global,
        axes_improvement,
        summary_json,
        match_score,
        type_entretien,
        career_target,
        segment,
        total_questions,
        duration,
        duration_target,
        is_premium,
        speaking_time_total,
        silence_time_total,
        emotion_summary,
        posture_summary,
        transcript_full,
        session_replay_manifest
      `)
      .eq("id", session_id)
      .maybeSingle();

    if (sessionError || !session) throw new Error("Session not found");

    /* -----------------------------------------
     * 2️⃣ Fetch PROFILE
     * ----------------------------------------- */
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("prenom, career_stage")
      .eq("id", session.user_id)
      .maybeSingle();

    /* -----------------------------------------
     * 3️⃣ Fetch MEMORY (ENRICHED)
     * ----------------------------------------- */
    const { data: memory } = await supabaseAdmin
      .from("nova_memory")
      .select(`
        question_id,
        reponse,
        theme,
        score,
        clarity_summary,
        ai_feedback,
        ai_score,
        ai_scores_detail,
        improvement_score,
        tag,
        lang,
        latency_before_answer,
        speaking_speed_wpm,
        hesitations_count,
        stress_score,
        confidence_score,
        eye_contact_score,
        posture_score,
        transcript_clean,
        tags_detected,
        ideal_answer_distance,
        created_at
      `)
      .eq("session_id", session_id);

    const sessionAnswers = memory?.map(m => m.reponse) || [];
    const sessionThemes = memory?.map(m => m.theme).filter(Boolean) || [];

    /* -----------------------------------------
     * 4️⃣ Optional: CV analysis
     * ----------------------------------------- */
    const { data: cvData } = await supabaseAdmin
      .from("nova_analysis")
      .select("result_text")
      .eq("user_id", session.user_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const cv_summary = cvData?.result_text || "";

    /* -----------------------------------------
     * 5️⃣ Build GPT Payload (SUPER ENRICHED)
     * ----------------------------------------- */
    const gptPayload = {
      model: "gpt-5-chat-latest",
      messages: [
        {
          role: "system",
          content: SESSION_FEEDBACK_PROMPT
        },
        {
          role: "user",
          content: JSON.stringify({
            user_firstname: profile?.prenom || "there",
            career_stage: profile?.career_stage,
            domain: session.domain,
            sub_domain: session.sub_domain,
            cv_summary: cv_summary,
            session_answers: sessionAnswers,
            session_themes: sessionThemes,
            session_score: session.score_global,
            session_axes: session.axes_improvement,

            // enriched session signals
            match_score: session.match_score,
            type_entretien: session.type_entretien,
            career_target: session.career_target,
            segment: session.segment,
            total_questions: session.total_questions,
            duration: session.duration,
            duration_target: session.duration_target,
            is_premium: session.is_premium,

            // behavioral / emotional signals
            speaking_time_total: session.speaking_time_total,
            silence_time_total: session.silence_time_total,
            emotion_summary: session.emotion_summary,
            posture_summary: session.posture_summary,
            transcript_full: session.transcript_full,

            // full question-by-question analytics
            memory_detailed: memory,

            language: lang
          })
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    };

    /* -----------------------------------------
     * 6️⃣ Call GPT
     * ----------------------------------------- */
    const gptRes = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(gptPayload)
    });

    const gptJson = await gptRes.json();
    if (!gptJson.choices?.length) throw new Error("GPT returned no result");

    const feedback = JSON.parse(gptJson.choices[0].message.content.trim());

    const audioScript = feedback.audio_script;

    /* -----------------------------------------
     * 7️⃣ ElevenLabs audio
     * ----------------------------------------- */
    const audioRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: audioScript,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8,
            style: 0.5
          }
        })
      }
    );

    const audioBuffer = Buffer.from(await audioRes.arrayBuffer());
    const audioBase64 = audioBuffer.toString("base64");

    /* -----------------------------------------
     * 8️⃣ Save FINAL FEEDBACK (SUPER EXTENDED)
     * ----------------------------------------- */
    await supabaseAdmin
      .from("nova_sessions")
      .update({
        final_feedback_text: feedback.final_text,
        final_feedback_audio: audioBase64,
        final_feedback_summary: feedback.summary,
        final_feedback_axes: feedback.axes,

        // if GPT provides deep-scoring (optional but future-proof)
        clarity_overall: feedback.clarity_overall || null,
        structure_overall: feedback.structure_overall || null,
        communication_overall: feedback.communication_overall || null,
        confidence_overall: feedback.confidence_overall || null,

        // optional future fields (ignored if not provided)
        behavior_summary: feedback.behavior_summary || null,
        detailed_report: feedback.detailed_report || null,
        transcript_full: feedback.transcript_full || session.transcript_full || null
      })
      .eq("id", session_id);

    /* -----------------------------------------
     * 9️⃣ Response to NovaEngine
     * ----------------------------------------- */
    return NextResponse.json({
      ok: true,
      final_text: feedback.final_text,
      summary: feedback.summary,
      axes: feedback.axes,
      audio_base64: audioBase64,
      audio_script: audioScript
    });

  } catch (err: any) {
    console.error("SESSION FEEDBACK ERROR:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Feedback generation failed" },
      { status: 500 }
    );
  }
}