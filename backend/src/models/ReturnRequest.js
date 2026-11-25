import mongoose from "mongoose";

const returnSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    suborderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Suborder",
      required: true,
      unique: true,
      index: true,
    },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "Seller", required: true, index: true },
    reason: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, trim: true, maxlength: 1500 },
    refundAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["requested", "approved", "rejected", "refunded"],
      default: "requested",
      index: true,
    },
    adminNote: { type: String, default: "" },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "Returns" }
);

export const ReturnRequest = mongoose.models.ReturnRequest || mongoose.model("ReturnRequest", returnSchema);
