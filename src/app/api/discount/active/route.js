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

  /*
    Goal:
    {
      global: { percentOff },
      creators: {
        "don dada": { percentOff }
      }
    }
  */

  const response = {
    global: null,
    creators: {},
  };

  for (const d of discounts) {
    // Global discount (no creators array or empty)
    if (!Array.isArray(d.creators) || d.creators.length === 0) {
      // pick the strongest global discount
      if (!response.global || d.percentOff > response.global.percentOff) {
        response.global = {
          name: d.name,
          percentOff: d.percentOff,
        };
      }
      continue;
    }

    // Creator-specific discounts
    for (const creator of d.creators) {
      const key = normalize(creator);
      if (!key) continue;

      const existing = response.creators[key];

      // keep the strongest discount per creator
      if (!existing || d.percentOff > existing.percentOff) {
        response.creators[key] = {
          name: d.name,
          type: d.type,
          percentOff: d.percentOff,
        };
      }
    }
  }

  return Response.json(response);
}
