import express from "express";
import { Order } from "../models/Order.js";
import { Suborder } from "../models/Suborder.js";
import { Product } from "../models/Product.js";
import { Seller } from "../models/Seller.js";
import { Payment } from "../models/Payment.js";
import { Commission } from "../models/Commission.js";
import { Coupon } from "../models/Coupon.js";
import { Review } from "../models/Review.js";
import { ReturnRequest } from "../models/ReturnRequest.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler, generateCode } from "../utils/helpers.js";
import {
  calculateCommissionBreakdown,
  getMarketplaceSettings,
  resolveCommissionRate,
  syncCommissionOnStatusChange,
} from "../services/commissionService.js";
import {
  buildEasypaisaCheckoutSession,
  buildJazzCashCheckoutSession,
  getBankTransferDetails,
  getGatewayCapabilities,
} from "../services/paymentService.js";

const router = express.Router();

// GET /api/orders/payment-methods
router.get("/payment-methods", (_req, res) => {
  res.json({ gateways: getGatewayCapabilities() });
});

// POST /api/orders (Multi-vendor Checkout -> automatically splits into per-seller Suborders)
router.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { items, shippingAddress, paymentMethod, couponCode, bankReference } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Your cart is empty." });
    }
    if (
      !shippingAddress ||
      !shippingAddress.fullName ||
      !shippingAddress.phone ||
      !shippingAddress.city ||
      !shippingAddress.area ||
      !shippingAddress.streetAddress
    ) {
      return res.status(400).json({ error: "Complete shipping address is required." });
    }

    const allowedMethods = ["COD", "JazzCash", "Easypaisa", "BankTransfer"];
    if (!allowedMethods.includes(paymentMethod)) {
      return res.status(400).json({ error: "Invalid payment method selected." });
    }

    // Check payment gateway availability honestly before creating order
    const caps = getGatewayCapabilities();
    if (paymentMethod === "JazzCash" && !caps.JazzCash.configured) {
      return res.status(400).json({
        error:
          "JazzCash merchant credentials are not configured on this server. Please choose Cash on Delivery or Bank Transfer, or configure JAZZCASH_* variables.",
      });
    }
    if (paymentMethod === "Easypaisa" && !caps.Easypaisa.configured) {
      return res.status(400).json({
        error:
          "Easypaisa store credentials are not configured on this server. Please choose Cash on Delivery or Bank Transfer, or configure EASYPAISA_* variables.",
      });
    }

    // Validate all products and stock
    const productIds = items.map((i) => i.productId);
    const products = await Product.find({
      _id: { $in: productIds },
      approvalStatus: "approved",
      isActive: true,
    });
    const productMap = new Map(products.map((p) => [String(p._id), p]));

    const groupedBySeller = new Map();
    let orderSubtotal = 0;

    for (const item of items) {
      const qty = Math.max(1, Math.floor(Number(item.qty || 1)));
      const prod = productMap.get(String(item.productId));
      if (!prod) {
        return res.status(400).json({ error: "One or more products are no longer available." });
      }
      if (prod.stock < qty) {
        return res.status(400).json({
          error: `Insufficient stock for "${prod.title}". Available: ${prod.stock}.`,
        });
      }

      const sellerIdStr = String(prod.sellerId);
      const lineTotal = prod.salePrice * qty;
      orderSubtotal += lineTotal;

      if (!groupedBySeller.has(sellerIdStr)) {
        groupedBySeller.set(sellerIdStr, { sellerId: prod.sellerId, items: [], subtotal: 0 });
      }
      const group = groupedBySeller.get(sellerIdStr);
      group.items.push({
        productId: prod._id,
        title: prod.title,
        image: prod.images[0] || "",
        variant: item.variant || "",
        qty,
        unitPrice: prod.salePrice,
        lineTotal,
      });
      group.subtotal += lineTotal;
    }

    // Validate coupon if provided
    let discountAmount = 0;
    let appliedCoupon = null;
    if (couponCode) {
      appliedCoupon = await Coupon.findOne({
        code: String(couponCode).toUpperCase().trim(),
        isActive: true,
      });
      if (!appliedCoupon || new Date(appliedCoupon.expiresAt) < new Date()) {
        return res.status(400).json({ error: "Coupon code is invalid or expired." });
      }
      if (appliedCoupon.usageLimit > 0 && appliedCoupon.usedCount >= appliedCoupon.usageLimit) {
        return res.status(400).json({ error: "Coupon usage limit reached." });
      }
      if (orderSubtotal < appliedCoupon.minOrderAmount) {
        return res.status(400).json({
          error: `Minimum order Rs. ${appliedCoupon.minOrderAmount.toLocaleString()} required for coupon.`,
        });
      }
      discountAmount =
        appliedCoupon.discountType === "percent"
          ? Math.round((orderSubtotal * appliedCoupon.discountValue) / 100)
          : appliedCoupon.discountValue;
      if (appliedCoupon.maxDiscount > 0) {
        discountAmount = Math.min(discountAmount, appliedCoupon.maxDiscount);
      }
      discountAmount = Math.min(discountAmount, orderSubtotal);
    }

    const settings = await getMarketplaceSettings();
    const shippingFee =
      orderSubtotal >= settings.freeShippingThreshold ? 0 : settings.flatShippingFee;
    const totalAmount = Math.max(0, orderSubtotal - discountAmount + shippingFee);

    const paymentStatus = paymentMethod === "BankTransfer" ? "awaiting_verification" : "pending";

    const order = await Order.create({
      orderNumber: generateCode("MK"),
      customerId: req.user._id,
      shippingAddress,
      paymentMethod,
      paymentStatus,
      subtotal: orderSubtotal,
      couponCode: appliedCoupon ? appliedCoupon.code : "",
      discountAmount,
      shippingFee,
      totalAmount,
      suborderIds: [],
    });

    // Split into per-seller Suborders and record Commissions
    const createdSuborders = [];
    for (const [sellerIdStr, group] of groupedBySeller.entries()) {
      const seller = await Seller.findById(sellerIdStr);
      if (!seller || seller.status !== "approved") {
        await Order.findByIdAndDelete(order._id);
        return res.status(400).json({ error: "One of the selected sellers is currently unavailable." });
      }

      const discountShare =
        orderSubtotal > 0 ? Math.round((group.subtotal / orderSubtotal) * discountAmount) : 0;
      const netSellerSubtotal = Math.max(0, group.subtotal - discountShare);
      const commissionRate = await resolveCommissionRate(seller);
      const { commissionAmount, sellerEarnings } = calculateCommissionBreakdown(
        netSellerSubtotal,
        commissionRate
      );

      const suborder = await Suborder.create({
        suborderNumber: generateCode("MKS"),
        orderId: order._id,
        customerId: req.user._id,
        sellerId: seller._id,
        items: group.items,
        subtotal: group.subtotal,
        discountShare,
        commissionRate,
        commissionAmount,
        sellerEarnings,
        status: "Pending",
        statusHistory: [
          {
            status: "Pending",
            note: "Order placed by customer",
            updatedByRole: "customer",
          },
        ],
      });

      await Commission.create({
        orderId: order._id,
        suborderId: suborder._id,
        sellerId: seller._id,
        grossAmount: netSellerSubtotal,
        commissionRate,
        commissionAmount,
        sellerEarnings,
        status: "pending",
      });

      seller.pendingBalance += sellerEarnings;
      await seller.save();

      createdSuborders.push(suborder);
      order.suborderIds.push(suborder._id);
    }

    await order.save();

    // Decrement stock & increment soldCount
    for (const item of items) {
      const qty = Math.max(1, Math.floor(Number(item.qty || 1)));
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -qty, soldCount: qty },
      });
    }

    if (appliedCoupon) {
      appliedCoupon.usedCount += 1;
      await appliedCoupon.save();
    }

    // Create Payment Record
    const payment = await Payment.create({
      orderId: order._id,
      customerId: req.user._id,
      method: paymentMethod,
      amount: totalAmount,
      currency: "PKR",
      status: paymentStatus,
      gatewayConfigured: true,
      gatewayProvider: paymentMethod,
      transactionRef: bankReference ? String(bankReference).trim() : "",
      proofNote:
        paymentMethod === "BankTransfer"
          ? "Customer submitted IBFT reference for admin verification."
          : "",
    });

    let gatewayRedirect = null;
    if (paymentMethod === "JazzCash") {
      gatewayRedirect = buildJazzCashCheckoutSession(order);
    } else if (paymentMethod === "Easypaisa") {
      gatewayRedirect = buildEasypaisaCheckoutSession(order);
    }

    res.status(201).json({
      order,
      suborders: createdSuborders,
      payment,
      bankDetails: paymentMethod === "BankTransfer" ? getBankTransferDetails() : null,
      gatewayRedirect,
    });
  })
);

