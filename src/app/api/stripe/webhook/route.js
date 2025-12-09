import { NextResponse } from "next/server";
import Stripe from "stripe";
import Purchase from "../../../../lib/models/Purchase";
import { connectToDB } from "../../../../lib/db";

export const runtime = "nodejs"; // important for raw body
export const dynamic = "force-dynamic"; // ensures webhook isn't cached

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ⚠️ You MUST read the raw body using req.arrayBuffer(), not req.json()
export async function POST(req) {
  const body = Buffer.from(await req.arrayBuffer());
  const sig = req.headers.get("stripe-signature");

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const userId = session.metadata?.userId;
    const videoId = session.metadata?.videoId;
    const amount = session.amount_total / 100;

    if (!userId || !videoId) {
      return new Response("Missing metadata", { status: 400 });
    }

    try {
      await connectToDB();

      await Purchase.findOneAndUpdate(
        { userId, videoId },
        {
          userId,
          videoId,
          amount,
          purchasedAt: new Date(),
        },
        { upsert: true }
      );
    } catch (err) {
      return new Response("Database error", { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
