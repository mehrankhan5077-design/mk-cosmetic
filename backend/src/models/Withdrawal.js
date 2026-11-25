import mongoose from "mongoose";

const withdrawalSchema = new mongoose.Schema(
  {
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "Seller", required: true, index: true },
    amount: { type: Number, required: true, min: 500 },
    method: {
      type: String,
      enum: ["BankTransfer", "JazzCash", "Easypaisa"],
      required: true,
    },
    accountDetails: {
      accountTitle: { type: String, required: true },
      accountNumber: { type: String, required: true },
      bankName: { type: String, default: "" },
      iban: { type: String, default: "" },
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "paid"],
      default: "pending",
      index: true,
    },
    payoutReference: { type: String, default: "" },
    adminNote: { type: String, default: "" },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    processedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "Withdrawals" }
);

export const Withdrawal = mongoose.models.Withdrawal || mongoose.model("Withdrawal", withdrawalSchema);
