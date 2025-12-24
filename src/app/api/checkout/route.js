export async function POST(req) {
  console.log("🟢 CHECKOUT START");

  try {
    const body = await req.json();
    console.log("🟢 STEP 1 body", body);

    const { userId, videoId, site } = body;
    if (!userId || !videoId || !site) {
      console.error("🔴 STEP 1 FAIL missing fields");
      return new Response("Missing fields", { status: 400 });
    }

    await connectDB();
    console.log("🟢 STEP 2 DB connected");

    const videoRes = await fetch(
      `${allowedOrigin}/api/videos?id=${encodeURIComponent(videoId)}`
    );
    console.log("🟢 STEP 3 videoRes status", videoRes.status);

    const data = await videoRes.json();
    console.log("🟢 STEP 3 video payload", data);

    const video = data?.videos?.[0];
    if (!video) {
      console.error("🔴 STEP 3 FAIL no video");
      throw new Error("Video not found");
    }

    console.log("🟢 STEP 4 pricing check", {
      basePrice: video.basePrice,
      finalPrice: video.finalPrice,
    });

    const finalAmount = Math.round(video.finalPrice * 100);
    console.log("🟢 STEP 5 finalAmount", finalAmount);

    console.log("🟢 STEP 6 creating Stripe session");
    const session = await createCheckoutSession({
      finalAmount,
      successUrl: `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/post-checkout?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_API_BASE_URL}/cancel`,
      metadata: {
        userId: String(userId),
        videoId: String(videoId),
        site: String(site),
      },
    });

    console.log("🟢 STEP 6 Stripe session OK", session?.id);

    console.log("🟢 STEP 7 creating Purchase");
    await Purchase.create({
      userId,
      videoId,
      videoTitle: video.title,
      creatorName: video.creatorName,
      creatorTelegramId: video.creatorTelegramId,
      creatorUrl: video.socialMediaUrl,
      basePrice: video.basePrice,
      finalPrice: video.finalPrice,
      amount: video.finalPrice,
      stripeEventId: session.id,
      status: "pending",
      site,
    });

    console.log("🟢 CHECKOUT DONE");
    return Response.json({ url: session.url });
  } catch (err) {
    console.error("🔴 CHECKOUT FAILURE", err);
    return new Response("Checkout Error", { status: 500 });
  }
}
