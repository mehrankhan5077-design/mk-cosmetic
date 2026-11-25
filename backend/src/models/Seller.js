import mongoose from "mongoose";

const sellerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    shopName: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    description: { type: String, default: "", maxlength: 1000 },
    logo: { type: String, default: "" },
    banner: { type: String, default: "" },
    city: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    businessCnic: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "suspended"],
      default: "pending",
      index: true,
    },
    statusReason: { type: String, default: "" },
    // Null means inherit marketplace default commission rate
    commissionRate: { type: Number, min: 0, max: 60, default: null },
    payoutAccount: {
      preferredMethod: {
        type: String,
        enum: ["BankTransfer", "JazzCash", "Easypaisa"],
        default: "BankTransfer",
      },
      accountTitle: { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      bankName: { type: String, default: "" },
      iban: { type: String, default: "" },
    },
    availableBalance: { type: Number, default: 0, min: 0 },
    pendingBalance: { type: Number, default: 0, min: 0 },
    totalEarnings: { type: Number, default: 0, min: 0 },
    totalWithdrawn: { type: Number, default: 0, min: 0 },
    ratingAvg: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "Sellers" }
);

export const Seller = mongoose.models.Seller || mongoose.model("Seller", sellerSchema);
