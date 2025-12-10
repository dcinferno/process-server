import { NextResponse } from "next/server";
import Stripe from "stripe";
import Purchase from "../../../../lib/models/Purchase";
import { connectDB } from "../../../../lib/db";

export const runtime = "nodejs"; // required for raw body
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Send sale notification to Telegram group
 */
async function sendTelegramSaleMessage({
  isTest,
  creatorName,
  videoId,
  amount,
}) {
  const header = isTest
    ? "🚨🚨🚨 TEST TRANSACTION 🚨🚨🚨\n(This is NOT real money)\n\n"
    : "💰 New Sale\n\n";

  const message = `${header}
🎥 Video ID: ${videoId}
👤 Creator: ${creatorName}
💵 Amount: $${amount.toFixed(2)}
🕒 Time: ${new Date().toLocaleTimeString()}
`;

  try {
    await fetch(
      `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: process.env.SALES_GROUP_ID,
          text: message,
          disable_web_page_preview: true,
        }),
      }
    );
  } catch (err) {
    console.error("Telegram notification failed:", err);
  }
}

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
    console.error("❌ Stripe signature verification failed:", err.message);
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const isTest = event.livemode === false;
    const session = event.data.object;

    const userId = session.metadata?.userId;
    const videoId = session.metadata?.videoId;
    const creatorName = session.metadata?.creatorName ?? "Unknown";
    const amount = session.amount_total / 100;

    if (!userId || !videoId) {
      console.error("❌ Missing required Stripe metadata");
      return new Response("Missing metadata", { status: 400 });
    }

    try {
      await connectDB();

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

      // ✅ Telegram group notification
      await sendTelegramSaleMessage({
        isTest,
        creatorName,
        videoId,
        amount,
      });
    } catch (err) {
      console.error("❌ Webhook processing error:", err);
      return new Response("Webhook processing failed", { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
