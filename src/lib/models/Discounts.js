// lib/models/Discount.js
import mongoose from "mongoose";

const DiscountSchema = new mongoose.Schema({
  name: String, // "Christmas 50%"
  percentOff: Number, // 50
  creators: [String], // creatorName OR creatorId
  startsAt: Date,
  endsAt: Date,
  active: { type: Boolean, default: true },
});

export default mongoose.models.Discount ||
  mongoose.model("Discount", DiscountSchema);
