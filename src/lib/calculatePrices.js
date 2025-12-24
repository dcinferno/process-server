import Discount from "@/lib/models/Discount";

export async function computeFinalPrice(video) {
  let price = Number(video.price);
  if (!price || price <= 0) return 0;

  const now = new Date();

  const discount = await Discount.findOne({
    active: true,
    creators: video.creatorName,
    startsAt: { $lte: now },
    endsAt: { $gte: now },
  }).lean();

  if (discount?.percentOff) {
    price = price * (1 - discount.percentOff / 100);
  }

  price = Math.max(0, Number(price));
  return Math.round(price * 100); // cents
}
