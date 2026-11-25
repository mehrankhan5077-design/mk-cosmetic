import express from "express";
import { Banner } from "../models/Banner.js";
import { Category } from "../models/Category.js";
import { Product } from "../models/Product.js";
import { Seller } from "../models/Seller.js";
import { Review } from "../models/Review.js";
import { Coupon } from "../models/Coupon.js";
import { asyncHandler } from "../utils/helpers.js";
import { getMarketplaceSettings } from "../services/commissionService.js";
import { getGatewayCapabilities } from "../services/paymentService.js";

const router = express.Router();

const APPROVED_FILTER = { approvalStatus: "approved", isActive: true };

// GET /api/storefront/home
router.get(
  "/home",
  asyncHandler(async (_req, res) => {
    const approvedSellers = await Seller.find({ status: "approved" })
      .select("_id shopName slug logo banner city ratingAvg reviewCount isFeatured")
      .lean();
    const approvedSellerIds = approvedSellers.map((s) => s._id);

    const baseQuery = { ...APPROVED_FILTER, sellerId: { $in: approvedSellerIds } };

    const [
      banners,
      categories,
      flashSales,
      trending,
      bestSelling,
      newArrivals,
      specialDiscounts,
      recentReviews,
      settings,
    ] = await Promise.all([
      Banner.find({ isActive: true }).sort({ sortOrder: 1 }).lean(),
      Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean(),
      Product.find({ ...baseQuery, tags: "flash_sale" })
        .populate("categoryId", "name slug")
        .populate("sellerId", "shopName slug city ratingAvg")
        .sort({ discountPercent: -1 })
        .limit(8)
        .lean(),
      Product.find({ ...baseQuery, tags: "trending" })
        .populate("categoryId", "name slug")
        .populate("sellerId", "shopName slug city ratingAvg")
        .sort({ ratingAvg: -1, soldCount: -1 })
        .limit(8)
        .lean(),
      Product.find({ ...baseQuery, tags: "best_selling" })
        .populate("categoryId", "name slug")
        .populate("sellerId", "shopName slug city ratingAvg")
        .sort({ soldCount: -1 })
        .limit(8)
        .lean(),
      Product.find({ ...baseQuery })
        .populate("categoryId", "name slug")
        .populate("sellerId", "shopName slug city ratingAvg")
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
      Product.find({ ...baseQuery, discountPercent: { $gte: 15 } })
        .populate("categoryId", "name slug")
        .populate("sellerId", "shopName slug city ratingAvg")
        .sort({ discountPercent: -1 })
        .limit(8)
        .lean(),
      Review.find()
        .populate("customerId", "name")
        .populate("productId", "title slug images")
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
      getMarketplaceSettings(),
    ]);

    const featuredSellers = approvedSellers
      .sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || b.ratingAvg - a.ratingAvg)
      .slice(0, 6);

    res.json({
      banners,
      categories,
      flashSales,
      trending,
      bestSelling,
      newArrivals,
      specialDiscounts,
      featuredSellers,
      recentReviews,
      settings: {
        flatShippingFee: settings.flatShippingFee,
        freeShippingThreshold: settings.freeShippingThreshold,
      },
      paymentGateways: getGatewayCapabilities(),
    });
  })
);

// GET /api/storefront/search-suggestions?q=...
router.get(
  "/search-suggestions",
  asyncHandler(async (req, res) => {
    const q = String(req.query.q || "").trim();
    if (!q) {
      return res.json({ products: [], categories: [], sellers: [] });
    }
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const approvedSellerIds = (await Seller.find({ status: "approved" }).select("_id").lean()).map(
      (s) => s._id
    );

    const [products, categories, sellers] = await Promise.all([
      Product.find({
        ...APPROVED_FILTER,
        sellerId: { $in: approvedSellerIds },
        $or: [{ title: regex }, { brand: regex }],
      })
        .select("title slug brand salePrice price discountPercent images")
        .limit(6)
        .lean(),
      Category.find({ isActive: true, name: regex }).select("name slug").limit(4).lean(),
      Seller.find({ status: "approved", shopName: regex }).select("shopName slug city").limit(3).lean(),
    ]);

    res.json({ products, categories, sellers });
  })
);

