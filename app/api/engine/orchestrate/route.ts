import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/* ----------------------------------------------------------
 * Helpers
 * ---------------------------------------------------------- */
function normalizeUrl(u: any): string | null {
  if (!u) return null;
  if (typeof u === "string") return u;
  if (typeof u === "object" && "url" in u) return u.url;
  return null;
}

function normalizeQuestion(q: any): any {
  if (!q) return q;
  const clone = { ...q };
  for (const k of Object.keys(clone)) {
    if (typeof clone[k] === "object" && clone[k]?.url) {
      clone[k] = clone[k].url;
    }
  }
  return clone;
}

/* ----------------------------------------------------------
 * CAREER PYRAMIDS
 * ---------------------------------------------------------- */
const PYRAMID_ELITE = {
  exec: ["exec", "manager", "professional", "graduate", "student"],
  manager: ["manager", "professional", "graduate", "student"],
  professional: ["professional", "graduate", "student"],
  graduate: ["graduate", "student"],
  student: ["student"]
};

const PYRAMID_OP = {
  op_supervisor: ["op_supervisor", "op_experienced", "op_junior", "op_entry"],
  op_experienced: ["op_experienced", "op_junior", "op_entry"],
  op_junior: ["op_junior", "op_entry"],
  op_entry: ["op_entry"]
};

/* ----------------------------------------------------------
 * DIFFICULTY FALLBACK
 * ---------------------------------------------------------- */
const DIFF_CASCADE = {
  1: [1, 2, 3],
  2: [2, 1, 3],
  3: [3, 2, 1]
};

/* ----------------------------------------------------------
 * DOMAIN FALLBACK
 * ---------------------------------------------------------- */
const DOMAIN_FALLBACK = {
  marketing: ["general"],
  sales: ["general"],
  finance: ["general"],
  consulting: ["general"],
  tech: ["general"],
  hr: ["general"],
  legal: ["general"],
  product: ["general"],
  ops: ["general"],
  supply_chain: ["general"],
  production: ["general"],
  accounting: ["general"],
  banking: ["general"],
  general: ["general"]
};

/* ----------------------------------------------------------
 * fetchQuestions V31
 * ---------------------------------------------------------- */
async function fetchQuestions({
  domain,
  subDomain,
  difficulties,
  careerTargets,
  segment,
  usedIds,
  limit
}: any) {
  const safeUsed = usedIds.length
    ? usedIds.map((x) => `'${x}'`).join(",")
    : "'0'";

  let q = supabaseAdmin
    .from("nova_questions")
    .select(
      `
        id, question_id, domain, sub_domain, difficulty,
        career_target, probability,
        question_en, question_fr,
        video_url_en, video_url_fr,
        video_feedback_high, video_feedback_mid, video_feedback_low
      `
    )
    .eq("is_active", true)
    .not("question_id", "in", `(${safeUsed})`);

  q = q.eq("domain", domain);

  if (subDomain) {
    q = q.eq("sub_domain", subDomain);
  }

  if (difficulties && difficulties.length) {
    q = q.in("difficulty", difficulties);
  }

  if (careerTargets && careerTargets.length) {
    q = q.contains("career_target", careerTargets);
  }

  const { data, error } = await q
    .order("probability", { ascending: false })
    .limit(limit);

  if (error) {
    console.warn("⚠️ fetchQuestions error:", error.message);
    return [];
  }

  return (data ?? []).map(normalizeQuestion);
}

/* ----------------------------------------------------------
 * MAIN ORCHESTRATOR V31
 * ---------------------------------------------------------- */
