import mongoose from "mongoose";

const PurchaseSchema = new mongoose.Schema(
  {
    // -------------------------
    // Core identifiers
    // -------------------------
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

    videoTitle: {
      type: String,
    },

    // -------------------------
    // Creator snapshot (important)
    // -------------------------
    creatorName: {
      type: String,
    },

    creatorTelegramId: {
      type: String,
    },

    creatorUrl: {
      type: String,
    },

    // -------------------------
    // Pricing snapshot (IMMUTABLE)
    // -------------------------
    basePrice: {
      type: Number,
      required: true,
    },

    finalPrice: {
      type: Number,
      required: true,
    },

    discountId: {
      type: String,
      default: null,
    },

    discountLabel: {
      type: String,
      default: null,
    },

    // Stripe amount in dollars (same as finalPrice)
    amount: {
      type: Number,
      required: true,
    },

    // -------------------------
    // Stripe / payment state
    // -------------------------
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

    email: {
      type: String,
    },

    // -------------------------
    // Secure access
    // -------------------------
    accessToken: {
      type: String,
      index: true,
    },

    accessTokenExpiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate purchases per user/video
PurchaseSchema.index({ userId: 1, videoId: 1 }, { unique: true });

export default mongoose.models.Purchase ||
  mongoose.model("Purchase", PurchaseSchema);
