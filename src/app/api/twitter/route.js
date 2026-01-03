// app/api/twitter/route.js
import { postTweet } from "@/lib/twitter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  console.log("🐦 /api/twitter test route HIT");

  try {
    await postTweet(`🐦 Twitter test ${Date.now()}`);
    console.log("🐦 postTweet finished");
  } catch (err) {
    console.error("🐦 postTweet threw:", err);
  }

  return Response.json({ ok: true });
}
