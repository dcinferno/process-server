// process-server/app/api/check-purchase/route.js
export const runtime = "nodejs";

import { connectDB } from "../../../lib/db";
import Purchase from "../../../lib/models/Purchase";

export async function POST(req) {
  // 🔐 internal auth
  const internal = req.headers.get("x-internal-token");
  if (internal !== process.env.INTERNAL_API_TOKEN) {
    return new Response("Forbidden", { status: 403 });
  }

  const { token } = await req.json();

  if (!token) {
    return Response.json({ success: false }, { status: 400 });
  }

  await connectDB();

  const purchase = await Purchase.findOne({
    accessToken: token,
    status: "paid",
  });

  if (!purchase) {
    return Response.json({ success: false }, { status: 403 });
  }

  // ----------------------------------
  // ✅ NEW: normalize unlocked videos
  // ----------------------------------
  const videoIds =
    Array.isArray(purchase.unlockedVideoIds) &&
    purchase.unlockedVideoIds.length > 0
      ? purchase.unlockedVideoIds
      : purchase.videoId
      ? [purchase.videoId]
      : [];

  if (videoIds.length === 0) {
    return Response.json({ success: false }, { status: 400 });
  }

  // ----------------------------------
  // ✅ NON-BREAKING RESPONSE
  // ----------------------------------
  if (videoIds.length === 1) {
    // EXACTLY what old clients expect
    return Response.json({
      success: true,
      videoId: videoIds[0],
    });
  }

  // New bundle-aware response
  return Response.json({
    success: true,
    videoIds,
  });
}
