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
   STRIPE METADATA NORMALIZER (CRITICAL)
------------------------------------------- */
function normalizeMetadata(meta = {}, purchaseId) {
  return {
    purchaseId: String(meta.purchaseId || purchaseId),
    videoId: String(meta.videoId || "unknown_video"),
    userId: String(meta.userId || `anon_${purchaseId}`),
    site: String(meta.site || "unknown"),
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

    // Prevent duplicate purchases (only if userId exists)
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

    // Fetch video info (Stripe never sees this)
    const videoRes = await fetch(`${allowedOrigin}/api/videos?id=${videoId}`);
    if (!videoRes.ok) {
      return new Response("Video not found", {
        status: 404,
        headers: corsHeaders(req),
      });
    }

    const video = await videoRes.json();
    if (!video || typeof video.price !== "number") {
      return new Response("Invalid video pricing", {
        status: 400,
        headers: corsHeaders(req),
      });
    }

    // Compute final price server-side
    const finalAmount = computeFinalPrice(video);

    // Find or create pending purchase
    let pendingPurchase = await Purchase.findOne({
      userId: userId || null,
      videoId,
      status: "pending",
    });

    if (!pendingPurchase) {
      pendingPurchase = await Purchase.create({
        userId: userId || null,
        videoId,
        videoTitle: video.title,
        creatorName: video.creatorName,
        creatorTelegramId: video.creatorTelegramId,
        creatorUrl: video.socialMediaUrl,
        amount: finalAmount / 100,
        status: "pending",
        site,
      });
    }

    // 🔐 SAFE STRIPE METADATA (NO NULLS EVER)
    const metadata = normalizeMetadata(
      {
        purchaseId: pendingPurchase._id.toString(),
        userId,
        videoId,
        site,
      },
      pendingPurchase._id.toString()
    );

    // Create Stripe Checkout session
    const session = await createCheckoutSession({
      finalAmount,
      successUrl: `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/post-checkout?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_API_BASE_URL}/cancel`,
      metadata,
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
