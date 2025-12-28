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

  const discounts = await Discount.find({
    active: true,
    startsAt: { $lte: now },
    endsAt: { $gte: now },
  }).lean();

  const response = {
    global: [],
    creators: {},
  };

  for (const d of discounts) {
    const payload = {
      name: d.name,
      type: d.type, // percentage | fixed | amount
      percentOff: d.percentOff ?? null,
      fixedPrice: d.fixedPrice ?? null,
      amountOff: d.amountOff ?? null,
      tags:
        Array.isArray(d.tags) && d.tags.length ? d.tags.map(normalize) : null,
    };

    // -----------------------------------
    // 🌍 Global discount
    // -----------------------------------
    if (!Array.isArray(d.creators) || d.creators.length === 0) {
      response.global.push(payload);
      continue;
    }

    // -----------------------------------
    // 👤 Creator discounts
    // -----------------------------------
    for (const creator of d.creators) {
      const key = normalize(creator);
      if (!key) continue;

      if (!response.creators[key]) {
        response.creators[key] = [];
      }

      response.creators[key].push(payload);
    }
  }

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
