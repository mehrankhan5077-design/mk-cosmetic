import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { v2 as cloudinary } from "cloudinary";

const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

export function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

/**
 * Upload an image buffer either to Cloudinary (when configured) or to local /uploads storage.
 */
export async function saveImageAsset(fileBuffer, originalName = "image.png", folder = "products") {
  if (isCloudinaryConfigured()) {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: `mk-cosmetic/${folder}`, resource_type: "image" },
        (err, res) => (err ? reject(err) : resolve(res))
      );
      stream.end(fileBuffer);
    });
    return {
      url: result.secure_url,
      provider: "cloudinary",
      publicId: result.public_id,
    };
  }

  const ext = path.extname(originalName).toLowerCase() || ".png";
  const safeExt = [".png", ".jpg", ".jpeg", ".webp", ".svg"].includes(ext) ? ext : ".png";
  const targetDir = path.join(UPLOADS_DIR, folder);
  fs.mkdirSync(targetDir, { recursive: true });
  const filename = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}${safeExt}`;
  const fullPath = path.join(targetDir, filename);
  fs.writeFileSync(fullPath, fileBuffer);

  return {
    url: `/uploads/${folder}/${filename}`,
    provider: "local",
    publicId: `${folder}/${filename}`,
  };
}

export function getUploadsDir() {
  return UPLOADS_DIR;
}
