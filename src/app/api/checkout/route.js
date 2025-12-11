import Stripe from "stripe";
import { connectDB } from "../../../lib/db";
import Purchase from "../../../lib/models/Purchase";
import { computeFinalPrice } from "../../../lib/calculatePrices";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const allowedOrigin = process.env.NEXT_PUBLIC_FRONTEND_URL;

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Credentials": "true",
      Vary: "Origin",
    },
  });
}

export async function POST(req) {
  try {
    const { userId, videoId, site } = await req.json();

    if (!userId || !videoId || !site) {
      return new Response("Missing fields", { status: 400 });
    }

    await connectDB();

    // Prevent duplicate purchases
    const existing = await Purchase.findOne({ userId, videoId });
    if (existing) {
      return new Response(
        JSON.stringify({ error: "Already purchased", purchased: true }),
        {
          status: 409,
          headers: {
            "Access-Control-Allow-Origin": allowedOrigin,
            "Access-Control-Allow-Credentials": "true",
          },
        }
      );
    }

    // Fetch video info from your own API (Stripe won't see any of this)
    const videoRes = await fetch(`${allowedOrigin}/api/videos?id=${videoId}`);
    if (!videoRes.ok) return new Response("Video not found", { status: 404 });

    const video = await videoRes.json();
    if (!video || typeof video.price !== "number") {
      return new Response("Invalid video pricing", { status: 400 });
    }

    // Compute server-side price
    const finalAmount = computeFinalPrice(video);

    // BEFORE creating the Stripe session, store a pending purchase
    const pendingPurchase = await Purchase.create({
      userId,
      videoId,
      videoTitle: video.title, // SAFE – stays in your DB only
      creatorName: video.creatorName, // SAFE – not sent to Stripe
      creatorTelegramId: video.creatorTelegramId,
      creatorUrl: video.socialMediaUrl,
      amount: finalAmount / 100,
      status: "pending",
      site,
    });

    // Create the Stripe session with NO sensitive metadata
    const session = await stripe.checkout.sessions.create({
      mode: "payment",

      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: finalAmount,
            product_data: {
              name: "Digital Product", // 👈 Safe generic label, Stripe sees nothing NSFW
            },
          },
          quantity: 1,
        },
      ],

      // Send Stripe to a SAFE redirect domain (not the video store)
      success_url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/post-checkout?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/cancel`,

      // SAFE Metadata: only anonymous IDs
      metadata: {
        purchaseId: pendingPurchase._id.toString(),
        userId,
        videoId,
        site,
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": allowedOrigin,
        "Access-Control-Allow-Credentials": "true",
      },
    });
  } catch (err) {
    console.error("Checkout error:", err);
    return new Response("Checkout Error", { status: 500 });
  }
}
