import { NextResponse } from "next/server";
import { findToken, markTokenUsed } from "../../../lib/tokenStore.js";

export async function POST(req) {
  const { token } = await req.json();

  const tokenDoc = await findToken(token);

  if (!tokenDoc) {
    return NextResponse.json({ valid: false }, { status: 400 });
  }

  await markTokenUsed(token);

  const request = tokenDoc.requestId;

  return NextResponse.json({
    valid: true,
    requestId: request._id,
    request: {
      clientName: request.clientName,
      email: request.email,
      recipientName: request.recipientName,
      recipientAddress: request.recipientAddress,
      priority: request.priority,
      status: request.status,
    },
  });
}
