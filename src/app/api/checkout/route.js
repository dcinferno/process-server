import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Use environment variable for your main-site origin
// In dev:  http://localhost:3000
// In prod: https://yourfrontend.com
const allowedOrigin = process.env.NEXT_PUBLIC_FRONTEND_URL;

// --------------------
// CORS Preflight
// --------------------
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true",
      Vary: "Origin",
    },
  });
}

// --------------------
// Create Stripe Checkout Session
// --------------------
export async function POST(req) {
  try {
    const { userId, videoId, amount, site } = await req.json();

    console.log("Checkout request received:", {
      userId,
      videoId,
      amount,
      site,
    });

    if (!userId || !videoId || !amount || !site) {
      return new Response("Missing fields", {
        status: 400,
        headers: { "Access-Control-Allow-Origin": allowedOrigin },
      });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",

      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: Math.round(amount * 100),
            product_data: {
              name: `Video Purchase: ${videoId}`,
            },
          },
        },
      ],

      // Stripe only redirects back to process-server
      success_url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/post-checkout?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/cancel`,

      metadata: {
        userId,
        videoId,
        site,
      },
    });

    console.log("Stripe session created:", session.id);

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": allowedOrigin,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
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
