// process-server/app/api/tg-purchase/route.js
export const runtime = "nodejs";

import crypto from "crypto";
import { connectDB } from "../../../lib/db";
import Purchase from "../../../lib/models/Purchase";
import { createCheckoutSession } from "../../../lib/createCheckoutSession";

const allowedOrigin = process.env.NEXT_PUBLIC_FRONTEND_URL;

function anonGuid() {
  return `tg_anon_${crypto.randomUUID()}`;
}

export async function POST(req) {
  await connectDB();

  // 🔐 Internal auth (server-to-server only)
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

  // -------------------------
  // 1️⃣ Fetch SINGLE priced video
  // -------------------------
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
    return new Response("Video not purchasable", { status: 404 });
  }

  // -------------------------
  // 2️⃣ Prepare pricing (NO recompute)
  // -------------------------
  const pricing = {
    basePrice: video.basePrice,
    finalPrice: video.finalPrice,
    discountId: video.discount?.id ?? null,
    discountLabel: video.discount?.name ?? null,
  };

  const finalAmount = Math.round(pricing.finalPrice * 100); // cents

  if (finalAmount <= 0) {
    return new Response("Invalid price", { status: 400 });
  }

  // -------------------------
  // 3️⃣ Create Stripe session FIRST
  // -------------------------
  const anonUserId = anonGuid();

  const session = await createCheckoutSession({
    finalAmount,
    successUrl: `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/post-checkout?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${process.env.NEXT_PUBLIC_API_BASE_URL}/cancel`,
    metadata: {
      videoId,
      userId: anonUserId,
      site: "TG",
    },
  });

  if (!session?.id || !session?.url) {
    return new Response("Stripe session failed", { status: 500 });
  }

  // -------------------------
  // 4️⃣ Create pending purchase SECOND
  // -------------------------
  await Purchase.create({
    userId: anonUserId,
    videoId: video._id.toString(),
    videoTitle: video.title,

    creatorName: video.creatorName,
    creatorTelegramId: video.creatorTelegramId,
    creatorUrl: video.socialMediaUrl,

    basePrice: pricing.basePrice,
    finalPrice: pricing.finalPrice,
    discountId: pricing.discountId,
    discountLabel: pricing.discountLabel,

    amount: pricing.finalPrice,
    status: "pending",
    stripeEventId: session.id,
    site: "TG",
  });

  // -------------------------
  // 5️⃣ Return checkout URL
  // -------------------------
  return Response.json({ checkoutUrl: session.url });
}