// GET /api/storefront/products
router.get(
  "/products",
  asyncHandler(async (req, res) => {
    const {
      q = "",
      category = "",
      seller = "",
      tag = "",
      brand = "",
      minPrice,
      maxPrice,
      minDiscount,
      sort = "popular",
      page = 1,
      limit = 20,
    } = req.query;

    const approvedSellerIds = (await Seller.find({ status: "approved" }).select("_id").lean()).map(
      (s) => s._id
    );

    const filter = {
      ...APPROVED_FILTER,
      sellerId: { $in: approvedSellerIds },
    };

    if (q) {
      const regex = new RegExp(String(q).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ title: regex }, { brand: regex }, { description: regex }];
    }

    if (category) {
      const catDoc = await Category.findOne({ slug: String(category).toLowerCase() }).lean();
      if (catDoc) filter.categoryId = catDoc._id;
      else return res.json({ products: [], total: 0, page: 1, totalPages: 1 });
    }

    if (seller) {
      const sellerDoc = await Seller.findOne({
        slug: String(seller).toLowerCase(),
        status: "approved",
      }).lean();
      if (sellerDoc) filter.sellerId = sellerDoc._id;
      else return res.json({ products: [], total: 0, page: 1, totalPages: 1 });
    }

    if (tag) filter.tags = String(tag);
    if (brand) filter.brand = new RegExp(String(brand).trim(), "i");
    if (minDiscount) filter.discountPercent = { $gte: Number(minDiscount) };
    if (minPrice || maxPrice) {
      filter.salePrice = {};
      if (minPrice) filter.salePrice.$gte = Number(minPrice);
      if (maxPrice) filter.salePrice.$lte = Number(maxPrice);
    }

    const sortMap = {
      popular: { soldCount: -1, ratingAvg: -1 },
      newest: { createdAt: -1 },
      price_asc: { salePrice: 1 },
      price_desc: { salePrice: -1 },
      rating: { ratingAvg: -1, reviewCount: -1 },
      discount: { discountPercent: -1 },
    };

    const pageNum = Math.max(1, Number(page));
    const perPage = Math.min(48, Math.max(1, Number(limit)));

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("categoryId", "name slug")
        .populate("sellerId", "shopName slug city ratingAvg")
        .sort(sortMap[sort] || sortMap.popular)
        .skip((pageNum - 1) * perPage)
        .limit(perPage)
        .lean(),
      Product.countDocuments(filter),
    ]);

    res.json({
      products,
      total,
      page: pageNum,
      totalPages: Math.max(1, Math.ceil(total / perPage)),
    });
  })
);

// GET /api/storefront/products/:slug
router.get(
  "/products/:slug",
  asyncHandler(async (req, res) => {
    const product = await Product.findOne({ slug: req.params.slug, ...APPROVED_FILTER })
      .populate("categoryId", "name slug")
      .populate("sellerId", "shopName slug description logo city ratingAvg reviewCount status")
      .lean();

    if (!product || !product.sellerId || product.sellerId.status !== "approved") {
      return res.status(404).json({ error: "Product not found." });
    }

    const [reviews, relatedProducts] = await Promise.all([
      Review.find({ productId: product._id })
        .populate("customerId", "name")
        .sort({ createdAt: -1 })
        .lean(),
      Product.find({
        ...APPROVED_FILTER,
        categoryId: product.categoryId._id,
        _id: { $ne: product._id },
      })
        .populate("sellerId", "shopName slug")
        .limit(4)
        .lean(),
    ]);

    res.json({ product, reviews, relatedProducts });
  })
);

// GET /api/storefront/sellers/:slug
router.get(
  "/sellers/:slug",
  asyncHandler(async (req, res) => {
    const seller = await Seller.findOne({
      slug: req.params.slug,
      status: "approved",
    })
      .select("-payoutAccount -businessCnic")
      .lean();

    if (!seller) {
      return res.status(404).json({ error: "Seller shop not found." });
    }

    const products = await Product.find({ sellerId: seller._id, ...APPROVED_FILTER })
      .populate("categoryId", "name slug")
      .sort({ soldCount: -1, createdAt: -1 })
      .lean();

    res.json({ seller, products });
  })
);

// GET /api/storefront/categories
router.get(
  "/categories",
  asyncHandler(async (_req, res) => {
    const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean();
    res.json({ categories });
  })
);

// POST /api/storefront/coupons/validate
router.post(
  "/coupons/validate",
  asyncHandler(async (req, res) => {
    const { code, subtotal } = req.body;
    if (!code) {
      return res.status(400).json({ error: "Coupon code is required." });
    }
    const coupon = await Coupon.findOne({
      code: String(code).toUpperCase().trim(),
      isActive: true,
    }).lean();

    if (!coupon) {
      return res.status(404).json({ error: "Invalid coupon code." });
    }
    if (new Date(coupon.expiresAt) < new Date()) {
      return res.status(400).json({ error: "This coupon has expired." });
    }
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ error: "Coupon usage limit reached." });
    }
    const amount = Number(subtotal || 0);
    if (amount < coupon.minOrderAmount) {
      return res.status(400).json({
        error: `Minimum order of Rs. ${coupon.minOrderAmount.toLocaleString()} required for this coupon.`,
      });
    }

    let discountAmount =
      coupon.discountType === "percent"
        ? Math.round((amount * coupon.discountValue) / 100)
        : coupon.discountValue;

    if (coupon.maxDiscount > 0) {
      discountAmount = Math.min(discountAmount, coupon.maxDiscount);
    }
    discountAmount = Math.min(discountAmount, amount);

    res.json({
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        description: coupon.description,
      },
      discountAmount,
    });
  })
);

export default router;