// GET /api/orders/my (Customer order history with split seller suborders)
router.get(
  "/my",
  requireAuth,
  asyncHandler(async (req, res) => {
    const orders = await Order.find({ customerId: req.user._id })
      .populate({
        path: "suborderIds",
        populate: { path: "sellerId", select: "shopName slug city" },
      })
      .sort({ createdAt: -1 })
      .lean();

    const returns = await ReturnRequest.find({ customerId: req.user._id }).lean();
    const payments = await Payment.find({ customerId: req.user._id }).lean();

    res.json({ orders, returns, payments });
  })
);

// GET /api/orders/track/:orderNumber
router.get(
  "/track/:orderNumber",
  asyncHandler(async (req, res) => {
    const order = await Order.findOne({
      orderNumber: String(req.params.orderNumber).toUpperCase().trim(),
    })
      .populate({
        path: "suborderIds",
        populate: { path: "sellerId", select: "shopName slug city" },
      })
      .lean();

    if (!order) {
      return res.status(404).json({ error: "No order found with that order number." });
    }

    res.json({
      order: {
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        totalAmount: order.totalAmount,
        city: order.shippingAddress?.city,
        suborders: order.suborderIds,
      },
    });
  })
);

// POST /api/orders/suborders/:suborderId/cancel (Customer cancel while Pending)
router.post(
  "/suborders/:suborderId/cancel",
  requireAuth,
  asyncHandler(async (req, res) => {
    const suborder = await Suborder.findOne({
      _id: req.params.suborderId,
      customerId: req.user._id,
    });
    if (!suborder) {
      return res.status(404).json({ error: "Suborder not found." });
    }
    if (!["Pending", "Confirmed"].includes(suborder.status)) {
      return res.status(400).json({
        error: `Cannot cancel suborder once it is "${suborder.status}".`,
      });
    }

    const prevStatus = suborder.status;
    suborder.status = "Cancelled";
    suborder.statusHistory.push({
      status: "Cancelled",
      note: req.body.reason || "Cancelled by customer",
      updatedByRole: "customer",
    });
    await suborder.save();

    // Restore stock
    for (const item of suborder.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: item.qty, soldCount: -item.qty },
      });
    }

    await syncCommissionOnStatusChange(suborder, prevStatus, "Cancelled");
    res.json({ suborder });
  })
);

