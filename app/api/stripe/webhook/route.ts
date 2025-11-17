import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// ======================================================
// 🔐 Configuration d’environnement
// ======================================================
const stripeKey = process.env.STRIPE_SECRET_KEY!;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ======================================================
// 🚦 Webhook Stripe principal — Nova RH
// ======================================================
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

  console.log("===============================================");
  console.log("🚀 [WEBHOOK] Requête Stripe reçue à", new Date().toISOString());

  // ✅ lecture du corps brut
  const rawBody = Buffer.from(await req.arrayBuffer());
  const signature = req.headers.get("stripe-signature");

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature!, stripeWebhookSecret);
  } catch (err: any) {
    console.error("❌ [WEBHOOK] Signature Stripe invalide :", err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  console.log(`📦 [WEBHOOK] Type d’événement : ${event.type}`);

  try {
    // ======================================================
    // ✅ 1️⃣ Paiement confirmé
    // ======================================================
    if (event.type === "checkout.session.completed") {
      console.log("🧩 [WEBHOOK] Traitement de checkout.session.completed ...");

      const payload: any = event.data?.object || event;
      const session = payload as Stripe.Checkout.Session;

      const metadata = session.metadata ?? {};
      const providerSessionId = session.id;
      const novaSessionId = metadata?.nova_session_id ?? null;
      const userId = metadata?.user_id ?? null;
      const option = metadata?.option ?? null;
      const amount = (session.amount_total ?? 0) / 100;
      const currency = session.currency ?? "USD";
      const priceId = (session as any)?.line_items?.[0]?.price?.id ?? "unknown";
      const receiptUrl =
        (session.invoice as any)?.hosted_invoice_url ||
        (session.payment_intent as any)?.charges?.data?.[0]?.receipt_url ||
        null;

      console.log("💰 [WEBHOOK] Détails du paiement reçu :", {
        providerSessionId,
        novaSessionId,
        userId,
        option,
        amount,
        currency,
        priceId,
      });

      if (!novaSessionId || !userId) {
        console.warn("⚠️ [WEBHOOK] Metadata incomplètes → Ignoré");
        return NextResponse.json({ ignored: true }, { status: 200 });
      }

      // ======================================================
      // ✅ 2️⃣ Mise à jour / insertion de l’achat (nova_purchases)
      // ======================================================
      console.log("🧾 [WEBHOOK] Mise à jour table nova_purchases ...");

      const { error: purchaseError } = await supabaseAdmin
        .from("nova_purchases")
        .upsert(
          {
            user_id: userId,
            session_id: novaSessionId,
            option,
            amount,
            currency,
            price_id: priceId,
            status: "paid", // ✅ conforme au CHECK Supabase
            payment_provider: "stripe",
            provider_session_id: providerSessionId,
            receipt_url: receiptUrl,
            paid_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "session_id" }
        );

      if (purchaseError)
        console.error("❌ [WEBHOOK] Erreur upsert nova_purchases :", purchaseError.message);
      else console.log("✅ [WEBHOOK] Purchase marqué 'paid' pour :", novaSessionId);

      // ======================================================
      // ✅ 3️⃣ Mise à jour de la session Nova (nova_sessions)
      // ======================================================
      console.log("🧠 [WEBHOOK] Mise à jour table nova_sessions ...");

      const { error: updateError } = await supabaseAdmin
        .from("nova_sessions")
        .update({
          status: "started",
          is_premium: true,
          paid_at: new Date().toISOString(),
          payment_provider: "stripe",
          payment_session_id: providerSessionId,
          payment_status: "paid",
        })
        .eq("id", novaSessionId);

      if (updateError)
        console.error("⚠️ [WEBHOOK] Erreur mise à jour nova_sessions :", updateError.message);
      else console.log(`🎯 [WEBHOOK] Session ${novaSessionId} → status = started ✅`);

      console.log(`💳 [WEBHOOK] Paiement finalisé pour user ${userId}, option ${option}`);
    }

    // ======================================================
    // 🕒 4️⃣ Paiement expiré / annulé
    // ======================================================
    else if (event.type === "checkout.session.expired") {
      console.warn("⚠️ [WEBHOOK] Session de paiement expirée.");

      const session = event.data.object as Stripe.Checkout.Session;
      const { error: expiredErr } = await supabaseAdmin
        .from("nova_purchases")
        .update({
          status: "canceled", // ✅ valeur autorisée
          updated_at: new Date().toISOString(),
        })
        .eq("provider_session_id", session.id);

      if (expiredErr)
        console.error("❌ [WEBHOOK] Erreur update 'canceled' :", expiredErr.message);
      else console.log("🕒 [WEBHOOK] Purchase marqué 'canceled' :", session.id);
    }

    // ======================================================
    // 💥 5️⃣ Paiement échoué
    // ======================================================
    else if (event.type === "payment_intent.payment_failed") {
      const intent = event.data.object as Stripe.PaymentIntent;
      const userId = intent.metadata?.user_id ?? null;
      const sessionId = intent.metadata?.nova_session_id ?? null;

      if (userId && sessionId) {
        console.warn("⚠️ [WEBHOOK] Paiement échoué → status failed", { userId, sessionId });
        await supabaseAdmin
          .from("nova_purchases")
          .update({
            status: "failed",
            updated_at: new Date().toISOString(),
          })
          .eq("session_id", sessionId);
      }
    }

    // ======================================================
    // 🔕 6️⃣ Autres événements (non gérés)
    // ======================================================
    else {
      console.log(`ℹ️ [WEBHOOK] Événement non géré : ${event.type}`);
    }

    console.log("✅ [WEBHOOK] Stripe traité avec succès 🚀");
    console.log("===============================================");
    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("💥 [WEBHOOK] Erreur interne :", err.message);
    console.log("===============================================");
    return new NextResponse(`Server Error: ${err.message}`, { status: 500 });
  }
}
