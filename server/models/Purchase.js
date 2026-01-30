const mongoose = require("mongoose");

const PurchaseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    cvDocument: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CVDocument",
      required: true,
    },
    template: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Template",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "USD",
    },
    provider: {
      type: String,
      enum: ["stripe", "paypal"],
      required: true,
    },
    paymentId: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    expiresAt: {
      type: Date,
      // Only applicable for Pro template purchases
    },
  },
  {
    timestamps: true,
  }
);

PurchaseSchema.index({ user: 1, cvDocument: 1 });

module.exports = mongoose.model("Purchase", PurchaseSchema);
