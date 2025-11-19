// src/app/api/veo-callback/route.ts

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Types du callback Kie.ai (flexibles)
 */
type KieCallbackPayload = {
  code?: number;
  msg?: string;
  data?: any;
};

/**
 * Extraction robuste des URLs vidéo (multi-formats possibles).
 */
function extractVideoUrls(data: any): string[] {
  if (!data) return [];

  // 1) Nouveau format probable : resultUrls
  if (Array.isArray(data.resultUrls)) {
    return data.resultUrls.filter((u: any) => typeof u === "string");
  }

  // 2) videoUrls
  if (Array.isArray(data.videoUrls)) {
    return data.videoUrls.filter((u: any) => typeof u === "string");
  }

  // 3) videoUrl unique
  if (typeof data.videoUrl === "string") {
    return [data.videoUrl];
  }

  // 4) outputs[].url
  if (Array.isArray(data.outputs)) {
    return data.outputs
      .map((o: any) => o?.url)
      .filter((u: any) => typeof u === "string");
  }

  return [];
}

/**
 * On récupère [QID:xxx] depuis paramJson.prompt
 * paramJson est une string JSON qui contient "prompt", "imageUrls", etc.
 */
function extractQuestionIdFromParamJson(data: any): string | null {
  const raw = data?.paramJson;
  if (!raw || typeof raw !== "string") return null;

  try {
    const parsed = JSON.parse(raw);
    const prompt: string = parsed.prompt || "";
    const match = prompt.match(/\[QID:([^\]]+)\]/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as KieCallbackPayload;
    const data = payload.data ?? {};

    const taskId: string | undefined = data.taskId || data.id;
    const videoUrls = extractVideoUrls(data);
    const videoUrl = videoUrls[0] || null;
    const questionId = extractQuestionIdFromParamJson(data);

    console.log("🎬 Kie callback reçu", {
      taskId,
      questionId,
      videoUrl,
      hasParamJson: !!data.paramJson,
    });

    if (!taskId) {
      console.error("❌ Callback Kie sans taskId");
      return NextResponse.json({ error: "Missing taskId" }, { status: 400 });
    }

    const supabase = supabaseAdmin;

    // 1) On logue systématiquement dans nova_veo_tasks
    const { error: upsertTaskError } = await supabase
      .from("nova_veo_tasks")
      .upsert(
        {
          task_id: taskId,
          question_id: questionId,
          video_url: videoUrl,
          status: videoUrl ? "done" : "pending",
          raw_payload: payload as any,
        },
        { onConflict: "task_id" }
      );

    if (upsertTaskError) {
      console.error("❌ Erreur Supabase nova_veo_tasks:", upsertTaskError);
    }

    // 2) Si on a à la fois questionId + videoUrl, on met à jour la question
    if (questionId && videoUrl) {
      const { error: updateQuestionError } = await supabase
        .from("nova_questions")
        .update({
          video_url_en: videoUrl,
          status_video_en: "ready",
          last_used_at: new Date().toISOString(),
        })
        .eq("question_id", questionId);

      if (updateQuestionError) {
        console.error(
          "❌ Erreur Supabase mise à jour nova_questions:",
          updateQuestionError
        );
      } else {
        console.log(
          `✅ Question ${questionId} mise à jour avec la vidéo ${videoUrl}`
        );
      }
    } else {
      console.warn(
        "⚠️ Callback Kie sans questionId ou sans videoUrl — mise à jour nova_questions ignorée",
        { questionId, videoUrl }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("❌ Erreur handler /api/veo-callback:", err);
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}
