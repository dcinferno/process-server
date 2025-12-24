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
  const step = (label) => console.log(`✅ STEP: ${label}`);

  let body;
  step("start");

  // 1️⃣ Parse body
  try {
    body = await req.json();
    step("parsed body");
  } catch (e) {
    console.error("❌ BODY PARSE FAILED", e);
    return new Response("Invalid JSON", { status: 400 });
  }

  const { userId, videoId, site } = body;

  if (!userId || !videoId || !site) {
    console.error("❌ MISSING FIELDS", body);
    return new Response("Missing fields", { status: 400 });
  }

  // 2️⃣ DB
  try {
    await connectDB();
    step("db connected");
  } catch (e) {
    console.error("❌ DB CONNECT FAILED", e);
    return new Response("DB error", { status: 500 });
  }

  // 3️⃣ Fetch video
  let video;
  try {
    step("fetching video");
    const res = await fetch(`${allowedOrigin}/api/videos/${videoId}`);
    console.log("video fetch status", res.status);

    video = await res.json();
    console.log("video payload", video);

    if (!video?.finalPrice) throw new Error("Invalid video payload");
    step("video validated");
  } catch (e) {
    console.error("❌ VIDEO FETCH FAILED", e);
    return new Response("Video error", { status: 500 });
  }

  // 4️⃣ Stripe session
  let session;
  try {
    step("creating stripe session");

    session = await createCheckoutSession({
      finalAmount: Math.round(video.finalPrice * 100),
      successUrl: `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/post-checkout?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_API_BASE_URL}/cancel`,
      metadata: {
        userId: String(userId),
        videoId: String(videoId),
        site: String(site),
      },
    });

    console.log("stripe session", session?.id);
    step("stripe created");
  } catch (e) {
    console.error("❌ STRIPE FAILED", {
      message: e.message,
      stack: e.stack,
    });
    return new Response("Stripe error", { status: 500 });
  }

  // 5️⃣ Create purchase
  try {
    step("creating purchase");

    await Purchase.create({
      userId,
      videoId,
      videoTitle: video.title,
      creatorName: video.creatorName,
      creatorTelegramId: video.creatorTelegramId,
      creatorUrl: video.socialMediaUrl,
      basePrice: video.basePrice,
      finalPrice: video.finalPrice,
      amount: video.finalPrice,
      stripeEventId: session.id,
      status: "pending",
      site,
    });

    step("purchase created");
  } catch (e) {
    console.error("❌ PURCHASE CREATE FAILED", e);
    return new Response("Purchase error", { status: 500 });
  }

  step("done");

  return Response.json({ url: session.url });
}
