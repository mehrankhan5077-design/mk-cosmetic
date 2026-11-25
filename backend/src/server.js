import "dotenv/config";
import path from "node:path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { connectDB } from "./config/db.js";
import { getUploadsDir } from "./services/storageService.js";
import authRoutes from "./routes/authRoutes.js";
import storefrontRoutes from "./routes/storefrontRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import sellerRoutes from "./routes/sellerRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import { ensureSeeded } from "./seed/seedData.js";

export function createApp() {
  const app = express();

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );

  const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:3000")
    .split(",")
    .map((o) => o.trim());

  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        return cb(null, true); // allow local dev flexibility
      },
      credentials: true,
    })
  );

  app.use(express.json({ limit: "4mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.use(
    "/api/auth/login",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 60,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  app.use("/uploads", express.static(getUploadsDir()));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "MK COSMETIC API", currency: "PKR" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/storefront", storefrontRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/seller", sellerRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/uploads", uploadRoutes);

  app.use((err, _req, res, _next) => {
    console.error("[API Error]", err);
    const status = err.status || 500;
    res.status(status).json({ error: err.message || "Internal server error." });
  });

  return app;
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename);

if (isDirectRun) {
  const port = Number(process.env.PORT || 5000);
  connectDB()
    .then(async () => {
      await ensureSeeded();
      const app = createApp();
      app.listen(port, () => {
        console.log(`[API] MK COSMETIC backend running on http://localhost:${port}`);
      });
    })
    .catch((err) => {
      console.error("Failed to start MK COSMETIC backend:", err);
      process.exit(1);
    });
}
