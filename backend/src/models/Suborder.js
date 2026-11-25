import mongoose from "mongoose";

export const ORDER_STATUSES = [
  "Pending",
  "Confirmed",
  "Processing",
  "Shipped",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
  "Returned",
];

const suborderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    title: { type: String, required: true },
    image: { type: String, default: "" },
    variant: { type: String, default: "" },
    qty: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, enum: ORDER_STATUSES, required: true },
    note: { type: String, default: "" },
    updatedByRole: { type: String, enum: ["admin", "seller", "customer", "system"], default: "system" },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const suborderSchema = new mongoose.Schema(
  {
    suborderNumber: { type: String, required: true, unique: true, index: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "Seller", required: true, index: true },
    items: [suborderItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    discountShare: { type: Number, default: 0, min: 0 },
    commissionRate: { type: Number, required: true, min: 0 },
    commissionAmount: { type: Number, required: true, min: 0 },
    sellerEarnings: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: "Pending",
      index: true,
    },
    trackingNumber: { type: String, default: "" },
    courierName: { type: String, default: "" },
    statusHistory: [statusHistorySchema],
  },
  { timestamps: true, collection: "Suborders" }
);

export const Suborder = mongoose.models.Suborder || mongoose.model("Suborder", suborderSchema);
