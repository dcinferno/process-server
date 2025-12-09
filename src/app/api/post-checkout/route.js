import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Frontend domain allowed for redirects + CORS
const allowedOrigin = process.env.NEXT_PUBLIC_FRONTEND_URL;

// Map site codes → actual frontend domains
// In dev: "http://localhost:3000"
// In prod: your real site (or multiple sites)
const SITE_MAP = {
  A: process.env.NEXT_PUBLIC_FRONTEND_URL,
  // Add more sites if needed:
  // B: "https://othersite.com",
  // C: "https://thirdsite.com",
};

// ------------- CORS PRE-FLIGHT --------------
export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

// ------------- MAIN GET HANDLER --------------
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return new Response("Missing session_id", {
      status: 400,
      headers: { "Access-Control-Allow-Origin": allowedOrigin },
    });
  }

  try {
    // Fetch the Stripe Checkout Session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const site = session.metadata?.site;
    const videoId = session.metadata?.videoId;

    if (!site || !SITE_MAP[site]) {
      console.error("Unknown site in metadata:", site);
      return new Response("Invalid site identifier", {
        status: 400,
        headers: { "Access-Control-Allow-Origin": allowedOrigin },
      });
    }

    // Redirect URL for the frontend website
    const redirectUrl = `${SITE_MAP[site]}/success?videoId=${videoId}`;

    console.log(`Redirecting user → ${redirectUrl}`);

    return Response.redirect(redirectUrl, 302);
  } catch (error) {
    console.error("post-checkout error:", error);

    return new Response("Post-checkout error", {
      status: 500,
      headers: { "Access-Control-Allow-Origin": allowedOrigin },
    });
  }
}
