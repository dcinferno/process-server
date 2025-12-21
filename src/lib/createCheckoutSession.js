import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function createCheckoutSession({
  finalAmount, // number (in cents)
  successUrl, // string
  cancelUrl, // string
  metadata = {}, // object (videoId, purchaseId, source, etc.)
}) {
  if (typeof finalAmount !== "number" || finalAmount <= 0) {
    throw new Error("Invalid finalAmount");
  }

  if (!successUrl || !cancelUrl) {
    throw new Error("Missing success or cancel URL");
  }

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
    metadata,
  });

  return session;
}
