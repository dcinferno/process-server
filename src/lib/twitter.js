// lib/twitter.js
import { TwitterApi } from "twitter-api-v2";
import { connectDB } from "./db";
import Counter from "./models/Counter";
import { cleanText } from "./profanity";

/* ---------------------------------
   CONFIG
---------------------------------- */
const ENABLED = process.env.TWITTER_ENABLED === "true";
const MONTHLY_LIMIT = 480; // stay under free 500 cap

/* ---------------------------------
   CLIENT
---------------------------------- */
let client = null;

if (ENABLED) {
  try {
    client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_SECRET,
    });
  } catch (err) {
    console.warn("🐦 Twitter client init failed:", err.message);
  }
}

/* ---------------------------------
   RATE LIMIT TRACKING (MONTHLY)
---------------------------------- */
async function canPostTweet() {
  try {
    await connectDB();

    const month = new Date().toISOString().slice(0, 7); // YYYY-MM
    const key = `twitter:${month}`;

    const doc = await Counter.findOneAndUpdate(
      { key },
      { $inc: { count: 1 } },
      { upsert: true, new: true }
    );

    if (doc.count > MONTHLY_LIMIT) {
      console.warn("🐦 Twitter monthly limit reached");
      return false;
    }

    return true;
  } catch (err) {
    // Fail-open so Twitter never blocks Stripe
    console.warn("🐦 Twitter counter error, allowing post:", err.message);
    return true;
  }
}

/* ---------------------------------
   PUBLIC API
---------------------------------- */
export async function postTweet(text) {
  if (!ENABLED) return;
  if (!client) return;
  if (!text || typeof text !== "string") return;

  const safeText = text.slice(0, 280);

  try {
    const allowed = await canPostTweet();
    if (!allowed) return;

    await client.v2.tweet(safeText);

    console.log("🐦 Tweet posted:", safeText);
  } catch (err) {
    // NEVER throw — Stripe webhooks must not fail
    console.warn("🐦 Twitter post failed:", err?.data || err?.message || err);
  }
}

/* ---------------------------------
   OPTIONAL FORMATTERS
---------------------------------- */

export function formatSaleTweet({ creatorName, title, url }) {
  const safeTitle = cleanText(title);
  return `💰 New sale\n${creatorName}\n"${safeTitle}"\n\n${url}`;
}
