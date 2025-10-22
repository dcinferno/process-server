import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { connectDB } from "../../../lib/db";
import Request from "../../../lib/models/Request";
import MagicToken from "../../../lib/models/MagicToken";
import { sendMagicLinkEmail } from "../../../lib/emailer";

export async function POST(req) {
  const { requestId } = await req.json();

  await connectDB();

  const request = await Request.findById(requestId);
  if (!request) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min

  await MagicToken.create({
    requestId: request._id,
    token,
    expiresAt,
  });

  const magicLink = `${process.env.NEXT_PUBLIC_API_BASE_URL}/magic/${token}`;

  try {
    await sendMagicLinkEmail(request.email, magicLink);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error sending email:", err);
    return NextResponse.json(
      { error: "Email failed to send" },
      { status: 500 }
    );
  }
}
