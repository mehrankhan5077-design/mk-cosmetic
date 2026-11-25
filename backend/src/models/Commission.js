import mongoose from "mongoose";

const commissionSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    suborderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Suborder",
      required: true,
      unique: true,
      index: true,
    },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "Seller", required: true, index: true },
    grossAmount: { type: Number, required: true, min: 0 },
    commissionRate: { type: Number, required: true, min: 0 },
    commissionAmount: { type: Number, required: true, min: 0 },
    sellerEarnings: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pending", "credited", "reversed"],
      default: "pending",
      index: true,
    },
    creditedAt: { type: Date, default: null },
    reversedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "Commissions" }
);

export const Commission = mongoose.models.Commission || mongoose.model("Commission", commissionSchema);
