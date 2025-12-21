import { connectDB } from "../../../lib/db";
import Purchase from "../../../lib/models/Purchase";

// Your frontend origin (same as other routes)
const allowedOrigin = process.env.NEXT_PUBLIC_FRONTEND_URL;

// ----------------------------
//  OPTIONS — CORS Preflight
// ----------------------------
export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Credentials": "true",
      Vary: "Origin",
    },
  });
}

// ----------------------------
//  POST — Check Purchase
// ----------------------------
export async function POST(req) {
  await connectDB();

  const { userId, videoId } = await req.json();

  if (!videoId) {
    return Response.json({ success: false }, { status: 400 });
  }

  const thirtyMinutesAgo = new Date(Date.now() - 1000 * 60 * 30);

  let purchase;

  if (userId) {
    // ✅ SITE PURCHASE (permanent)
    purchase = await Purchase.findOne({
      userId,
      videoId,
      status: "paid",
    });
  } else {
    // ✅ TG / ANON PURCHASE (time-limited)
    purchase = await Purchase.findOne({
      videoId,
      status: "paid",
      paidAt: { $gte: thirtyMinutesAgo },
      site: "TG",
    });
  }

  return Response.json({ success: !!purchase });
}
