// app/api/veo-callback/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import fs from "fs";
import path from "path";

type KieCallbackPayload = {
  code?: number;
  msg?: string;
  data?: any;
};

function extractVideoUrls(data: any): string[] {
  if (!data) return [];

  if (Array.isArray(data.resultUrls)) return data.resultUrls;
  if (Array.isArray(data.videoUrls)) return data.videoUrls;
  if (typeof data.videoUrl === "string") return [data.videoUrl];

  if (Array.isArray(data.outputs)) {
    return data.outputs
      .filter((o: any) => typeof o.url === "string")
      .map((o: any) => o.url);
  }

  return [];
}

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
    });

    if (!taskId) {
      return NextResponse.json({ error: "Missing taskId" }, { status: 400 });
    }

    const supabase = supabaseAdmin;

    // 1) Log dans nova_veo_tasks
    const { error: logError } = await supabase.from("nova_veo_tasks").upsert(
      {
        task_id: taskId,
        question_id: questionId,
        video_url: videoUrl,
        status: videoUrl ? "done" : "pending",
        raw_payload: payload,
      },
      { onConflict: "task_id" }
    );

    if (logError) {
      console.error("❌ Erreur Supabase nova_veo_tasks:", logError);
    }

    // 2) Si on a questionId + videoUrl → mise à jour nova_questions
    if (questionId && videoUrl) {
      const { error: qError } = await supabase
        .from("nova_questions")
        .update({
          video_url_en: videoUrl,
          status_video_en: "ready",
          last_used_at: new Date().toISOString(),
        })
        .eq("question_id", questionId);

      if (qError) {
        console.error("❌ Erreur mise à jour nova_questions:", qError);
      } else {
        console.log(`✅ Question ${questionId} mise à jour.`);
      }
    }

    // --------------------------------------------------------------------
    // --- NOUVEAU : write callback JSON to /tmp for Python script ----
    // --------------------------------------------------------------------
    try {
      const callbackDir = "/tmp/nova_veo_callbacks";

      if (!fs.existsSync(callbackDir)) fs.mkdirSync(callbackDir, { recursive: true });

      const filePath = path.join(callbackDir, `${taskId}.json`);
      fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf-8");

      console.log("📝 Callback JSON écrit dans", filePath);
    } catch (err) {
      console.error("❌ Impossible d’écrire le callback local :", err);
    }
    // --------------------------------------------------------------------

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("❌ Erreur /api/veo-callback:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
