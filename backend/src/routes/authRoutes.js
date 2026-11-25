import express from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { Seller } from "../models/Seller.js";
import {
  clearAuthCookie,
  requireAuth,
  setAuthCookie,
  signAuthToken,
} from "../middleware/auth.js";
import { asyncHandler, uniqueSlug } from "../utils/helpers.js";

const router = express.Router();

// POST /api/auth/register (Customer registration)
router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required." });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      phone: String(phone || "").trim(),
      passwordHash,
      role: "customer",
    });

    const token = signAuthToken(user);
    setAuthCookie(res, token);

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        wishlist: user.wishlist,
      },
    });
  })
);

// POST /api/auth/register-seller (Independent Seller registration + Shop creation)
router.post(
  "/register-seller",
  asyncHandler(async (req, res) => {
    const {
      name,
      email,
      phone,
      password,
      shopName,
      city,
      description,
      businessCnic,
      preferredMethod,
      accountTitle,
      accountNumber,
      bankName,
      iban,
    } = req.body;

    if (!name || !email || !password || !shopName || !city || !phone) {
      return res.status(400).json({
        error: "Owner name, email, phone, password, shop name, and city are required.",
      });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      phone: String(phone).trim(),
      passwordHash,
      role: "seller",
    });

    const seller = await Seller.create({
      userId: user._id,
      shopName: String(shopName).trim(),
      slug: uniqueSlug(shopName),
      description: String(description || "").trim(),
      city: String(city).trim(),
      phone: String(phone).trim(),
      businessCnic: String(businessCnic || "").trim(),
      status: "pending",
      payoutAccount: {
        preferredMethod: preferredMethod || "BankTransfer",
        accountTitle: accountTitle || name,
        accountNumber: accountNumber || "",
        bankName: bankName || "",
        iban: iban || "",
      },
    });

    const token = signAuthToken(user);
    setAuthCookie(res, token);

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      seller,
    });
  })
);

// POST /api/auth/login
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select(
      "+passwordHash"
    );
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }
    if (!user.isActive) {
      return res.status(403).json({ error: "Account is deactivated. Contact support." });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = signAuthToken(user);
    setAuthCookie(res, token);

    let seller = null;
    if (user.role === "seller") {
      seller = await Seller.findOne({ userId: user._id }).lean();
    }

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        wishlist: user.wishlist,
        addresses: user.addresses,
      },
      seller,
    });
  })
);

// POST /api/auth/logout
router.post("/logout", (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

// GET /api/auth/me
router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).populate("wishlist").lean();
    let seller = null;
    if (user.role === "seller") {
      seller = await Seller.findOne({ userId: user._id }).lean();
    }
    res.json({ user, seller });
  })
);

// POST /api/auth/wishlist/:productId
router.post(
  "/wishlist/:productId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const user = await User.findById(req.user._id);
    const exists = user.wishlist.some((id) => String(id) === productId);
    if (exists) {
      user.wishlist = user.wishlist.filter((id) => String(id) !== productId);
    } else {
      user.wishlist.push(productId);
    }
    await user.save();
    res.json({ wishlist: user.wishlist, added: !exists });
  })
);

// POST /api/auth/addresses
router.post(
  "/addresses",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { fullName, phone, city, area, streetAddress, postalCode } = req.body;
    if (!fullName || !phone || !city || !area || !streetAddress) {
      return res.status(400).json({ error: "Complete shipping address fields are required." });
    }
    const user = await User.findById(req.user._id);
    user.addresses.push({ fullName, phone, city, area, streetAddress, postalCode });
    await user.save();
    res.status(201).json({ addresses: user.addresses });
  })
);

export default router;
