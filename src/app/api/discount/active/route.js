export const runtime = "nodejs";

import { connectDB } from "../../../../lib/db";
import Discount from "../../../../lib/models/Discount";

/* ------------------------------------------
   HELPERS
------------------------------------------- */
const normalize = (s) => s?.trim().toLowerCase();

/* ------------------------------------------
   GET /discount/active
------------------------------------------- */
export async function GET() {
  await connectDB();

  const now = new Date();

  // 1️⃣ Pull active + in-window discounts
  const discounts = await Discount.find({
    active: true,
    startsAt: { $lte: now },
    endsAt: { $gte: now },
  }).lean();

  const response = {
    global: null,
    creators: {},
  };

  for (const d of discounts) {
    const discountPayload = {
      name: d.name,
      type: d.type,
      percentOff: d.percentOff,
      tags:
        Array.isArray(d.tags) && d.tags.length ? d.tags.map(normalize) : null,
    };

    // -----------------------------------
    // 🌍 Global discount
    // -----------------------------------
    if (!Array.isArray(d.creators) || d.creators.length === 0) {
      // Keep strongest global discount
      if (!response.global || d.percentOff > response.global.percentOff) {
        response.global = discountPayload;
      }
      continue;
    }

    // -----------------------------------
    // 👤 Creator-specific discounts
    // -----------------------------------
    for (const creator of d.creators) {
      const key = normalize(creator);
      if (!key) continue;

      if (!response.creators[key]) {
        response.creators[key] = [];
      }

      response.creators[key].push(discountPayload);
    }
  }

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      // 🚫 absolutely no caching
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
