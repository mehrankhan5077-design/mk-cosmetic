import path from "node:path";
import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createApp } from "../src/server.js";
import { ensureSeeded } from "../src/seed/seedData.js";

process.env.MONGOMS_DOWNLOAD_DIR = path.resolve(process.cwd(), ".mongoms-cache");

let mongod;
let server;
let baseUrl;

async function req(path, opts = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri("mk_cosmetic_test"));
  await ensureSeeded();

  const app = createApp();
  await new Promise((resolve) => {
    server = app.listen(0, () => resolve());
  });
  baseUrl = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

test("MK COSMETIC end-to-end multi-vendor workflow, commission split, RBAC, and payouts", async () => {
  // 1. Storefront Home & 11 Categories
  const home = await req("/storefront/home");
  assert.equal(home.status, 200);
  assert.equal(home.body.categories.length, 11);
  assert.ok(home.body.flashSales.length > 0);

  // 2. Login as Admin, Seller, and Customer
  const adminLogin = await req("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "admin@mkcosmetic.pk", password: "Admin@12345" }),
  });
  assert.equal(adminLogin.status, 200);
  const adminToken = adminLogin.body.token;

  const custLogin = await req("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "ayesha@example.pk", password: "Customer@12345" }),
  });
  assert.equal(custLogin.status, 200);
  const custToken = custLogin.body.token;

  // 3. RBAC check: customer blocked from Admin & Seller APIs
  const rbacAdmin = await req("/admin/dashboard", {
    headers: { Authorization: `Bearer ${custToken}` },
  });
  assert.equal(rbacAdmin.status, 403);

  // 4. Register new independent Seller -> Admin approves -> Seller uploads product -> Admin approves
  const sellerReg = await req("/auth/register-seller", {
    method: "POST",
    body: JSON.stringify({
      name: "Zara Test",
      email: "zara-shop@mkcosmetic.pk",
      phone: "0300-9988776",
      password: "Password123",
      shopName: "Zara Glow Lab",
      city: "Lahore",
      accountTitle: "Zara Test",
      accountNumber: "03009988776",
      preferredMethod: "JazzCash",
    }),
  });
  assert.equal(sellerReg.status, 201);
  const newSellerId = sellerReg.body.seller._id;
  const newSellerToken = sellerReg.body.token;

  // Pending seller cannot create products before Admin approval
  const blockedProd = await req("/seller/products", {
    method: "POST",
    headers: { Authorization: `Bearer ${newSellerToken}` },
    body: JSON.stringify({
      title: "Blocked Lipstick",
      categoryId: home.body.categories[0]._id,
      brand: "ZaraGlow",
      description: "Test",
      price: 1000,
      stock: 10,
      images: ["/uploads/seed/cat-makeup.svg"],
    }),
  });
  assert.equal(blockedProd.status, 403);

  // Admin approves seller with 10% commission
  const approveSeller = await req(`/admin/sellers/${newSellerId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ status: "approved", commissionRate: 10 }),
  });
  assert.equal(approveSeller.status, 200);

  // Approved seller creates product priced at Rs. 1,000
  const prodCreate = await req("/seller/products", {
    method: "POST",
    headers: { Authorization: `Bearer ${newSellerToken}` },
    body: JSON.stringify({
      title: "Zara Rose Tint",
      categoryId: home.body.categories[4]._id,
      brand: "ZaraGlow",
      description: "Rich hydrating tint",
      price: 1000,
      discountPercent: 0,
      stock: 15,
      images: ["/uploads/seed/cat-lipsticks.svg"],
    }),
  });
  assert.equal(prodCreate.status, 201);
  const newProductId = prodCreate.body.product._id;

  // Admin approves product
  const approveProd = await req(`/admin/products/${newProductId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ approvalStatus: "approved" }),
  });
  assert.equal(approveProd.status, 200);

  // 5. Honest JazzCash unconfigured check
  const unconfiguredJazzCash = await req("/orders", {
    method: "POST",
    headers: { Authorization: `Bearer ${custToken}` },
    body: JSON.stringify({
      items: [{ productId: newProductId, qty: 1, variant: "Standard" }],
      shippingAddress: {
        fullName: "Ayesha Khan",
        phone: "0321-4567890",
        city: "Lahore",
        area: "DHA",
        streetAddress: "Street 1",
      },
      paymentMethod: "JazzCash",
    }),
  });
  assert.equal(unconfiguredJazzCash.status, 400);
  assert.match(unconfiguredJazzCash.body.error, /not configured/i);

  // 6. Multi-vendor Checkout (buying from GlamAura + Zara Glow Lab in one order)
  const otherProduct = home.body.flashSales[0];
  const checkout = await req("/orders", {
    method: "POST",
    headers: { Authorization: `Bearer ${custToken}` },
    body: JSON.stringify({
      items: [
        { productId: newProductId, qty: 1, variant: "Standard" },
        { productId: otherProduct._id, qty: 1, variant: "Standard" },
      ],
      shippingAddress: {
        fullName: "Ayesha Khan",
        phone: "0321-4567890",
        city: "Lahore",
        area: "DHA Phase 5",
        streetAddress: "House 42",
      },
      paymentMethod: "COD",
    }),
  });
  assert.equal(checkout.status, 201);
  assert.equal(checkout.body.suborders.length, 2);

  // Verify exact Rs. 1,000 -> 10% commission (Rs. 100) -> Rs. 900 seller earnings
  const zaraSub = checkout.body.suborders.find((s) => String(s.sellerId) === String(newSellerId));
  assert.equal(zaraSub.commissionRate, 10);
  assert.equal(zaraSub.commissionAmount, 100);
  assert.equal(zaraSub.sellerEarnings, 900);

  // 7. Seller marks suborder Delivered -> balance moves to availableBalance
  const deliver = await req(`/seller/orders/${zaraSub._id}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${newSellerToken}` },
    body: JSON.stringify({ status: "Delivered", trackingNumber: "TCS-123", courierName: "TCS" }),
  });
  assert.equal(deliver.status, 200);

  const sellerDash = await req("/seller/dashboard", {
    headers: { Authorization: `Bearer ${newSellerToken}` },
  });
  assert.equal(sellerDash.body.stats.availableBalance, 900);
  assert.equal(sellerDash.body.stats.completedOrders, 1);
});
