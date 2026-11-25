import mongoose from "mongoose";

const settingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: "global" },
    defaultCommissionRate: { type: Number, default: 10, min: 0, max: 60 },
    flatShippingFee: { type: Number, default: 200, min: 0 },
    freeShippingThreshold: { type: Number, default: 3500, min: 0 },
    minWithdrawalAmount: { type: Number, default: 1000, min: 100 },
  },
  { timestamps: true, collection: "Settings" }
);

export const MarketplaceSetting =
  mongoose.models.MarketplaceSetting || mongoose.model("MarketplaceSetting", settingSchema);
