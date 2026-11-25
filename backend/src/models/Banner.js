import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, default: "", trim: true },
    badgeText: { type: String, default: "LIMITED OFFER", trim: true },
    ctaText: { type: String, default: "Shop Now", trim: true },
    ctaLink: { type: String, default: "/shop", trim: true },
    image: { type: String, default: "" },
    themeColor: { type: String, default: "#db2777" },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "Banners" }
);

export const Banner = mongoose.models.Banner || mongoose.model("Banner", bannerSchema);
