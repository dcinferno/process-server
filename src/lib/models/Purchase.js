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

    // 🔑 What kind of purchase this is
    type: {
      type: String,
      enum: ["video", "bundle"],
      required: true,
    },

    // -------------------------
    // Video purchase fields
    // -------------------------
    videoId: {
      type: String,
      index: true,
      required: function () {
        return this.type === "video";
      },
    },

    videoTitle: {
      type: String,
    },

    // -------------------------
    // Bundle purchase fields
    // -------------------------
    bundleId: {
      type: String,
      index: true,
      required: function () {
        return this.type === "bundle";
      },
    },

    // Videos unlocked by a bundle
    unlockedVideoIds: {
      type: [String],
      default: [],
      index: true,
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

    creatorId: {
      type: String,
      index: true,
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

    // Stripe amount in dollars
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

// --------------------------------------
// Indexes
// --------------------------------------

// Prevent duplicate VIDEO purchases
PurchaseSchema.index({ userId: 1, videoId: 1 }, { unique: true, sparse: true });

// Prevent duplicate BUNDLE purchases
PurchaseSchema.index(
  { userId: 1, bundleId: 1 },
  { unique: true, sparse: true }
);

export default mongoose.models.Purchase ||
  mongoose.model("Purchase", PurchaseSchema);
