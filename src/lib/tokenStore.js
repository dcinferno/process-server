import { connectDB } from "./db";
import MagicToken from "./models/MagicToken.js";

export async function saveMagicToken({ requestId, token, expiresAt }) {
  await connectDB();
  await MagicToken.create({
    requestId,
    token,
    expiresAt,
  });
}

export async function findToken(token) {
  await connectDB();
  const tokenDoc = await MagicToken.findOne({
    token,
    used: false,
    expiresAt: { $gt: new Date() },
  }).populate("requestId"); // populate Request data if needed
  return tokenDoc;
}

export async function markTokenUsed(token) {
  await connectDB();
  await MagicToken.updateOne({ token }, { used: true });
}
