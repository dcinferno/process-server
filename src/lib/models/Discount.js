import mongoose from "mongoose";

const DiscountSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["percentage", "fixed", "amount"],
      required: true,
    },

    // % off
    percentOff: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },

    // 💲 flat final price
    fixedPrice: {
      type: Number,
      min: 0,
      default: null,
    },

    // 💲 dollars off
    amountOff: {
      type: Number,
      min: 0,
      default: null,
    },

    // creators this applies to (empty = global)
    creators: {
      type: [String],
      default: [],
    },

    // optional tag scoping
    tags: {
      type: [String],
      default: null,
    },

    // 🔴 REQUIRED BY YOUR API
    active: {
      type: Boolean,
      default: false,
      index: true,
    },

    startsAt: {
      type: Date,
      required: true,
      index: true,
    },

    endsAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Discount ||
  mongoose.model("Discount", DiscountSchema);
