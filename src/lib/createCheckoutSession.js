import Stripe from "stripe";
import Videos from "@/models/videos";
import { computeFinalPrice } from "@/lib/calculatePrices";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function createCheckoutSession({ videoId, source = "site" }) {
  const video = await Videos.findById(videoId);
  if (!video || !video.pay || !video.price || !video.fullKey) {
    throw new Error("Video not purchasable");
  }

  // ✅ SAME pricing logic as api/checkout
  const finalAmount = Math.round(computeFinalPrice(video) * 100);

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

    metadata: {
      videoId: video._id.toString(),
      source,
    },

    success_url: `${process.env.VIDEO_SITE_URL}/success?video=${video._id}`,
    cancel_url: `${process.env.VIDEO_SITE_URL}/cancel`,
  });

  return session;
}
