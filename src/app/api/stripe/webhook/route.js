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
    const res = await fetch(
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

    const data = await res.json();
    console.log("📬 Telegram response:", data);

    if (!data.ok) {
      throw new Error(data.description || "Telegram send failed");
    }
  } catch (err) {
    console.error("❌ Telegram notification failed:", err);
    throw err; // allow webhook retry if Telegram fails
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

  // ✅ Only process once per Stripe event
  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const isTest = event.livemode === false;
  const session = event.data.object;

  const userId = session.metadata?.userId;
  const videoId = session.metadata?.videoId;
  const creatorName = session.metadata?.creatorName ?? "Unknown";
  const amount = (session.amount_total ?? 0) / 100;

  if (!userId || !videoId) {
    console.error("❌ Missing required Stripe metadata");
    return new Response("Missing metadata", { status: 400 });
  }

  try {
    await connectDB();

    // ✅ Idempotent DB write (retry-safe)
    const result = await Purchase.findOneAndUpdate(
      {
        userId,
        videoId,
        stripeEventId: { $ne: event.id }, // prevent duplicate webhook replays
      },
      {
        userId,
        videoId,
        amount,
        stripeEventId: event.id,
        purchasedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    // ✅ If already processed, exit quietly
    if (!result) {
      console.log("↩️ Duplicate Stripe event ignored:", event.id);
      return NextResponse.json({ received: true });
    }

    // ✅ Telegram group notification
    await sendTelegramSaleMessage({
      isTest,
      creatorName,
      videoId,
      amount,
    });

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("❌ Webhook processing error:", err);
    return new Response("Webhook processing failed", { status: 500 });
  }
}
