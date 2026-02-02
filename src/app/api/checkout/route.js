export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { connectDB } from "../../../lib/db";
import Purchase from "../../../lib/models/Purchase";
import { createCheckoutSession } from "../../../lib/createCheckoutSession";

const allowedOrigin = process.env.NEXT_PUBLIC_FRONTEND_URL;

/* ------------------------------------------
   CORS
------------------------------------------- */
function corsHeaders(req) {
  const origin = req.headers.get("origin");
  if (!origin) return {};

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

/* ------------------------------------------
   OPTIONS
------------------------------------------- */
export async function OPTIONS(req) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(req),
  });
}

/* ------------------------------------------
   POST
------------------------------------------- */
export async function POST(req) {
  try {
    const body = await req.json();
    const { userId, videoId, bundleId, site } = body;

    // -------------------------
    // 0️⃣ Validate input
    // -------------------------
    if (!userId || (!videoId && !bundleId) || !site) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders(req),
        },
      });
    }

    await connectDB();
    // ==================================================
    // 🧺 BUNDLE CHECKOUT FLOW (NEW)
    // ==================================================
    if (bundleId) {
      // ----------------------------------
      // A️⃣ Fetch bundle from APP server
      // ----------------------------------
      const bundleRes = await fetch(
        `${allowedOrigin}/api/bundle?id=${bundleId}`,
        {
          cache: "no-store",
        }
      );
      if (!bundleRes.ok) {
        return new Response(JSON.stringify({ error: "Invalid bundle" }), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders(req),
          },
        });
      }

      const bundleData = await bundleRes.json();
      const bundle = Array.isArray(bundleData) ? bundleData[0] : bundleData;

      if (!bundle) {
        return new Response(JSON.stringify({ error: "Invalid bundle" }), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders(req),
          },
        });
      }

      const videoIds = Array.isArray(bundle.videoIds)
        ? bundle.videoIds.map((v) => v.toString())
        : [];

      const price = Number(bundle.price);

      if (videoIds.length === 0 || Number.isNaN(price)) {
        return new Response(JSON.stringify({ error: "Invalid bundle data" }), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders(req),
          },
        });
      }

      // ----------------------------------
      // B️⃣ Prevent duplicate paid bundle
      // ----------------------------------
      const existing = await Purchase.findOne({
        userId,
        bundleId,
        status: "paid",
      });

      if (existing) {
        return new Response(
          JSON.stringify({
            error: "Bundle already purchased",
            purchased: true,
          }),
          {
            status: 409,
            headers: corsHeaders(req),
          }
        );
      }

      // ----------------------------------
      // C️⃣ Create / reuse pending purchase
      // ----------------------------------
      let purchase = await Purchase.findOne({
        userId,
        bundleId,
        status: "pending",
      });

      if (!purchase) {
        purchase = await Purchase.create({
          userId,
          bundleId,
          type: "bundle",

          unlockedVideoIds: videoIds,
          amount: price,
          basePrice: price,
          finalPrice: price,
          creatorName: bundle.creatorName,
          creatorTelegramId: bundle.creatorTelegramId || "",
          creatorUrl: bundle.creatorUrl || "",
          status: "pending",
          site,
        });
      }

      const finalAmount = Math.round(bundle.price * 100);

      // ----------------------------------
      // D️⃣ Stripe session (purchaseId only)
      // ----------------------------------
      const session = await createCheckoutSession({
        finalAmount,
        successUrl: `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/post-checkout?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${process.env.NEXT_PUBLIC_API_BASE_URL}/cancel`,
        metadata: {
          purchaseId: purchase._id.toString(),
          userId,
          site,
        },
      });

      if (!session?.id || !session?.url) {
        throw new Error("Stripe session failed");
      }

      purchase.stripeEventId = session.id;
      await purchase.save();

      return new Response(JSON.stringify({ url: session.url }), {
        status: 200,
        headers: corsHeaders(req),
      });
    }

    // -------------------------
    // 1️⃣ Prevent duplicate paid purchases
    // -------------------------
    const existing = await Purchase.findOne({
      userId,
      videoId,
      status: "paid",
    });

    if (existing) {
      return new Response(
        JSON.stringify({ error: "Already purchased", purchased: true }),
        {
          status: 409,
          headers: corsHeaders(req),
        }
      );
    }

    // -------------------------
    // 2️⃣ Fetch SINGLE video (already priced)
    // -------------------------
    const videoRes = await fetch(`${allowedOrigin}/api/internal/videos/${videoId}`, {
      cache: "no-store",
    });

    if (!videoRes.ok) {
      throw new Error("Video not found");
    }

    const video = await videoRes.json();

    if (
      typeof video.basePrice !== "number" ||
      typeof video.finalPrice !== "number"
    ) {
      throw new Error("Invalid video pricing");
    }

    // -------------------------
    // 3️⃣ Prepare pricing (NO recompute)
    // -------------------------
    const basePrice =
      typeof video.basePrice === "number"
        ? video.basePrice
        : Number(video.price) || 0;

    const finalPrice =
      typeof video.finalPrice === "number" ? video.finalPrice : basePrice;

    if (finalPrice <= 0) {
      throw new Error("Invalid final price");
    }

    const pricing = {
      basePrice,
      finalPrice,
      discountId: video.discount?.id ?? null,
      discountLabel: video.discount?.name ?? null,
    };

    const finalAmount = Math.round(finalPrice * 100);

    if (finalAmount <= 0) {
      throw new Error("Invalid Stripe amount");
    }

    // -------------------------
    // 4️⃣ Create / reuse pending purchase FIRST
    // -------------------------
    let purchase = await Purchase.findOne({
      userId,
      videoId,
      status: "pending",
    });

    if (!purchase) {
      purchase = await Purchase.create({
        userId,
        videoId,
        videoTitle: video.title,
        type: "video",
        creatorName: video.creatorName,
        creatorTelegramId: video.creatorTelegramId,
        creatorUrl: video.socialMediaUrl,

        basePrice,
        finalPrice,
        discountId: pricing.discountId,
        discountLabel: pricing.discountLabel,

        amount: finalPrice,
        status: "pending",
        site,
      });
    } else {
      // Backfill safety
      purchase.basePrice = basePrice;
      purchase.finalPrice = finalPrice;
      purchase.amount = finalPrice;
      purchase.discountId = pricing.discountId;
      purchase.discountLabel = pricing.discountLabel;
      purchase.site = site;
      await purchase.save();
    }

    // -------------------------
    // 5️⃣ Create Stripe session WITH purchaseId
    // -------------------------
    const session = await createCheckoutSession({
      finalAmount,
      successUrl: `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/post-checkout?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_API_BASE_URL}/cancel`,
      metadata: {
        purchaseId: purchase._id.toString(), // 🔑 GUARANTEED
        userId,
        videoId,
        site,
      },
    });

    if (!session?.id || !session?.url) {
      throw new Error("Stripe session failed");
    }

    // Attach Stripe session ID to purchase
    purchase.stripeEventId = session.id;
    await purchase.save();

    // -------------------------
    // 6️⃣ Return Stripe URL
    // -------------------------
    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: corsHeaders(req),
    });
  } catch (err) {
    console.error("❌ Checkout error:", err);

    return new Response(JSON.stringify({ error: "Checkout Error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders(req),
      },
    });
  }
}
