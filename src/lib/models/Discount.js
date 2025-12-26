// lib/models/Discount.js
import mongoose from "mongoose";

const { Schema } = mongoose;

const DiscountSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["fixed", "percent"],
    },
    percentOff: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },

    // Can be creatorName OR creatorId (string-based, as you intended)
    creators: {
      type: [String],
      default: [],
      index: true,
    },
    tags: {
      type: [String],
      required: false, // e.g. ["christmas"]
    },
    startsAt: {
      type: Date,
      required: true,
    },

    endsAt: {
      type: Date,
      required: true,
    },

    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true, // createdAt / updatedAt
  }
);

// Optional: prevent overlapping invalid ranges
DiscountSchema.pre("save", function (next) {
  if (this.endsAt <= this.startsAt) {
    return next(new Error("endsAt must be after startsAt"));
  }
  next();
});

export default mongoose.models.Discount ||
  mongoose.model("Discount", DiscountSchema);
