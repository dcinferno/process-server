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
  try {
    const { userId, videoId } = await req.json();

    if (!userId || !videoId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing userId or videoId" }),
        {
          status: 400,
          headers: {
            "Access-Control-Allow-Origin": allowedOrigin,
            "Access-Control-Allow-Credentials": "true",
            Vary: "Origin",
          },
        }
      );
    }

    await connectDB();

    const purchase = await Purchase.findOne({ userId, videoId });

    return new Response(JSON.stringify({ success: !!purchase }), {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": allowedOrigin,
        "Access-Control-Allow-Credentials": "true",
        Vary: "Origin",
      },
    });
  } catch (err) {
    console.error("check-purchase error:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Server error" }),
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": allowedOrigin,
          "Access-Control-Allow-Credentials": "true",
          Vary: "Origin",
        },
      }
    );
  }
}
