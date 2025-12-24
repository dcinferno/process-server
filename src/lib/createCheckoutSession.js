import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is missing");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function createCheckoutSession({
  finalAmount,
  successUrl,
  cancelUrl,
  metadata = {},
}) {
  if (typeof finalAmount !== "number" || finalAmount <= 0) {
    throw new Error("Invalid finalAmount");
  }

  // Validate URLs
  try {
    new URL(successUrl);
    new URL(cancelUrl);
  } catch {
    throw new Error("Invalid success or cancel URL");
  }

  // Stripe requires string metadata
  const safeMetadata = Object.fromEntries(
    Object.entries(metadata).map(([k, v]) => [k, String(v)])
  );

  const session = await stripe.checkout.sessions.create({
    mode: "payment",

    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: finalAmount,
          product_data: {
            name: "Digital Product",
          },
        },
        quantity: 1,
      },
    ],

    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: safeMetadata,
  });

  return session;
}
