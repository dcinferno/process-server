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
  console.log("🐦 postTweet called", {
    enabled: ENABLED,
    hasClient: !!client,
    textLength: text?.length,
  });

  if (!ENABLED) {
    console.log("🐦 Twitter disabled via env");
    return;
  }

  if (!client) {
    console.log("🐦 Twitter client missing");
    return;
  }

  if (!text || typeof text !== "string") {
    console.log("🐦 Invalid tweet text");
    return;
  }

  const safeText = text.slice(0, 280);

  try {
    const allowed = await canPostTweet();
    console.log("🐦 canPostTweet =", allowed);

    if (!allowed) return;

    const res = await client.v2.tweet(safeText);

    console.log("🐦 Twitter API response:", res);
  } catch (err) {
    console.error("🐦 Twitter ERROR full dump ↓↓↓");
    console.error(err);

    if (err?.data) {
      console.error("🐦 err.data:", JSON.stringify(err.data, null, 2));
    }

    if (err?.code) {
      console.error("🐦 err.code:", err.code);
    }

    if (err?.response) {
      console.error("🐦 err.response:", err.response);
    }
  }
}

/* ---------------------------------
   OPTIONAL FORMATTERS
---------------------------------- */

export function formatSaleTweet({ creatorName, title, url }) {
  const safeTitle = cleanText(title);
  return `💰 New sale\n${creatorName}\n"${safeTitle}"\n\n${url}`;
}
