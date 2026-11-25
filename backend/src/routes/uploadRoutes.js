import express from "express";
import multer from "multer";
import { requireAuth } from "../middleware/auth.js";
import { saveImageAsset } from "../services/storageService.js";
import { asyncHandler } from "../utils/helpers.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are permitted."));
    }
    cb(null, true);
  },
});

router.post(
  "/image",
  requireAuth,
  upload.single("image"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided." });
    }
    const folder = req.body.folder === "banners" ? "banners" : "products";
    const asset = await saveImageAsset(req.file.buffer, req.file.originalname, folder);
    res.status(201).json(asset);
  })
);

export default router;
