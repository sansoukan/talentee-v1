import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

/**
 * 🔍 fetchInterviewQuestions — V5 (Server Safe)
 * ---------------------------------------------
 * ✅ Compatible server (Next.js API routes)
 * ✅ Fallbacks multi-niveaux : sub_domain → domain → general
 * ✅ Filtre actif + segment + carrière
 */
export async function fetchInterviewQuestions({
  segment,
  career_stage,
  domain,
  sub_domain,
  option,
}: {
  segment: string;
  career_stage?: string | null;
  domain: string;
  sub_domain?: string | null;
  option: string;
}) {
  try {
    // ✅ Version serveur de Supabase
    const supabase = createRouteHandlerClient({ cookies });

    const normalizedStage =
      segment === "operational" ? "other" : normalizeStage(career_stage || "");
    const safeDomain = domain || "general";
    const safeSub = sub_domain || null;

    // --- Requête principale
    let query = supabase
      .from("nova_questions")
      .select("*")
      .eq("is_active", true)
      .contains("segment", [segment])
      .contains("career_target", [normalizedStage])
      .eq("type", option)
      .limit(30);

    if (safeSub) {
      query = query.or(`sub_domain.eq.${safeSub},sub_domain.is.null`);
    }

    const { data: primary, error: err1 } = await query.eq("domain", safeDomain);
    if (err1) throw err1;
    if (primary && primary.length > 0) return primary;

    // --- Fallback sans sub_domain
    const { data: noSub, error: err2 } = await supabase
      .from("nova_questions")
      .select("*")
      .eq("is_active", true)
      .contains("segment", [segment])
      .contains("career_target", [normalizedStage])
      .eq("domain", safeDomain)
      .eq("type", option)
      .limit(30);

    if (err2) throw err2;
    if (noSub && noSub.length > 0) return noSub;

    // --- Fallback domain = general
    const { data: general, error: err3 } = await supabase
      .from("nova_questions")
      .select("*")
      .eq("is_active", true)
      .contains("segment", [segment])
      .contains("career_target", [normalizedStage])
      .eq("domain", "general")
      .eq("type", option)
      .limit(30);

    if (err3) throw err3;
    if (general && general.length > 0) return general;

    // --- Fallback ultime
    const { data: any, error: err4 } = await supabase
      .from("nova_questions")
      .select("*")
      .eq("is_active", true)
      .contains("segment", [segment])
      .eq("type", option)
      .limit(20);

    if (err4) throw err4;
    return any || [];
  } catch (err) {
    console.error("❌ Error in fetchInterviewQuestions:", err);
    return [];
  }
}

/* ==========================
   Helpers
   ========================== */
function normalizeStage(stage: string) {
  if (!stage) return "graduate";
  const s = stage.toLowerCase();
  if (s === "mid") return "professional";
  if (s === "exec" || s === "executive") return "manager";
  if (["student", "graduate"].includes(s)) return "graduate";
  if (["manager", "leader"].includes(s)) return "manager";
  if (["professional", "employee"].includes(s)) return "professional";
  return s;
}