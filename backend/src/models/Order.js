import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      city: { type: String, required: true },
      area: { type: String, required: true },
      streetAddress: { type: String, required: true },
      postalCode: { type: String, default: "" },
    },
    paymentMethod: {
      type: String,
      enum: ["COD", "JazzCash", "Easypaisa", "BankTransfer"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "awaiting_verification", "paid", "failed", "refunded"],
      default: "pending",
    },
    subtotal: { type: Number, required: true, min: 0 },
    couponCode: { type: String, default: "" },
    discountAmount: { type: Number, default: 0, min: 0 },
    shippingFee: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    suborderIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Suborder" }],
  },
  { timestamps: true, collection: "Orders" }
);

export const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
