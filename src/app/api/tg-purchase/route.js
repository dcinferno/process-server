// process-server/app/api/tg-purchase/route.js
export const runtime = "nodejs";

import { connectDB } from "../../../lib/db";
import Purchase from "../../../lib/models/Purchase";
import { computeFinalPrice } from "../../../lib/calculatePrices";
import { createCheckoutSession } from "../../../lib/createCheckoutSession";

const allowedOrigin = process.env.NEXT_PUBLIC_FRONTEND_URL;

/* ------------------------------------------
   STRIPE METADATA NORMALIZER
------------------------------------------- */
function normalizeMetadata(meta = {}, purchaseId) {
  return {
    purchaseId: String(meta.purchaseId || purchaseId),
    videoId: String(meta.videoId || "unknown_video"),
    userId: String(meta.userId || `tg_anon_${purchaseId}`),
    site: String(meta.site || "TG"),
  };
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

  // 🔎 Fetch video (source of truth)
  const videoRes = await fetch(`${allowedOrigin}/api/videos?id=${videoId}`);
  if (!videoRes.ok) {
    return new Response("Video not found", { status: 404 });
  }

  const video = await videoRes.json();
  if (!video || !video.pay || !video.fullKey) {
    return new Response("Video not purchasable", { status: 404 });
  }

  // 💰 Compute final price
  const finalAmount = computeFinalPrice(video);

  // 🧾 Create pending purchase FIRST
  const pendingPurchase = await Purchase.create({
    userId: null, // explicitly anonymous
    videoId: video._id.toString(),
    videoTitle: video.title,
    creatorName: video.creatorName,
    creatorTelegramId: video.creatorTelegramId,
    creatorUrl: video.socialMediaUrl,
    amount: finalAmount / 100,
    status: "pending",
    site: "TG",
  });

  // 🔐 SAFE STRIPE METADATA (STRINGS ONLY)
  const metadata = normalizeMetadata(
    {
      purchaseId: pendingPurchase._id.toString(),
      videoId: video._id.toString(),
      site: "TG",
    },
    pendingPurchase._id.toString()
  );

  try {
    const session = await createCheckoutSession({
      finalAmount,
      successUrl: `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/post-checkout?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_API_BASE_URL}/cancel`,
      metadata,
    });

    return Response.json({ checkoutUrl: session.url });
  } catch (err) {
    console.error("❌ tg-purchase checkout error:", err);

    // Cleanup orphaned pending purchase
    await Purchase.findByIdAndDelete(pendingPurchase._id);

    return new Response("Checkout failed", { status: 500 });
  }
}
