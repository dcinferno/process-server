import { connectDB } from "../../../lib/db";
import Section from "../../../lib/models/Section";

export async function GET() {
  await connectDB();

  try {
    const sections = await Section.find({});
    return new Response(JSON.stringify(sections), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to load sections" }), {
      status: 500,
    });
  }
}
