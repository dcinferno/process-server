import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "../../../lib/db";
import User from "../../../lib/models/User";
import { verifyPassword } from "../../../lib/auth";

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(request) {
  await connectDB();

  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  const user = await User.findOne({ email });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }

  const isValid = await verifyPassword(password, user.passwordHash);

  if (!isValid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // Create JWT
  const token = jwt.sign(
    {
      id: user._id,
      email: user.email,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: "2h" }
  );

  const response = NextResponse.json({ message: "Login successful" });

  response.cookies.set("admin-auth", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 2, // 2 hours
  });

  return response;
}
