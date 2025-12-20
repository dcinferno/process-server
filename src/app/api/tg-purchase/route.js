// process-server/app/api/tg-purchase/route.js
import { connectToDB } from "../../../lib/db";
import { computeFinalPrice } from "../../../lib/calculatePrices";
import { createCheckoutSession } from "../../../lib/createCheckoutSession";

export async function POST(req) {
  await connectToDB();

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
  // Fetch video info from your own API (Stripe won't see any of this)
  const video = await fetch(`${allowedOrigin}/api/videos?id=${videoId}`);
  if (!video.ok)
    return new Response("Video not found", {
      status: 404,
      headers: corsHeaders(req),
    });
  if (!video || !video.pay || !video.fullKey) {
    return new Response("Video not purchasable", { status: 404 });
  }

  // 💰 Same pricing logic as api/checkout
  const finalAmount = computeFinalPrice(video);

  try {
    const session = await createCheckoutSession({
      finalAmount,
      successUrl: `${process.env.VIDEO_SITE_URL}/success?video=${video._id}`,
      cancelUrl: `${process.env.VIDEO_SITE_URL}/cancel`,
      metadata: {
        videoId: video._id.toString(),
        source: "telegram",
      },
    });

    return Response.json({ checkoutUrl: session.url });
  } catch (err) {
    console.error("tg-purchase checkout error:", err);
    return new Response("Checkout failed", { status: 500 });
  }
}
