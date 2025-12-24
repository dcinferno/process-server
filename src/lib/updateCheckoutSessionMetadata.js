import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is missing");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
export async function updateCheckoutSessionMetadata(sessionId, metadata) {
  if (!sessionId) {
    throw new Error("Missing sessionId");
  }

  if (!metadata || typeof metadata !== "object") {
    throw new Error("Invalid metadata");
  }

  // Stripe requires string values
  const safeMetadata = Object.fromEntries(
    Object.entries(metadata).map(([k, v]) => [k, String(v)])
  );

  return stripe.checkout.sessions.update(sessionId, {
    metadata: safeMetadata,
  });
}
