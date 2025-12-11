import mongoose from "mongoose";

const PurchaseSchema = new mongoose.Schema(
  {
    userId: {
      type: String, // using String because users are anonymous
      required: true,
      index: true,
    },
    videoId: {
      type: String, // your video IDs are strings (Mongo _id)
      required: true,
      index: true,
    },
    amount: {
      type: Number, // store the purchase amount (optional)
      required: false,
    },
    stripeEventId: {
      type: String,
      required: true,
      index: true, // ✅ important for performance + dedupe
    },
    purchasedAt: {
      type: Date,
      default: Date.now,
    },
    email: { type: String },
  },
  { timestamps: true }
);

// Prevents duplicate purchases for the same user & video
PurchaseSchema.index(
  { userId: 1, videoId: 1, stripeEventId: 1 },
  { unique: true }
);

export default mongoose.models.Purchase ||
  mongoose.model("Purchase", PurchaseSchema);
