import Stripe from "stripe";
import { connectDB } from "@/lib/db";
import Purchase from "@/lib/models/Purchase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const allowedOrigin = process.env.NEXT_PUBLIC_FRONTEND_URL;

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
        Vary: "Origin",
      },
    });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const site = session.metadata?.site;
    const videoId = session.metadata?.videoId;
    const userId = session.metadata?.userId;

    await connectDB();

    // Upsert purchase record
    await Purchase.findOneAndUpdate(
      { userId, videoId },
      { userId, videoId },
      { upsert: true }
    );

    if (!site || !SITE_MAP[site]) {
      console.error("Unknown site:", site);
      return new Response("Invalid site", {
        status: 400,
        headers: {
          "Access-Control-Allow-Origin": allowedOrigin,
          "Access-Control-Allow-Credentials": "true",
          Vary: "Origin",
        },
      });
    }

    const redirectUrl = `${SITE_MAP[site]}/success?videoId=${videoId}`;
    // SAFARI-FRIENDLY REDIRECT
    return new Response(null, {
      status: 302,
      headers: {
        Location: redirectUrl,
        "Access-Control-Allow-Origin": allowedOrigin,
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        Vary: "Origin",
      },
    });
  } catch (error) {
    console.error("post-checkout error:", error);
    return new Response("Post-checkout error", {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": allowedOrigin,
        "Access-Control-Allow-Credentials": "true",
        Vary: "Origin",
      },
    });
  }
}
