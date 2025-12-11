import mongoose from "mongoose";

const WebhookEventSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true },
    type: { type: String, required: true },
    livemode: { type: Boolean, required: true },
    processed: { type: Boolean, default: false },
    error: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.WebhookEvent ||
  mongoose.model("WebhookEvent", WebhookEventSchema);
