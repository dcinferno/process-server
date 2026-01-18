// process-server/app/api/tg-purchase/route.js
export const runtime = "nodejs";

import crypto from "crypto";
import { connectDB } from "../../../lib/db";
import Purchase from "../../../lib/models/Purchase";
import { createCheckoutSession } from "../../../lib/createCheckoutSession";

const allowedOrigin = process.env.NEXT_PUBLIC_FRONTEND_URL;

// --------------------------------------------------
// Helpers
// --------------------------------------------------
function anonGuid() {
  return `tg_anon_${crypto.randomUUID()}`;
}

// --------------------------------------------------
// POST
// --------------------------------------------------
export async function POST(req) {
  await connectDB();

  // 🔐 Internal auth (server → server only)
  const token = req.headers.get("x-internal-token");
  if (token !== process.env.INTERNAL_API_TOKEN) {
    return new Response("Forbidden", { status: 403 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { videoId } = body;
  if (!videoId) {
    return new Response("Missing videoId", { status: 400 });
  }

  // --------------------------------------------------
  // 1️⃣ Fetch SINGLE priced video (source of truth)
  // --------------------------------------------------
  const videoRes = await fetch(`${allowedOrigin}/api/videos/${videoId}`);
  if (!videoRes.ok) {
    return new Response("Video not found", { status: 404 });
  }

  const video = await videoRes.json();

  if (
    !video ||
    !video.pay ||
    !video.fullKey ||
    typeof video.basePrice !== "number" ||
    typeof video.finalPrice !== "number"
  ) {
    return new Response("Video not purchasable", { status: 400 });
  }

  const basePrice = video.basePrice;
  const finalPrice = video.finalPrice;

  const finalAmount = Math.round(finalPrice * 100); // cents
  if (finalAmount <= 0) {
    return new Response("Invalid price", { status: 400 });
  }

  // --------------------------------------------------
  // 2️⃣ Create / reuse PENDING purchase FIRST (Option B)
  // --------------------------------------------------
  const anonUserId = anonGuid();

  let purchase = await Purchase.findOne({
    userId: anonUserId,
    videoId,
    status: "pending",
  });

  if (!purchase) {
    purchase = await Purchase.create({
      userId: anonUserId,
      videoId,
      videoTitle: video.title,
      type: "video",
      creatorName: video.creatorName,
      creatorTelegramId: video.creatorTelegramId,
      creatorUrl: video.socialMediaUrl,

      basePrice,
      finalPrice,
      amount: finalPrice,

      discountId: video.discount?.id ?? null,
      discountLabel: video.discount?.name ?? null,

      status: "pending",
      site: "TG",
    });
  }

  // --------------------------------------------------
  // 3️⃣ Create Stripe session WITH purchaseId
  // --------------------------------------------------
  const session = await createCheckoutSession({
    finalAmount,
    successUrl: `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/post-checkout?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${process.env.NEXT_PUBLIC_API_BASE_URL}/cancel`,
    metadata: {
      purchaseId: purchase._id.toString(), // 🔑 CRITICAL
      userId: anonUserId,
      videoId,
      site: "TG",
    },
  });

  if (!session?.id || !session?.url) {
    throw new Error("Stripe session failed");
  }

  // --------------------------------------------------
  // 4️⃣ Attach Stripe session ID to purchase
  // --------------------------------------------------
  purchase.stripeEventId = session.id;
  await purchase.save();

  // --------------------------------------------------
  // 5️⃣ Return checkout URL
  // --------------------------------------------------
  return Response.json({ checkoutUrl: session.url });
}
