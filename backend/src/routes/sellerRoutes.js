import express from "express";
import { Product } from "../models/Product.js";
import { Suborder, ORDER_STATUSES } from "../models/Suborder.js";
import { Commission } from "../models/Commission.js";
import { Withdrawal } from "../models/Withdrawal.js";
import { Seller } from "../models/Seller.js";
import {
  attachSellerProfile,
  requireApprovedSeller,
  requireAuth,
  requireRole,
} from "../middleware/auth.js";
import {
  getMarketplaceSettings,
  resolveCommissionRate,
  syncCommissionOnStatusChange,
} from "../services/commissionService.js";
import { asyncHandler, uniqueSlug } from "../utils/helpers.js";

const router = express.Router();

router.use(requireAuth, requireRole("seller"), attachSellerProfile);

// GET /api/seller/dashboard
router.get(
  "/dashboard",
  asyncHandler(async (req, res) => {
    const seller = req.seller;
    const effectiveCommissionRate = await resolveCommissionRate(seller);

    const [
      totalProducts,
      approvedProducts,
      pendingProducts,
      suborders,
      commissions,
      withdrawals,
      settings,
    ] = await Promise.all([
      Product.countDocuments({ sellerId: seller._id }),
      Product.countDocuments({ sellerId: seller._id, approvalStatus: "approved" }),
      Product.countDocuments({ sellerId: seller._id, approvalStatus: "pending" }),
      Suborder.find({ sellerId: seller._id }).sort({ createdAt: -1 }).lean(),
      Commission.find({ sellerId: seller._id }).sort({ createdAt: -1 }).limit(20).lean(),
      Withdrawal.find({ sellerId: seller._id }).sort({ createdAt: -1 }).lean(),
      getMarketplaceSettings(),
    ]);

    const totalOrders = suborders.length;
    const pendingOrders = suborders.filter((s) =>
      ["Pending", "Confirmed", "Processing", "Shipped", "Out for Delivery"].includes(s.status)
    ).length;
    const completedOrders = suborders.filter((s) => s.status === "Delivered").length;
    const totalSales = suborders
      .filter((s) => !["Cancelled", "Returned"].includes(s.status))
      .reduce((acc, s) => acc + s.subtotal - s.discountShare, 0);

    // Real sales analytics over the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const dailyMap = new Map();
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      dailyMap.set(key, { date: key, sales: 0, orders: 0, earnings: 0 });
    }

    for (const sub of suborders) {
      if (["Cancelled", "Returned"].includes(sub.status)) continue;
      const key = new Date(sub.createdAt).toISOString().slice(0, 10);
      if (dailyMap.has(key)) {
        const entry = dailyMap.get(key);
        entry.sales += sub.subtotal - sub.discountShare;
        entry.earnings += sub.sellerEarnings;
        entry.orders += 1;
      }
    }

    res.json({
      seller,
      effectiveCommissionRate,
      minWithdrawalAmount: settings.minWithdrawalAmount,
      stats: {
        totalSales,
        totalOrders,
        totalProducts,
        approvedProducts,
        pendingProducts,
        pendingOrders,
        completedOrders,
        availableBalance: seller.availableBalance,
        pendingBalance: seller.pendingBalance,
        totalEarnings: seller.totalEarnings,
        totalWithdrawn: seller.totalWithdrawn,
      },
      analytics: Array.from(dailyMap.values()),
      recentOrders: suborders.slice(0, 10),
      commissions,
      withdrawals,
    });
  })
);

// GET /api/seller/products
router.get(
  "/products",
  asyncHandler(async (req, res) => {
    const products = await Product.find({ sellerId: req.seller._id })
      .populate("categoryId", "name slug")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ products });
  })
);

// POST /api/seller/products (Upload new product -> pending Admin approval)
router.post(
  "/products",
  requireApprovedSeller,
  asyncHandler(async (req, res) => {
    const {
      title,
      categoryId,
      brand,
      description,
      price,
      discountPercent = 0,
      stock = 0,
      sku = "",
      images = [],
      variants = [],
      tags = [],
    } = req.body;

    if (!title || !categoryId || !brand || !description || !price) {
      return res.status(400).json({
        error: "Title, category, brand, description, and price are required.",
      });
    }
    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: "Please upload at least one product image." });
    }

    const product = await Product.create({
      sellerId: req.seller._id,
      categoryId,
      title: String(title).trim(),
      slug: uniqueSlug(title),
      brand: String(brand).trim(),
      description: String(description).trim(),
      price: Number(price),
      discountPercent: Number(discountPercent || 0),
      salePrice: Number(price),
      stock: Math.max(0, Number(stock || 0)),
      sku: String(sku || "").trim(),
      images,
      variants: Array.isArray(variants) ? variants : [],
      tags: Array.isArray(tags) ? tags : ["new_arrival"],
      approvalStatus: "pending",
    });

    res.status(201).json({ product });
  })
);

