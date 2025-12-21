import Stripe from "stripe";
import { connectDB } from "@/lib/db";
import Purchase from "@/lib/models/Purchase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const allowedOrigin = process.env.NEXT_PUBLIC_FRONTEND_URL;

// Maps "site" → neutral redirect entrypoint
const SITE_MAP = {
  A: process.env.NEXT_PUBLIC_FRONTEND_URL,
};

/* ------------------------------------------
   METADATA NORMALIZER (DEFENSIVE)
------------------------------------------- */
function normalizeMetadata(meta = {}, fallbackPurchaseId) {
  const purchaseId = String(meta.purchaseId || fallbackPurchaseId || "");
  return {
    purchaseId,
    videoId: String(meta.videoId || ""),
    userId: String(meta.userId || `anon_${purchaseId}`),
    site: String(meta.site || "A"),
  };
}

/* ------------------------------------------
   OPTIONS
------------------------------------------- */
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

/* ------------------------------------------
   GET
------------------------------------------- */
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

    // Retrieve Checkout Session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Normalize metadata safely
    const meta = normalizeMetadata(session.metadata);

    const { purchaseId, videoId, site } = meta;
    const email = session.customer_details?.email || "";

    if (!purchaseId || !videoId) {
      console.error("❌ Invalid metadata in post-checkout:", session.metadata);
      // STILL redirect user — never trap a paid customer
    } else {
      // Idempotent update
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
    }

    // Resolve redirect site safely
    const redirectSite = SITE_MAP[site] || allowedOrigin;

    const redirectUrl = `${redirectSite}/success?videoId=${encodeURIComponent(
      videoId || ""
    )}`;

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
    console.error("❌ post-checkout error:", err);

    // Last-resort redirect (never dead-end user)
    return new Response(null, {
      status: 302,
      headers: {
        Location: `${allowedOrigin}/success`,
        "Access-Control-Allow-Origin": allowedOrigin,
        "Access-Control-Allow-Credentials": "true",
        Vary: "Origin",
      },
    });
  }
}
