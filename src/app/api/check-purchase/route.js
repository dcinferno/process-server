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

  const { token, videoId } = await req.json();

  if (!token) {
    return Response.json({ success: false }, { status: 400 });
  }

  await connectDB();

  const query = {
    accessToken: token,
    status: "paid",
  };

  // optional narrowing
  if (videoId) {
    query.videoId = videoId;
  }

  const purchase = await Purchase.findOne(query).lean();

  if (!purchase) {
    return Response.json({ success: false }, { status: 403 });
  }

  return Response.json({
    success: true,
    videoId: purchase.videoId,
  });
}