export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();
    const body = JSON.parse(raw || "{}");
    const { session_id } = body;

    if (!session_id) {
      return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
    }

    /* 1) Load session + profile */
    const { data: session } = await supabaseAdmin
      .from("nova_sessions")
      .select(
        "*, detail, profiles!inner(id, segment, career_stage, domain, sub_domain)"
      )
      .eq("id", session_id)
      .single();

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const profile = session.profiles;
    const segment = profile.segment; // "elite" | "operational"
    const domain = profile.domain || "general";
    const subDomain = profile.sub_domain;
    const careerStage = profile.career_stage;

    /* Determine pyramid */
    const isOperational = segment === "operational";

    const primaryCareerTarget = isOperational
      ? careerStage || "op_entry"
      : careerStage || "student";

    const pyramid = isOperational
      ? PYRAMID_OP[primaryCareerTarget] || ["op_entry"]
      : PYRAMID_ELITE[primaryCareerTarget] || ["student"];

    /* 2) Load memory */
    const { data: mem } = await supabaseAdmin
      .from("nova_memory")
      .select("question_id")
      .eq("session_id", session_id);

    const askedIds = mem?.map((m: any) => m.question_id) || [];

    /* INIT_Q1 forced */
    if (!askedIds.length && !session.detail?.init_q1_sent) {
      const { data: q1 } = await supabaseAdmin
        .from("nova_questions")
        .select("*")
        .eq("question_id", "q_0001")
        .eq("is_active", true)
        .maybeSingle();

      await supabaseAdmin
        .from("nova_sessions")
        .update({
          detail: { ...(session.detail || {}), init_q1_sent: true }
        })
        .eq("id", session_id);

      return NextResponse.json({
        action: "INIT_Q1",
        session_id,
        question: normalizeQuestion(q1)
      });
    }

    /* ----------------------------------------------------------
     * BUILD FINAL QUESTION LIST
     * ---------------------------------------------------------- */

    const finalQuestions: any[] = [];
    let used = [...askedIds];

    /* -------- BLOCK 1: GENERAL -------- */
    for (const lvl of [1, 2, 3]) {
      const set = await fetchQuestions({
        domain: "general",
        subDomain: null,
        difficulties: DIFF_CASCADE[lvl],
        careerTargets: pyramid,
        segment,
        usedIds: used,
        limit: 4
      });

      finalQuestions.push(...set);
      used.push(...set.map((q) => q.question_id));
    }

    /* -------- BLOCK 2: DOMAIN-SPECIFIC -------- */
    const DIFF_PLAN = [
      { lvl: 1, count: 7 },
      { lvl: 2, count: 5 },
      { lvl: 3, count: 5 }
    ];

    for (const block of DIFF_PLAN) {
      let left = block.count;

      /* Try domain first */
      let primary = await fetchQuestions({
        domain,
        subDomain,
        difficulties: DIFF_CASCADE[block.lvl],
        careerTargets: pyramid,
        segment,
        usedIds: used,
        limit: left
      });

      finalQuestions.push(...primary);
      used.push(...primary.map((q) => q.question_id));
      left -= primary.length;

      /* Domain fallback */
      if (left > 0) {
        for (const fbDomain of DOMAIN_FALLBACK[domain] || ["general"]) {
          if (left <= 0) break;

          const extra = await fetchQuestions({
            domain: fbDomain,
            subDomain: null,
            difficulties: DIFF_CASCADE[block.lvl],
            careerTargets: pyramid,
            segment,
            usedIds: used,
            limit: left
          });

          finalQuestions.push(...extra);
          used.push(...extra.map((q) => q.question_id));
          left -= extra.length;
        }
      }
    }

    /* Update last_used_at */
    if (finalQuestions.length) {
      await supabaseAdmin
        .from("nova_questions")
        .update({ last_used_at: new Date().toISOString() })
        .in(
          "id",
          finalQuestions.map((q) => q.id)
        );
    }

    /* Save sequence */
    await supabaseAdmin
      .from("nova_sessions")
      .update({
        questions: finalQuestions,
        total_questions: finalQuestions.length,
        duration_target: 20 * 60
      })
      .eq("id", session_id);

    return NextResponse.json({
      action: "INIT_SEQUENCE",
      session_id,
      total_questions: finalQuestions.length,
      questions: finalQuestions
    });
  } catch (err: any) {
    console.error("❌ Orchestrator V31 ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