// POST /api/orders/returns (Customer submits return/refund request for Delivered suborder)
router.post(
  "/returns",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { suborderId, reason, description } = req.body;
    if (!suborderId || !reason || !description) {
      return res.status(400).json({ error: "Suborder, reason, and description are required." });
    }
    const suborder = await Suborder.findOne({
      _id: suborderId,
      customerId: req.user._id,
    });
    if (!suborder) {
      return res.status(404).json({ error: "Suborder not found." });
    }
    if (suborder.status !== "Delivered") {
      return res.status(400).json({ error: "Returns can only be requested for Delivered orders." });
    }

    const existing = await ReturnRequest.findOne({ suborderId: suborder._id });
    if (existing) {
      return res.status(409).json({ error: "A return request already exists for this suborder." });
    }

    const returnReq = await ReturnRequest.create({
      orderId: suborder.orderId,
      suborderId: suborder._id,
      customerId: req.user._id,
      sellerId: suborder.sellerId,
      reason,
      description,
      refundAmount: Math.max(0, suborder.subtotal - suborder.discountShare),
      status: "requested",
    });

    res.status(201).json({ returnRequest: returnReq });
  })
);

// POST /api/orders/reviews (Customer submits rating & review)
router.post(
  "/reviews",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { productId, rating, title, comment } = req.body;
    if (!productId || !rating || !comment) {
      return res.status(400).json({ error: "Product, rating, and comment are required." });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }

    // Check if customer bought this product
    const boughtOrder = await Suborder.findOne({
      customerId: req.user._id,
      "items.productId": product._id,
      status: "Delivered",
    }).lean();

    const review = await Review.findOneAndUpdate(
      { productId: product._id, customerId: req.user._id },
      {
        sellerId: product.sellerId,
        orderId: boughtOrder ? boughtOrder.orderId : null,
        rating: Math.min(5, Math.max(1, Number(rating))),
        title: String(title || "").trim(),
        comment: String(comment).trim(),
        verifiedPurchase: Boolean(boughtOrder),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Recompute product & seller rating averages
    const prodStats = await Review.aggregate([
      { $match: { productId: product._id } },
      { $group: { _id: "$productId", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);
    if (prodStats[0]) {
      product.ratingAvg = Number(prodStats[0].avg.toFixed(2));
      product.reviewCount = prodStats[0].count;
      await product.save();
    }

    const sellerStats = await Review.aggregate([
      { $match: { sellerId: product.sellerId } },
      { $group: { _id: "$sellerId", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);
    if (sellerStats[0]) {
      await Seller.findByIdAndUpdate(product.sellerId, {
        ratingAvg: Number(sellerStats[0].avg.toFixed(2)),
        reviewCount: sellerStats[0].count,
      });
    }

    res.status(201).json({ review });
  })
);

export default router;
