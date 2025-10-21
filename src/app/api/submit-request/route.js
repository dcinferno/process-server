import { connectDB } from "../../../lib/db.js";
import Request from "../../../lib/models/Request.js";

export async function POST(req) {
  try {
    const body = await req.json();
    await connectDB();
    const newRequest = await Request.create(body);

    return new Response(JSON.stringify({ success: true, data: newRequest }), {
      status: 201,
    });
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ success: false, error: "Server error" }),
      {
        status: 500,
      }
    );
  }
}
