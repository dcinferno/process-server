import { NextResponse } from "next/server";
import Stripe from "stripe";
import Purchase from "../../../../lib/models/Purchase";
import { connectDB } from "../../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Allow Stripe HEAD + OPTIONS
export async function OPTIONS() {
  return new Response("OK", { status: 200 });
}

export async function HEAD() {
  return new Response("OK", { status: 200 });
}

/* ------------------------------------------
   HTML-SAFE ENCODERS (avoid broken messages)
------------------------------------------- */
function escapeHtml(text = "") {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(text = "") {
  return text
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* ------------------------------------------
   Format clickable creator tag (HTML)
------------------------------------------- */
function formatCreatorTag(creatorName, telegramId, fallbackUrl) {
  const safeName = escapeHtml(creatorName || "Unknown");

  if (telegramId) {
    // TRUE Telegram user mention
    return `<a href="tg://user?id=${escapeAttr(telegramId)}">${safeName}</a>`;
  }

  if (fallbackUrl) {
    return `<a href="${escapeAttr(fallbackUrl)}">${safeName}</a>`;
  }

  return safeName;
}

/* ------------------------------------------
   Send Telegram sale notification
------------------------------------------- */
async function sendTelegramSaleMessage({
  isTest,
  creatorTag,
  videoTitle,
  amount,
}) {
  const safeTitle = escapeHtml(videoTitle);
  const safeTime = escapeHtml(new Date().toLocaleTimeString());

  const header = isTest
    ? `🚨 <b>TEST TRANSACTION</b> 🚨\n<i>Not real money</i>\n\n`
    : `💰 <b>New Sale!</b> 💰\n\n`;

  const message =
    `${header}` +
    `🎥 <b>Video:</b> ${safeTitle}\n` +
    `👤 <b>Creator:</b> ${creatorTag}\n` +
    `💵 <b>Amount:</b> $${amount.toFixed(2)}\n` +
    `🕒 <b>Time:</b> ${safeTime}`;

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: process.env.SALES_GROUP_ID,
          text: message,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      }
    );

    const data = await res.json();
    console.log("📬 Telegram response:", data);

    if (!data.ok) throw new Error(data.description || "Telegram send failed");
  } catch (err) {
    console.error("❌ Telegram notification failed:", err);
    throw err;
  }
}

/* ------------------------------------------
   HANDLE STRIPE WEBHOOK
------------------------------------------- */
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
  const isTest = !event.livemode;

  const userId = session.metadata?.userId;
  const videoId = session.metadata?.videoId;
  const videoTitle = session.metadata?.videoTitle || "Unknown Title";

  const creatorName = session.metadata?.creatorName || "Unknown";
  const creatorTelegramId = session.metadata?.creatorTelegramId || null;
  const creatorUrl = session.metadata?.creatorUrl || null;
  const email = session.metadata?.buyerEmail || null;

  const amount = (session.amount_total ?? 0) / 100;

  if (!userId || !videoId) {
    console.error("❌ Missing metadata in Stripe session", session.metadata);
    return new Response("Missing metadata", { status: 400 });
  }

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
        stripeEventId: { $ne: event.id }, // prevent duplicates
      },
      {
        userId,
        videoId,
        videoTitle,
        creatorName,
        creatorTelegramId,
        creatorUrl,
        amount,
        email,
        stripeEventId: event.id,
        purchasedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    if (!result) {
      console.log("↩️ Duplicate Stripe event ignored:", event.id);
      return NextResponse.json({ received: true });
    }

    // Send Telegram message
    await sendTelegramSaleMessage({
      isTest,
      creatorTag,
      videoTitle,
      amount,
    });

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("❌ Webhook processing error:", err);
    return new Response("Webhook processing failed", { status: 500 });
  }
}
