import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
      index: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 180 },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    brand: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, required: true, maxlength: 4000 },
    price: { type: Number, required: true, min: 1 },
    discountPercent: { type: Number, default: 0, min: 0, max: 90 },
    salePrice: { type: Number, required: true, min: 1 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    sku: { type: String, default: "", trim: true },
    images: [{ type: String, required: true }],
    variants: [{ type: String, trim: true }],
    tags: [
      {
        type: String,
        enum: ["flash_sale", "trending", "best_selling", "new_arrival", "special_discount"],
      },
    ],
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    rejectionReason: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    ratingAvg: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    soldCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, collection: "Products" }
);

productSchema.index({ title: "text", brand: "text", description: "text" });

productSchema.pre("validate", function computeSalePrice(next) {
  if (typeof this.price === "number") {
    const disc = Math.min(90, Math.max(0, Number(this.discountPercent || 0)));
    this.discountPercent = disc;
    this.salePrice = Math.max(1, Math.round(this.price * (1 - disc / 100)));
  }
  next();
});

export const Product = mongoose.models.Product || mongoose.model("Product", productSchema);
