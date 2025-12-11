import { NextResponse } from "next/server";
import Stripe from "stripe";
import Purchase from "../../../../lib/models/Purchase";
import { connectDB } from "../../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function OPTIONS() {
  return new Response("OK", { status: 200 });
}

export async function HEAD() {
  return new Response("OK", { status: 200 });
}

/**
 * Format clickable creator tag
 */
function formatCreatorTag(creatorName, telegramId, fallbackUrl) {
  if (telegramId) {
    // TRUE mention by Telegram user ID
    return `[${creatorName}](tg://user?id=${telegramId})`;
  }
  if (fallbackUrl) {
    // Use the creator's public Telegram URL
    return `[${creatorName}](${fallbackUrl})`;
  }
  return creatorName;
}

/**
 * Send sale notification to Telegram group
 */
async function sendTelegramSaleMessage({
  isTest,
  creatorTag,
  videoId,
  amount,
}) {
  const header = isTest
    ? "🚨 *TEST TRANSACTION* 🚨\n_Not real money_\n\n"
    : "💰 *New Sale!* 💰\n\n";

  const message =
    `${header}` +
    `🎥 *Video:* ${videoId}\n` +
    `👤 *Creator:* ${creatorTag}\n` +
    `💵 *Amount:* $${amount.toFixed(2)}\n` +
    `🕒 *Time:* ${new Date().toLocaleTimeString()}`;

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: process.env.SALES_GROUP_ID,
          text: message,
          parse_mode: "Markdown",
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
    throw err; // allow webhook retry
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

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object;
  const isTest = event.livemode === false;

  const userId = session.metadata?.userId;
  const videoId = session.metadata?.videoId;
  const creatorName = session.metadata?.creatorName ?? "Unknown";
  const email = session.metadata?.buyerEmail;

  const creatorTelegramId = session.metadata?.creatorTelegramId || null;
  const creatorUrl = session.metadata?.creatorUrl || null;

  const amount = (session.amount_total ?? 0) / 100;

  if (!userId || !videoId) {
    console.error("❌ Missing required Stripe metadata");
    return new Response("Missing metadata", { status: 400 });
  }

  // 👉 Build the actual clickable creator tag
  const creatorTag = formatCreatorTag(
    creatorName,
    creatorTelegramId,
    creatorUrl
  );

  try {
    await connectDB();

    const result = await Purchase.findOneAndUpdate(
      {
        userId,
        videoId,
        stripeEventId: { $ne: event.id },
      },
      {
        userId,
        videoId,
        amount,
        creatorName,
        creatorTelegramId,
        creatorUrl,
        videoTitle,
        stripeEventId: event.id,
        email,
        purchasedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    if (!result) {
      console.log("↩️ Duplicate Stripe event ignored:", event.id);
      return NextResponse.json({ received: true });
    }

    await sendTelegramSaleMessage({
      isTest,
      creatorTag,
      videoId,
      amount,
    });

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("❌ Webhook processing error:", err);
    return new Response("Webhook processing failed", { status: 500 });
  }
}
