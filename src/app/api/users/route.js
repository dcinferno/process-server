import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/db";
import User from "../../../lib/models/User";
import { hashPassword } from "../../../lib/auth";

export async function GET() {
  await connectDB();

  const users = await User.find({}).lean();

  const usersWithStringIds = users.map((user) => ({
    ...user,
    _id: user._id.toString(),
  }));

  return NextResponse.json(usersWithStringIds);
}

export async function POST(request) {
  await connectDB();

  const { name, email, password, secretKey } = await request.json();

  if (secretKey !== process.env.USER_CREATION_SECRET) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid secret key" },
      { status: 401 }
    );
  }

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return NextResponse.json(
      { error: "Email already in use" },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);

  const user = new User({ name, email, passwordHash });
  await user.save();

  return NextResponse.json({ message: "User created" }, { status: 201 });
}
