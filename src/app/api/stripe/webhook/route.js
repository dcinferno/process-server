import { NextResponse } from "next/server";
import Stripe from "stripe";
import Purchase from "../../../../lib/models/Purchase";
import { connectDB } from "../../../../lib/db";
import { postTweet, formatSaleTweet } from "@/lib/twitter";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Allow HEAD + OPTIONS
export async function OPTIONS() {
  return new Response("OK", { status: 200 });
}

export async function HEAD() {
  return new Response("OK", { status: 200 });
}

/* ------------------------------------------
   HTML SAFE HELPERS
------------------------------------------- */

function normalizeMetadata(meta = {}, purchaseId) {
  return {
    purchaseId: String(meta.purchaseId || purchaseId),
    videoId: String(meta.videoId || ""),
    userId: String(meta.userId || `anon_${purchaseId}`),
  };
}
function escapeHtml(t = "") {
  return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(t = "") {
  return t
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatCreatorTag(name, telegramId, url) {
  const safe = escapeHtml(name || "Unknown");
  if (telegramId)
    return `<a href="tg://user?id=${escapeAttr(telegramId)}">${safe}</a>`;
  if (url) return `<a href="${escapeAttr(url)}">${safe}</a>`;
  return safe;
}

/* ------------------------------------------
   TELEGRAM SALE NOTIFICATION
------------------------------------------- */
async function sendTelegramSaleMessage({
  isTest,
  creatorTag,
  videoTitle,
  amount,
}) {
  const safeTitle = escapeHtml(videoTitle);
  const safeTime = escapeHtml(new Date().toLocaleTimeString());
  const groupChat = isTest
    ? process.env.TEST_GROUP_ID
    : process.env.SALES_GROUP_ID;
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
          chat_id: groupChat,
          text: message,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      }
    );

    const data = await res.json();
    if (!data.ok) throw new Error(data.description || "Telegram send failed");
    console.log("📬 Telegram sent successfully:", data);
  } catch (err) {
    console.error("❌ Telegram error:", err);
  }
}

/* ------------------------------------------
   STRIPE WEBHOOK HANDLER
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
    console.error("❌ Invalid Stripe signature:", err.message);
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object;
  const isTest = !event.livemode;

  // SAFE → Only anonymous metadata
  const rawMeta = session.metadata || {};
  const meta = normalizeMetadata(rawMeta, rawMeta.purchaseId);

  const { purchaseId, videoId } = meta;

  if (!purchaseId || !videoId) {
    console.error("❌ Missing safe metadata:", session.metadata);
    return new Response("Missing metadata", { status: 400 });
  }

  const amount = (session.amount_total ?? 0) / 100;
  const email = session.customer_details?.email || "";

  try {
    await connectDB();

    // Fetch full purchase data (has title + creator)
    const existing = await Purchase.findById(purchaseId).lean();

    if (!existing) {
      console.error("❌ Purchase ID not found:", purchaseId);
      return new Response("No purchase", { status: 404 });
    }

    // Prevent duplicate events
    if (existing.stripeEventId === event.id) {
      console.log("↩️ Duplicate webhook ignored:", event.id);
      return NextResponse.json({ received: true });
    }

    // Update purchase safely (Stripe sees nothing NSFW)
    const updated = await Purchase.findByIdAndUpdate(
      purchaseId,
      {
        status: "paid",
        stripeEventId: event.id,
        email,
        purchasedAt: new Date(),
      },
      { new: true }
    ).lean();

    // Build Telegram cleaner
    const creatorTag = formatCreatorTag(
      updated.creatorName,
      updated.creatorTelegramId,
      updated.creatorUrl
    );

    // Send Telegram sale alert
    await sendTelegramSaleMessage({
      isTest,
      creatorTag,
      videoTitle: updated.videoTitle,
      amount,
    });

    try {
      await postTweet(
        formatSaleTweet({
          creatorName: updated.creatorName,
          title: updated.videoTitle,
          url: `${process.env.NEXT_PUBLIC_BASE_URL}/v/${updated.videoId}?utm_source=twitter&utm_medium=sale&utm_campaign=auto`,
        })
      );
    } catch {
      // intentionally empty
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("❌ Webhook error:", err);
    return new Response("Webhook processing failed", { status: 500 });
  }
}
