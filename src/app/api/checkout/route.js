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
    const {
      userId,
      videoId,
      site,
      creatorName,
      creatorTelegramId,
      creatorUrl,
    } = await req.json();

    if (!userId || !videoId || !site) {
      return new Response("Missing fields", {
        status: 400,
        headers: { "Access-Control-Allow-Origin": allowedOrigin },
      });
    }

    await connectDB();

    // ✔ Prevent double purchase
    const existingPurchase = await Purchase.findOne({ userId, videoId });
    if (existingPurchase) {
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

    // ✔ Fetch video details from your public video-store API
    const videoRes = await fetch(`${allowedOrigin}/api/videos?id=${videoId}`);

    if (!videoRes.ok) {
      return new Response("Video not found", { status: 404 });
    }

    const video = await videoRes.json();
    if (!video || typeof video.price !== "number") {
      return new Response("Invalid video pricing", { status: 400 });
    }

    // ✔ Compute official final price (ignores client-side manipulation)
    const unitAmount = computeFinalPrice(video);

    // ------------ STRIPE CHECKOUT SESSION -----------------
    const session = await stripe.checkout.sessions.create({
      mode: "payment",

      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: unitAmount,
            product_data: {
              name: `Video: ${video.title || videoId}`,
            },
          },
        },
      ],

      success_url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/post-checkout?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/cancel`,

      metadata: {
        userId,
        videoId,
        site,
        chargedAmount: unitAmount,
        creatorName: creatorName ?? video.creatorName ?? "",
        creatorTelegramId: creatorTelegramId ?? video.creatorTelegramId ?? "",
        creatorUrl: creatorUrl ?? video.socialMediaUrl ?? "",
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
    return new Response("Checkout Error", {
      status: 500,
      headers: { "Access-Control-Allow-Origin": allowedOrigin },
    });
  }
}
