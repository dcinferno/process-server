// lib/models/Request.js
import mongoose from "mongoose";

const RequestSchema = new mongoose.Schema({
  clientName: String,
  email: String,
  phone: String,
  recipientName: String,
  recipientAddress: String,
  priority: String,
  status: {
    type: String,
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Request ||
  mongoose.model("Request", RequestSchema);
