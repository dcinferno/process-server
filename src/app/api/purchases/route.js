import { NextResponse } from "next/server";
import Purchase from "../../../lib/models/Purchase";
import { connectDB } from "../../../lib/db";

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const creator = searchParams.get("creator");
    const email = searchParams.get("email");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    // ✔ Only return finalized paid purchases
    let filter = { status: "paid" };

    if (creator) {
      filter.creatorName = new RegExp(`^${creator}$`, "i");
    }

    if (email) {
      filter.email = new RegExp(`^${email}$`, "i");
    }

    if (from || to) {
      filter.purchasedAt = {};
      if (from) filter.purchasedAt.$gte = new Date(from);
      if (to) filter.purchasedAt.$lte = new Date(to);
    }

    const purchases = await Purchase.find(filter).sort({
      purchasedAt: -1,
    });

    return NextResponse.json(purchases);
  } catch (err) {
    console.error("❌ Error fetching purchases:", err);
    return new NextResponse("Server Error", { status: 500 });
  }
}
