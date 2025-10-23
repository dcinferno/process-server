import { connectDB } from "../../../lib/db";
import User from "../../../lib/models/User";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const JWT_SECRET = process.env.JWT_SECRET;

function getJwtSecretKey() {
  if (!JWT_SECRET) throw new Error("Missing JWT_SECRET");
  return new TextEncoder().encode(JWT_SECRET);
}

export async function POST(req) {
  const { email, password, address } = await req.json();
  if (address && address.trim() !== "") {
    return new Response(JSON.stringify({ error: "Login failed" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (!email || !password) {
    return new Response(
      JSON.stringify({ error: "Email and password are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    await connectDB();

    const user = await User.findOne({ email }).lean();

    if (!user) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const jwt = await new SignJWT({
      sub: user._id.toString(),
      role: user.role,
      email: user.email,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("2h")
      .sign(getJwtSecretKey());

    // Set cookie header
    return new Response(JSON.stringify({ role: user.role }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": `auth-token=${jwt}; HttpOnly; Path=/; Max-Age=7200; SameSite=Lax; Secure`,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
