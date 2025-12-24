import { connectDB } from "../../../lib/db";
import Purchase from "../../../lib/models/Purchase";
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

    // -------------------------
    // 0️⃣ Validate input
    // -------------------------
    if (!userId || !videoId || !site) {
      return new Response("Missing fields", {
        status: 400,
        headers: corsHeaders(req),
      });
    }

    await connectDB();

    // -------------------------
    // 1️⃣ Prevent duplicate paid purchases
    // -------------------------
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

    // -------------------------
    // 2️⃣ Fetch SINGLE video (already priced)
    // -------------------------
    const videoRes = await fetch(`${allowedOrigin}/api/videos/${videoId}`);

    if (!videoRes.ok) {
      throw new Error("Video not found");
    }

    const video = await videoRes.json();

    if (
      typeof video.basePrice !== "number" ||
      typeof video.finalPrice !== "number"
    ) {
      throw new Error("Invalid video pricing");
    }

    // -------------------------
    // 3️⃣ Prepare pricing (NO recompute)
    // -------------------------
    const basePrice =
      typeof video.basePrice === "number"
        ? video.basePrice
        : Number(video.price) || 0;

    const finalPrice =
      typeof video.finalPrice === "number" ? video.finalPrice : basePrice;

    if (finalPrice <= 0) {
      throw new Error("Invalid final price");
    }

    const pricing = {
      basePrice,
      finalPrice,
      discountId: video.discount?.id ?? null,
      discountLabel: video.discount?.name ?? null,
    };

    const finalAmount = Math.round(finalPrice * 100);

    if (finalAmount <= 0) {
      throw new Error("Invalid Stripe amount");
    }

    // -------------------------
    // 4️⃣ Create Stripe session FIRST
    // -------------------------
    const session = await createCheckoutSession({
      finalAmount,
      successUrl: `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/post-checkout?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_API_BASE_URL}/cancel`,
      metadata: {
        userId,
        videoId,
      },
    });

    if (!session?.id || !session?.url) {
      throw new Error("Stripe session failed");
    }

    // -------------------------
    // 5️⃣ Create pending purchase SECOND
    // -------------------------
    await Purchase.create({
      userId,
      videoId,
      videoTitle: video.title,

      creatorName: video.creatorName,
      creatorTelegramId: video.creatorTelegramId,
      creatorUrl: video.socialMediaUrl,

      basePrice: basePrice,
      finalPrice: finalPrice,
      discountId: pricing.discountId,
      discountLabel: pricing.discountLabel,

      amount: finalPrice,
      status: "pending",
      stripeEventId: session.id,
    });

    // -------------------------
    // 6️⃣ Return Stripe URL
    // -------------------------
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
