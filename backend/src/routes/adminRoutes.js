import express from "express";
import { User } from "../models/User.js";
import { Seller } from "../models/Seller.js";
import { Product } from "../models/Product.js";
import { Category } from "../models/Category.js";
import { Order } from "../models/Order.js";
import { Suborder, ORDER_STATUSES } from "../models/Suborder.js";
import { Payment } from "../models/Payment.js";
import { Commission } from "../models/Commission.js";
import { Withdrawal } from "../models/Withdrawal.js";
import { Banner } from "../models/Banner.js";
import { Coupon } from "../models/Coupon.js";
import { ReturnRequest } from "../models/ReturnRequest.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  getMarketplaceSettings,
  syncCommissionOnStatusChange,
} from "../services/commissionService.js";
import { asyncHandler, slugify } from "../utils/helpers.js";

const router = express.Router();

router.use(requireAuth, requireRole("admin"));

// GET /api/admin/dashboard (Real aggregated marketplace analytics & daily/weekly/monthly reports)
router.get(
  "/dashboard",
  asyncHandler(async (_req, res) => {
    const [
      totalSellers,
      pendingSellers,
      totalCustomers,
      totalProducts,
      pendingProducts,
      totalOrders,
      pendingWithdrawals,
      pendingReturns,
      settings,
      allSuborders,
      allCommissions,
    ] = await Promise.all([
      Seller.countDocuments(),
      Seller.countDocuments({ status: "pending" }),
      User.countDocuments({ role: "customer" }),
      Product.countDocuments(),
      Product.countDocuments({ approvalStatus: "pending" }),
      Order.countDocuments(),
      Withdrawal.countDocuments({ status: "pending" }),
      ReturnRequest.countDocuments({ status: "requested" }),
      getMarketplaceSettings(),
      Suborder.find().select("subtotal discountShare commissionAmount sellerEarnings status createdAt").lean(),
      Commission.find().select("commissionAmount sellerEarnings status createdAt").lean(),
    ]);

    const validSuborders = allSuborders.filter(
      (s) => !["Cancelled", "Returned"].includes(s.status)
    );
    const totalMarketplaceGmv = validSuborders.reduce(
      (acc, s) => acc + (s.subtotal - s.discountShare),
      0
    );
    const totalCommissionRevenue = allCommissions
      .filter((c) => c.status !== "reversed")
      .reduce((acc, c) => acc + c.commissionAmount, 0);

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - 6);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const computeWindow = (since) => {
      const list = validSuborders.filter((s) => new Date(s.createdAt) >= since);
      return {
        orders: list.length,
        gmv: list.reduce((a, b) => a + (b.subtotal - b.discountShare), 0),
        commission: list.reduce((a, b) => a + b.commissionAmount, 0),
      };
    };

    const reports = {
      daily: computeWindow(startOfDay),
      weekly: computeWindow(startOfWeek),
      monthly: computeWindow(startOfMonth),
    };

    res.json({
      overview: {
        totalMarketplaceGmv,
        totalCommissionRevenue,
        totalOrders,
        totalSellers,
        pendingSellers,
        totalCustomers,
        totalProducts,
        pendingProducts,
        pendingWithdrawals,
        pendingReturns,
      },
      reports,
      settings,
    });
  })
);

// Settings & Global Commission
router.get(
  "/settings",
  asyncHandler(async (_req, res) => {
    const settings = await getMarketplaceSettings();
    res.json({ settings });
  })
);

router.patch(
  "/settings",
  asyncHandler(async (req, res) => {
    const settings = await getMarketplaceSettings();
    const allowed = [
      "defaultCommissionRate",
      "flatShippingFee",
      "freeShippingThreshold",
      "minWithdrawalAmount",
    ];
    for (const k of allowed) {
      if (req.body[k] !== undefined) {
        settings[k] = Number(req.body[k]);
      }
    }
    await settings.save();
    res.json({ settings });
  })
);

// Sellers Management
router.get(
  "/sellers",
  asyncHandler(async (_req, res) => {
    const sellers = await Seller.find()
      .populate("userId", "name email phone isActive")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ sellers });
  })
);

router.patch(
  "/sellers/:id",
  asyncHandler(async (req, res) => {
    const seller = await Seller.findById(req.params.id);
    if (!seller) return res.status(404).json({ error: "Seller not found." });

    const { status, statusReason, commissionRate, isFeatured } = req.body;
    if (status && ["pending", "approved", "rejected", "suspended"].includes(status)) {
      seller.status = status;
    }
    if (statusReason !== undefined) seller.statusReason = statusReason;
    if (commissionRate !== undefined) {
      seller.commissionRate = commissionRate === null || commissionRate === "" ? null : Number(commissionRate);
    }
    if (isFeatured !== undefined) seller.isFeatured = Boolean(isFeatured);

    await seller.save();
    res.json({ seller });
  })
);

