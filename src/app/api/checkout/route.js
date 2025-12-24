import Stripe from "stripe";
import { connectDB } from "../../../lib/db";
import Purchase from "../../../lib/models/Purchase";
import { computeFinalPrice } from "../../../lib/calculatePrices";
import { createCheckoutSession } from "../../../lib/createCheckoutSession";

const allowedOrigin = process.env.NEXT_PUBLIC_FRONTEND_URL;

/* ------------------------------------------
   CORS
------------------------------------------- */
function corsHeaders(req) {
  const origin = req.headers.get("origin");
  if (!origin) return {};

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

/* ------------------------------------------
   OPTIONS
------------------------------------------- */
export async function OPTIONS(req) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(req),
  });
}

/* ------------------------------------------
   POST
------------------------------------------- */
export async function POST(req) {
  try {
    const body = await req.json();
    const { userId, videoId, site } = body;

    if (!videoId || !site) {
      return new Response("Missing fields", {
        status: 400,
        headers: corsHeaders(req),
      });
    }

    await connectDB();

    // ------------------------------------------
    // 1️⃣ Prevent duplicate paid purchases
    // ------------------------------------------
    if (userId) {
      const existing = await Purchase.findOne({
        userId,
        videoId,
        status: "paid",
      });

      if (existing) {
        return new Response(
          JSON.stringify({ error: "Already purchased", purchased: true }),
          {
            status: 409,
            headers: corsHeaders(req),
          }
        );
      }
    }

    // ------------------------------------------
    // 2️⃣ Fetch video (Stripe NEVER sees this)
    // ------------------------------------------
    const videoRes = await fetch(`${allowedOrigin}/api/videos/${videoId}`);
    const video = await videoRes.json();

    if (!video || typeof video.finalPrice !== "number") {
      throw new Error("Invalid video pricing");
    }

    const pricing = {
      basePrice: video.basePrice,
      finalPrice: video.finalPrice,
      discountId: video.discount?.id ?? null,
      discountLabel: video.discount?.name ?? null,
    };
    // Stripe expects cents
    const finalAmount = Math.round(pricing.finalPrice * 100);

    // ------------------------------------------
    // 4️⃣ Create pending purchase (DB is source of truth)
    //     🔁 UPDATED: store pricing breakdown
    // ------------------------------------------
    const pendingPurchase = await Purchase.create({
      userId: userId || null,
      videoId,
      videoTitle: video.title,
      creatorName: video.creatorName,
      creatorTelegramId: video.creatorTelegramId,
      creatorUrl: video.socialMediaUrl,

      basePrice: pricing.basePrice, // 🔁 NEW
      finalPrice: pricing.finalPrice, // 🔁 NEW
      discountId: pricing.discountId || null, // 🔁 NEW
      discountLabel: pricing.discountLabel || null, // 🔁 NEW

      amount: pricing.finalPrice, // payout uses FINAL price only
      status: "pending",
      site,
    });

    // ------------------------------------------
    // 5️⃣ Stripe metadata — MINIMAL & SAFE
    //     🔒 ONLY purchaseId (+ site if you want)
    // ------------------------------------------
    const session = await createCheckoutSession({
      finalAmount,
      successUrl: `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/post-checkout?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_API_BASE_URL}/cancel`,
      metadata: {
        purchaseId: pendingPurchase._id.toString(), // ✅ ONLY THIS
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: corsHeaders(req),
    });
  } catch (err) {
    console.error("❌ Checkout error:", err);
    return new Response("Checkout Error", {
      status: 500,
      headers: corsHeaders(req),
    });
  }
}
