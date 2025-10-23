import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { connectDB } from "../../../../../../lib/db";
import Request from "../../../../../../lib/models/Request";

const JWT_SECRET = process.env.JWT_SECRET;

function getJwtSecretKey() {
  if (!JWT_SECRET) throw new Error("Missing JWT_SECRET");
  return new TextEncoder().encode(JWT_SECRET);
}

export async function POST(request, { params }) {
  try {
    // Auth check
    const token = request.cookies.get("auth-token")?.value;
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { payload } = await jwtVerify(token, getJwtSecretKey());

    if (payload.role !== "admin" && payload.role !== "process-server") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const { id } = params;

    const reqRecord = await Request.findById(id);
    if (!reqRecord) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Mark request as closed
    reqRecord.closed = true;
    await reqRecord.save();

    return NextResponse.json({ message: "Request closed successfully" });
  } catch (error) {
    console.error("Error closing request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
