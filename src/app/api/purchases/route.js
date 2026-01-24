import { NextResponse } from "next/server";
import Purchase from "../../../lib/models/Purchase";
import { connectDB } from "../../../lib/db";

export async function GET(req) {
    const internalToken = req.headers.get("x-internal-secret");

  if (!internalToken || internalToken !== process.env.INTERNAL_API_TOKEN) {
    return new Response("Unauthorized", { status: 401 });
  }
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

    /* ----------------------------------
       BASE FILTER
    ---------------------------------- */
    const filter = { status: "paid" };

    if (creator) filter.creatorName = new RegExp(creator, "i");
    if (email) filter.email = new RegExp(email, "i");

    if (from || to) {
      const range = {
        ...(from && { $gte: new Date(from) }),
        ...(to && { $lte: new Date(to) }),
      };

      filter.$or = [
        { purchasedAt: range },
        { paidAt: range },
        { createdAt: range },
      ];
    }

    /* ----------------------------------
       QUERIES (PARALLEL)
    ---------------------------------- */
    const [purchases, total, totalsAgg] = await Promise.all([
      // Paginated rows
      Purchase.find(filter)
        .sort({ purchasedAt: -1, paidAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      // Total count (for pagination)
      Purchase.countDocuments(filter),

      // Aggregates (NO pagination)
      Purchase.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            revenue: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const totalsRow = totalsAgg[0] || { revenue: 0, count: 0 };

    return NextResponse.json({
      purchases,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),

      // 👇 NEW: all-record stats
      totals: {
        revenue: totalsRow.revenue || 0,
        count: totalsRow.count || 0,
      },
    });
  } catch (err) {
    console.error("❌ Error fetching purchases:", err);
    return new NextResponse("Server Error", { status: 500 });
  }
}
