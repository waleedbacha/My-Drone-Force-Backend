const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    stripePaymentIntentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      description: "Amount in cents (e.g., 150000 = $1,500)",
    },
    currency: {
      type: String,
      default: "usd",
      uppercase: true,
    },
    status: {
      type: String,
      enum: ["pending", "succeeded", "failed", "refunded"],
      default: "pending",
      index: true,
    },
    paymentMethodType: {
      type: String,
      default: "card",
    },
    customerEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },
    customerName: {
      type: String,
      trim: true,
    },
    receiptUrl: {
      type: String,
      default: "",
    },
    // Refund fields
    refundedAt: {
      type: Date,
    },
    refundAmount: {
      type: Number,
      default: 0,
      description: "Amount refunded in cents",
    },
    refundReason: {
      type: String,
      default: "",
    },
    // Timestamps
    paidAt: {
      type: Date,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

// Compound index for faster queries
paymentSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model("Payment", paymentSchema);
