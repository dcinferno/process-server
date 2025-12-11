import mongoose from "mongoose";

const PurchaseSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    videoId: {
      type: String,
      required: true,
      index: true,
    },
    amount: {
      type: Number,
    },
    stripeEventId: {
      type: String,
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
      index: true,
    },
    purchasedAt: {
      type: Date,
      default: null,
    },
    creatorName: { type: String },
    creatorTelegramId: { type: String },
    creatorUrl: { type: String },
    videoTitle: { type: String },
    email: { type: String },
  },
  { timestamps: true }
);

PurchaseSchema.index({ userId: 1, videoId: 1 }, { unique: true });

export default mongoose.models.Purchase ||
  mongoose.model("Purchase", PurchaseSchema);
