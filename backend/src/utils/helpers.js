import crypto from "node:crypto";

export function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function uniqueSlug(base) {
  const clean = slugify(base) || "item";
  const suffix = crypto.randomBytes(3).toString("hex");
  return `${clean}-${suffix}`;
}

export function generateCode(prefix) {
  const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${prefix}-${datePart}-${rand}`;
}

export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
