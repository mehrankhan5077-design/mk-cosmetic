import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { Seller } from "../models/Seller.js";

const COOKIE_NAME = "mk_cosmetic_token";

export function getJwtSecret() {
  return process.env.JWT_SECRET || "mk-cosmetic-dev-secret-change-in-prod";
}

export function signAuthToken(user) {
  return jwt.sign(
    {
      sub: String(user._id),
      role: user.role,
      email: user.email,
    },
    getJwtSecret(),
    { expiresIn: "7d" }
  );
}

export function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: "/" });
}

function extractToken(req) {
  const authHeader = req.headers.authorization || "";
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }
  if (req.cookies && req.cookies[COOKIE_NAME]) {
    return req.cookies[COOKIE_NAME];
  }
  return null;
}

export async function optionalAuth(req, _res, next) {
  try {
    const token = extractToken(req);
    if (!token) return next();

    const decoded = jwt.verify(token, getJwtSecret());
    const user = await User.findById(decoded.sub).lean();
    if (user && user.isActive) {
      req.user = user;
    }
  } catch {
    // Invalid or expired token treated as unauthenticated
  }
  next();
}

export async function requireAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ error: "Authentication required. Please sign in." });
    }
    const decoded = jwt.verify(token, getJwtSecret());
    const user = await User.findById(decoded.sub).lean();
    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Account not found or deactivated." });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired session. Please sign in again." });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required." });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Access denied. Required role: ${roles.join(" or ")}.` });
    }
    next();
  };
}

export async function attachSellerProfile(req, res, next) {
  try {
    if (!req.user || req.user.role !== "seller") {
      return res.status(403).json({ error: "Seller account required." });
    }
    const seller = await Seller.findOne({ userId: req.user._id });
    if (!seller) {
      return res.status(404).json({ error: "Seller shop profile not found." });
    }
    req.seller = seller;
    next();
  } catch (err) {
    next(err);
  }
}

export function requireApprovedSeller(req, res, next) {
  if (!req.seller) {
    return res.status(404).json({ error: "Seller shop profile not found." });
  }
  if (req.seller.status === "suspended") {
    return res.status(403).json({ error: "Your seller shop is currently suspended by MK COSMETIC Admin." });
  }
  if (req.seller.status !== "approved") {
    return res.status(403).json({
      error: `Your seller shop status is "${req.seller.status}". Admin approval is required before performing this action.`,
    });
  }
  next();
}