// PATCH /api/seller/products/:id (Edit inventory, discount, price, description)
router.patch(
  "/products/:id",
  requireApprovedSeller,
  asyncHandler(async (req, res) => {
    const product = await Product.findOne({ _id: req.params.id, sellerId: req.seller._id });
    if (!product) {
      return res.status(404).json({ error: "Product not found in your shop." });
    }

    const editable = [
      "title",
      "categoryId",
      "brand",
      "description",
      "price",
      "discountPercent",
      "stock",
      "sku",
      "images",
      "variants",
      "tags",
      "isActive",
    ];
    for (const key of editable) {
      if (req.body[key] !== undefined) {
        product[key] = req.body[key];
      }
    }

    await product.save();
    res.json({ product });
  })
);

// DELETE /api/seller/products/:id
router.delete(
  "/products/:id",
  requireApprovedSeller,
  asyncHandler(async (req, res) => {
    const deleted = await Product.findOneAndDelete({
      _id: req.params.id,
      sellerId: req.seller._id,
    });
    if (!deleted) {
      return res.status(404).json({ error: "Product not found." });
    }
    res.json({ ok: true });
  })
);

// GET /api/seller/orders
router.get(
  "/orders",
  asyncHandler(async (req, res) => {
    const suborders = await Suborder.find({ sellerId: req.seller._id })
      .populate("orderId", "orderNumber shippingAddress paymentMethod paymentStatus createdAt")
      .populate("customerId", "name email phone")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ suborders });
  })
);

// PATCH /api/seller/orders/:suborderId/status
router.patch(
  "/orders/:suborderId/status",
  requireApprovedSeller,
  asyncHandler(async (req, res) => {
    const { status, trackingNumber, courierName, note } = req.body;
    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ error: "Invalid order status." });
    }

    const suborder = await Suborder.findOne({
      _id: req.params.suborderId,
      sellerId: req.seller._id,
    });
    if (!suborder) {
      return res.status(404).json({ error: "Suborder not found." });
    }

    const prevStatus = suborder.status;
    suborder.status = status;
    if (trackingNumber !== undefined) suborder.trackingNumber = trackingNumber;
    if (courierName !== undefined) suborder.courierName = courierName;
    suborder.statusHistory.push({
      status,
      note: note || `Updated to ${status} by seller`,
      updatedByRole: "seller",
    });
    await suborder.save();

    if (prevStatus !== status) {
      await syncCommissionOnStatusChange(suborder, prevStatus, status);
    }

    res.json({ suborder });
  })
);

// GET /api/seller/profile & PATCH /api/seller/profile
router.get(
  "/profile",
  asyncHandler(async (req, res) => {
    res.json({ seller: req.seller });
  })
);

router.patch(
  "/profile",
  asyncHandler(async (req, res) => {
    const seller = await Seller.findById(req.seller._id);
    const fields = ["shopName", "description", "city", "phone", "logo", "banner", "payoutAccount"];
    for (const f of fields) {
      if (req.body[f] !== undefined) {
        seller[f] = req.body[f];
      }
    }
    await seller.save();
    res.json({ seller });
  })
);

// POST /api/seller/withdrawals
router.post(
  "/withdrawals",
  requireApprovedSeller,
  asyncHandler(async (req, res) => {
    const amount = Number(req.body.amount || 0);
    const method = req.body.method || req.seller.payoutAccount?.preferredMethod || "BankTransfer";
    const settings = await getMarketplaceSettings();

    if (amount < settings.minWithdrawalAmount) {
      return res.status(400).json({
        error: `Minimum withdrawal amount is Rs. ${settings.minWithdrawalAmount.toLocaleString()}.`,
      });
    }

    const seller = await Seller.findById(req.seller._id);
    if (seller.availableBalance < amount) {
      return res.status(400).json({
        error: `Insufficient available balance (Rs. ${seller.availableBalance.toLocaleString()}).`,
      });
    }

    const accountDetails = req.body.accountDetails || seller.payoutAccount;
    if (!accountDetails || !accountDetails.accountTitle || !accountDetails.accountNumber) {
      return res.status(400).json({
        error: "Payout account title and account number are required.",
      });
    }

    seller.availableBalance -= amount;
    await seller.save();

    const withdrawal = await Withdrawal.create({
      sellerId: seller._id,
      amount,
      method,
      accountDetails: {
        accountTitle: accountDetails.accountTitle,
        accountNumber: accountDetails.accountNumber,
        bankName: accountDetails.bankName || "",
        iban: accountDetails.iban || "",
      },
      status: "pending",
    });

    res.status(201).json({ withdrawal, availableBalance: seller.availableBalance });
  })
);

export default router;
