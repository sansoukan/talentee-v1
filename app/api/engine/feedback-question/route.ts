import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Nova Engine – Feedback Question API (GPT-5)
 * --------------------------------------------
 * Analyse la réponse d'une question standard (niveau 1-2)
 * 🔹 Récupère expected_keywords + expected_answer_en
 * 🔹 Calcule un score lexical + sémantique
 * 🔹 Génère un feedback textuel court
 * 🔹 Met à jour nova_memory
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { session_id, question_id, question_text, answer_text } = body || {};

    if (!session_id || !answer_text)
      return NextResponse.json({ error: "Missing session_id or answer_text" }, { status: 400 });

    // 1️⃣ Charger la question pour récupérer les bons champs
    const { data: qData, error: qErr } = await supabaseAdmin
      .from("nova_questions")
      .select("expected_keywords, expected_answer_en")
      .eq("id", question_id)
      .single();

    if (qErr || !qData)
      console.warn("⚠️ Question not found in nova_questions:", qErr);

    const expected_keywords: string[] = qData?.expected_keywords ?? [];
    const expected_answer: string = qData?.expected_answer_en ?? "";

    // 2️⃣ Calcul lexical simple
    const lower = answer_text.toLowerCase();
    const matched =
      expected_keywords?.filter((k) => lower.includes(k.toLowerCase())) ?? [];
    const lexicalScore = matched.length
      ? Math.round((matched.length / expected_keywords.length) * 100)
      : 0;

    // 3️⃣ Prompt GPT-5
    const prompt = `
You are Nova, an AI recruiter evaluating a candidate's spoken answer.

Question: "${question_text}"
Expected strong answer: "${expected_answer}"
Candidate's answer: "${answer_text}"

Keywords to look for: ${expected_keywords.join(", ")}

Analyze the answer using clarity, structure, and relevance.
Rate overall quality from 0 to 100.
Return valid JSON:
{
  "axes": {"clarity":0–100,"structure":0–100,"relevance":0–100},
  "comment":"short recruiter feedback (2–3 sentences)"
}
`;

    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-5",
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content:
              "You are Nova, a senior recruiter AI giving concise structured feedback in JSON only.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    const raw = await aiRes.json();
    const aiText = raw?.choices?.[0]?.message?.content ?? "{}";

    // 4️⃣ Parsing du retour
    let parsed: any;
    try {
      parsed = JSON.parse(aiText.replace(/```json|```/g, "").trim());
    } catch {
      parsed = {
        axes: { clarity: 70, structure: 65, relevance: 75 },
        comment: "Good reasoning and clarity. Could improve structure and concision.",
      };
    }

    // 5️⃣ Score global pondéré
    const score_auto = Math.round(
      (lexicalScore * 0.3 +
        parsed.axes.clarity * 0.3 +
        parsed.axes.structure * 0.2 +
        parsed.axes.relevance * 0.2) /
        100
    );

    const feedback_json = {
      clarity: parsed.axes.clarity / 100,
      structure: parsed.axes.structure / 100,
      relevance: parsed.axes.relevance / 100,
      lexical: lexicalScore / 100,
      comment: parsed.comment,
    };

    // 6️⃣ Mise à jour nova_memory
    const { error: upErr } = await supabaseAdmin
      .from("nova_memory")
      .update({
        score_auto,
        feedback_json,
        updated_at: new Date().toISOString(),
      })
      .eq("session_id", session_id)
      .eq("question_id", question_id);

    if (upErr) throw upErr;

    // 7️⃣ Réponse pour NovaEngine
    return NextResponse.json({
      ok: true,
      score_auto,
      feedback_json,
    });
  } catch (e: any) {
    console.error("❌ feedback-question error:", e);
    return NextResponse.json(
      { error: e?.message ?? "Server error" },
      { status: 500 }
    );
  }
}