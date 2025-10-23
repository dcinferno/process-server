// For Next.js 13+ app router, put this in app/api/auth/me/route.js
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET;

function getJwtSecretKey() {
  if (!JWT_SECRET) throw new Error("Missing JWT_SECRET");
  return new TextEncoder().encode(JWT_SECRET);
}

export async function GET(req) {
  try {
    const cookie = req.cookies.get("auth-token")?.value;
    if (!cookie) return NextResponse.json({ loggedIn: false }, { status: 401 });

    const { payload } = await jwtVerify(cookie, getJwtSecretKey());

    return NextResponse.json({ loggedIn: true, user: payload });
  } catch {
    return NextResponse.json({ loggedIn: false }, { status: 401 });
  }
}