// Customers Management
router.get(
  "/customers",
  asyncHandler(async (_req, res) => {
    const customers = await User.find({ role: "customer" }).sort({ createdAt: -1 }).lean();
    res.json({ customers });
  })
);

router.patch(
  "/customers/:id",
  asyncHandler(async (req, res) => {
    const customer = await User.findOneAndUpdate(
      { _id: req.params.id, role: "customer" },
      { isActive: Boolean(req.body.isActive) },
      { new: true }
    );
    if (!customer) return res.status(404).json({ error: "Customer not found." });
    res.json({ customer });
  })
);

// Products Approval & Management
router.get(
  "/products",
  asyncHandler(async (_req, res) => {
    const products = await Product.find()
      .populate("sellerId", "shopName slug")
      .populate("categoryId", "name slug")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ products });
  })
);

router.patch(
  "/products/:id",
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found." });

    if (req.body.approvalStatus && ["pending", "approved", "rejected"].includes(req.body.approvalStatus)) {
      product.approvalStatus = req.body.approvalStatus;
    }
    if (req.body.rejectionReason !== undefined) product.rejectionReason = req.body.rejectionReason;
    if (req.body.isActive !== undefined) product.isActive = Boolean(req.body.isActive);
    if (Array.isArray(req.body.tags)) product.tags = req.body.tags;

    await product.save();
    res.json({ product });
  })
);

// Categories CRUD
router.get(
  "/categories",
  asyncHandler(async (_req, res) => {
    const categories = await Category.find().sort({ sortOrder: 1, name: 1 }).lean();
    res.json({ categories });
  })
);

router.post(
  "/categories",
  asyncHandler(async (req, res) => {
    const { name, description = "", image = "", icon = "sparkles", sortOrder = 0 } = req.body;
    if (!name) return res.status(400).json({ error: "Category name is required." });
    const category = await Category.create({
      name: String(name).trim(),
      slug: slugify(name),
      description,
      image,
      icon,
      sortOrder: Number(sortOrder || 0),
    });
    res.status(201).json({ category });
  })
);

router.patch(
  "/categories/:id",
  asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: "Category not found." });
    ["name", "description", "image", "icon", "isActive", "sortOrder"].forEach((k) => {
      if (req.body[k] !== undefined) category[k] = req.body[k];
    });
    if (req.body.name) category.slug = slugify(req.body.name);
    await category.save();
    res.json({ category });
  })
);

router.delete(
  "/categories/:id",
  asyncHandler(async (req, res) => {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  })
);

// Orders & Suborders Management
router.get(
  "/orders",
  asyncHandler(async (_req, res) => {
    const orders = await Order.find()
      .populate("customerId", "name email phone")
      .populate({
        path: "suborderIds",
        populate: { path: "sellerId", select: "shopName slug" },
      })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ orders });
  })
);

router.patch(
  "/suborders/:id/status",
  asyncHandler(async (req, res) => {
    const { status, note } = req.body;
    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ error: "Invalid status." });
    }
    const suborder = await Suborder.findById(req.params.id);
    if (!suborder) return res.status(404).json({ error: "Suborder not found." });

    const prevStatus = suborder.status;
    suborder.status = status;
    suborder.statusHistory.push({
      status,
      note: note || `Updated to ${status} by Admin`,
      updatedByRole: "admin",
    });
    await suborder.save();

    if (prevStatus !== status) {
      await syncCommissionOnStatusChange(suborder, prevStatus, status);
    }

    res.json({ suborder });
  })
);

// Payments Management
router.get(
  "/payments",
  asyncHandler(async (_req, res) => {
    const payments = await Payment.find()
      .populate("orderId", "orderNumber totalAmount paymentMethod")
      .populate("customerId", "name email")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ payments });
  })
);

router.patch(
  "/payments/:id",
  asyncHandler(async (req, res) => {
    const { status, transactionRef } = req.body;
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ error: "Payment record not found." });

    if (status && ["pending", "awaiting_verification", "paid", "failed", "refunded"].includes(status)) {
      payment.status = status;
      if (status === "paid") {
        payment.paidAt = new Date();
        payment.verifiedByAdminId = req.user._id;
      }
      await Order.findByIdAndUpdate(payment.orderId, { paymentStatus: status });
    }
    if (transactionRef !== undefined) payment.transactionRef = transactionRef;
    await payment.save();
    res.json({ payment });
  })
);

// Withdrawals Management
router.get(
  "/withdrawals",
  asyncHandler(async (_req, res) => {
    const withdrawals = await Withdrawal.find()
      .populate("sellerId", "shopName slug city availableBalance")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ withdrawals });
  })
);

