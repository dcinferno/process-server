export function computeFinalPrice(video) {
  let price = video.price;

  const now = new Date();
  const day = now.getDay(); // 0=Sun, 3=Wed, 4=Thu

  // 🍷 Thirsty Thursday — 25% off pudding
  if (day === 4 && video.creatorName?.toLowerCase().includes("pudding")) {
    price = price * 0.75;
  }

  // 🚗 Wagon Wednesday — fixed price
  if (day === 3 && video.tags?.includes("wagon")) {
    price = 13.34;
  }

  // Final safety
  price = Math.max(0, Number(price));

  // Stripe expects cents (rounded)
  return Math.round(price * 100);
}
