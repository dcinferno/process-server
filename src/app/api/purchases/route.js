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

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    const filter = { status: "paid" };

    // Text filters
    if (creator) filter.creatorName = new RegExp(creator, "i");
    if (email) filter.email = new RegExp(email, "i");

    // Date filter (safe fallback order)
    if (from || to) {
      filter.$or = [
        {
          purchasedAt: {
            ...(from && { $gte: new Date(from) }),
            ...(to && { $lte: new Date(to) }),
          },
        },
        {
          paidAt: {
            ...(from && { $gte: new Date(from) }),
            ...(to && { $lte: new Date(to) }),
          },
        },
        {
          createdAt: {
            ...(from && { $gte: new Date(from) }),
            ...(to && { $lte: new Date(to) }),
          },
        },
      ];
    }

    const [purchases, total] = await Promise.all([
      Purchase.find(filter)
        .sort({ purchasedAt: -1, paidAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Purchase.countDocuments(filter),
    ]);

    return NextResponse.json({
      purchases,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    console.error("❌ Error fetching purchases:", err);
    return new NextResponse("Server Error", { status: 500 });
  }
}