router.patch(
  "/withdrawals/:id",
  asyncHandler(async (req, res) => {
    const { status, payoutReference, adminNote } = req.body;
    if (!["approved", "rejected", "paid"].includes(status)) {
      return res.status(400).json({ error: "Invalid withdrawal status." });
    }

    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) return res.status(404).json({ error: "Withdrawal request not found." });

    const prevStatus = withdrawal.status;
    if (prevStatus === "rejected" || prevStatus === "paid") {
      return res.status(400).json({ error: `Withdrawal already finalized as ${prevStatus}.` });
    }

    const seller = await Seller.findById(withdrawal.sellerId);
    if (status === "rejected" && seller) {
      seller.availableBalance += withdrawal.amount;
      await seller.save();
    }
    if (status === "paid" && seller) {
      seller.totalWithdrawn += withdrawal.amount;
      await seller.save();
    }

    withdrawal.status = status;
    if (payoutReference !== undefined) withdrawal.payoutReference = payoutReference;
    if (adminNote !== undefined) withdrawal.adminNote = adminNote;
    withdrawal.processedBy = req.user._id;
    withdrawal.processedAt = new Date();
    await withdrawal.save();

    res.json({ withdrawal });
  })
);

// Banners CRUD
router.get(
  "/banners",
  asyncHandler(async (_req, res) => {
    const banners = await Banner.find().sort({ sortOrder: 1 }).lean();
    res.json({ banners });
  })
);

router.post(
  "/banners",
  asyncHandler(async (req, res) => {
    const { title, subtitle, badgeText, ctaText, ctaLink, image, themeColor, sortOrder } = req.body;
    if (!title) return res.status(400).json({ error: "Banner title is required." });
    const banner = await Banner.create({
      title,
      subtitle,
      badgeText,
      ctaText,
      ctaLink,
      image,
      themeColor,
      sortOrder: Number(sortOrder || 0),
    });
    res.status(201).json({ banner });
  })
);

router.patch(
  "/banners/:id",
  asyncHandler(async (req, res) => {
    const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!banner) return res.status(404).json({ error: "Banner not found." });
    res.json({ banner });
  })
);

router.delete(
  "/banners/:id",
  asyncHandler(async (req, res) => {
    await Banner.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  })
);

// Coupons CRUD
router.get(
  "/coupons",
  asyncHandler(async (_req, res) => {
    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
    res.json({ coupons });
  })
);

router.post(
  "/coupons",
  asyncHandler(async (req, res) => {
    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderAmount = 0,
      maxDiscount = 0,
      usageLimit = 0,
      expiresAt,
    } = req.body;

    if (!code || !discountType || !discountValue || !expiresAt) {
      return res.status(400).json({
        error: "Code, discountType, discountValue, and expiresAt are required.",
      });
    }

    const coupon = await Coupon.create({
      code: String(code).toUpperCase().trim(),
      description: description || "",
      discountType,
      discountValue: Number(discountValue),
      minOrderAmount: Number(minOrderAmount || 0),
      maxDiscount: Number(maxDiscount || 0),
      usageLimit: Number(usageLimit || 0),
      expiresAt: new Date(expiresAt),
    });
    res.status(201).json({ coupon });
  })
);

router.patch(
  "/coupons/:id",
  asyncHandler(async (req, res) => {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!coupon) return res.status(404).json({ error: "Coupon not found." });
    res.json({ coupon });
  })
);

router.delete(
  "/coupons/:id",
  asyncHandler(async (req, res) => {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  })
);

// Returns & Refunds Management
router.get(
  "/returns",
  asyncHandler(async (_req, res) => {
    const returns = await ReturnRequest.find()
      .populate("orderId", "orderNumber")
      .populate("suborderId", "suborderNumber status")
      .populate("customerId", "name email")
      .populate("sellerId", "shopName")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ returns });
  })
);

router.patch(
  "/returns/:id",
  asyncHandler(async (req, res) => {
    const { status, adminNote } = req.body;
    if (!["approved", "rejected", "refunded"].includes(status)) {
      return res.status(400).json({ error: "Invalid return status." });
    }

    const ret = await ReturnRequest.findById(req.params.id);
    if (!ret) return res.status(404).json({ error: "Return request not found." });

    ret.status = status;
    if (adminNote !== undefined) ret.adminNote = adminNote;
    ret.resolvedBy = req.user._id;
    ret.resolvedAt = new Date();
    await ret.save();

    if (status === "refunded") {
      const suborder = await Suborder.findById(ret.suborderId);
      if (suborder && suborder.status !== "Returned") {
        const prev = suborder.status;
        suborder.status = "Returned";
        suborder.statusHistory.push({
          status: "Returned",
          note: "Refund approved & processed by Admin",
          updatedByRole: "admin",
        });
        await suborder.save();
        await syncCommissionOnStatusChange(suborder, prev, "Returned");
      }
      await Payment.findOneAndUpdate({ orderId: ret.orderId }, { status: "refunded" });
    }

    res.json({ returnRequest: ret });
  })
);

export default router;
