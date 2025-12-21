import Stripe from "stripe";
import { connectDB } from "@/lib/db";
import Purchase from "@/lib/models/Purchase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const allowedOrigin = process.env.NEXT_PUBLIC_FRONTEND_URL;

// Maps "site" → Neutral redirect entrypoint (NOT your real NSFW URL!)
const SITE_MAP = {
  A: process.env.NEXT_PUBLIC_FRONTEND_URL,
};

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Credentials": "true",
      Vary: "Origin",
    },
  });
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return new Response("Missing session_id", {
      status: 400,
      headers: {
        "Access-Control-Allow-Origin": allowedOrigin,
        "Access-Control-Allow-Credentials": "true",
      },
    });
  }

  try {
    await connectDB();

    // Retrieve session safely
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // SAFE — Stripe metadata contains only anonymous IDs
    const purchaseId = session.metadata?.purchaseId;
    const userId = session.metadata?.userId;
    const videoId = session.metadata?.videoId;
    const site = session.metadata?.site;

    const email = session.customer_details?.email || "";

    if (!purchaseId || !videoId || !userId) {
      console.error("Missing metadata:", session.metadata);
      return new Response("Invalid metadata", { status: 400 });
    }

    // Update purchase record
    await Purchase.findByIdAndUpdate(
      purchaseId,
      {
        status: "paid",
        email,
        paidAt: new Date(),
        stripeSessionId: sessionId,
      },
      { new: true }
    );
    const redirectSite = SITE_MAP[site] ?? allowedOrigin;

    // Redirect user back to the actual front-end
    const redirectUrl = `${redirectSite}/success?videoId=${videoId}`;

    // Safari-friendly redirect
    return new Response(null, {
      status: 302,
      headers: {
        Location: redirectUrl,
        "Access-Control-Allow-Origin": allowedOrigin,
        "Access-Control-Allow-Credentials": "true",
        Vary: "Origin",
      },
    });
  } catch (err) {
    console.error("post-checkout error:", err);
    return new Response("Post-checkout error", {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": allowedOrigin,
        "Access-Control-Allow-Credentials": "true",
      },
    });
  }
}
