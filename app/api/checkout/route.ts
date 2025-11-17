import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const stripeKey = process.env.STRIPE_SECRET_KEY;
const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { app_session_id, user_id, option } = body || {};

    if (!user_id || !option) {
      return NextResponse.json(
        { error: "Missing user_id or option" },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    // 🔹 Récupération du profil
    const { data: profile } = await supabase
      .from("profiles")
      .select("career_stage")
      .eq("id", user_id)
      .single();

    const stage = profile?.career_stage || "unknown";

    // 🔹 Bypass si étudiant ou clé Stripe absente
    if (!stripeKey || stage === "student") {
      await supabase.from("nova_purchases").insert({
        user_id,
        option: option,
        amount: 0,
        currency: "EUR",
        status: "completed",
        payment_provider: stripeKey ? "stripe" : "mock",
        provider_session_id: `free_${Date.now()}`,
      });

      return NextResponse.json({
        url: `${site}/session/success?type=${option}`,
        bypass: true,
      });
    }

    // --- Stripe checkout normal ---
    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

    const prices: Record<string, string | undefined> = {
      internship: process.env.STRIPE_PRICE_INTERNSHIP,
      job_interview: process.env.STRIPE_PRICE_JOB,
      case_study: process.env.STRIPE_PRICE_CASE,
      promotion: process.env.STRIPE_PRICE_PROMOTION,
      annual_review: process.env.STRIPE_PRICE_REVIEW,
      goal_setting: process.env.STRIPE_PRICE_GOAL,
      mobility: process.env.STRIPE_PRICE_MOBILITY,
      practice: process.env.STRIPE_PRICE_PRACTICE,
      strategic_case: process.env.STRIPE_PRICE_STRATEGIC,
    };

    const priceId = prices[option];
    if (!priceId) {
      return NextResponse.json(
        { error: `No Stripe price found for option '${option}'` },
        { status: 400 }
      );
    }

    const successUrl = `${site}/session/success?type=${option}`;
    const cancelUrl = `${site}/session/canceled?type=${option}`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { app_session_id, user_id, option },
    });

    // Enregistre un achat pending
    await supabase.from("nova_purchases").insert({
      user_id,
      option,
      amount: 0,
      currency: "EUR",
      status: "pending",
      payment_provider: "stripe",
      provider_session_id: session.id,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe Checkout error:", err);
    return NextResponse.json(
      { error: err?.message || "server_error" },
      { status: 500 }
    );
  }
}
