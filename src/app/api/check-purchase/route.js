import { connectDB } from "../../../lib/db";
import Purchase from "../../../lib/models/Purchase";
export async function POST(req) {
  try {
    const { userId, videoId } = await req.json();

    if (!userId || !videoId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing userId or videoId" }),
        { status: 400 }
      );
    }

    await connectDB();

    const purchase = await Purchase.findOne({ userId, videoId });

    return new Response(JSON.stringify({ success: !!purchase }), {
      status: 200,
    });
  } catch (err) {
    console.error("check-purchase error:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Server error" }),
      { status: 500 }
    );
  }
}
