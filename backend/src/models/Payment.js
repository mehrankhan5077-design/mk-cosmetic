import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    method: {
      type: String,
      enum: ["COD", "JazzCash", "Easypaisa", "BankTransfer"],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "PKR" },
    status: {
      type: String,
      enum: ["pending", "awaiting_verification", "paid", "failed", "refunded"],
      default: "pending",
      index: true,
    },
    gatewayConfigured: { type: Boolean, default: true },
    gatewayProvider: { type: String, default: "COD" },
    transactionRef: { type: String, default: "" },
    proofNote: { type: String, default: "" },
    verifiedByAdminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    paidAt: { type: Date, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, collection: "Payments" }
);

export const Payment = mongoose.models.Payment || mongoose.model("Payment", paymentSchema);
