import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { connectDB, disconnectDB } from "../config/db.js";
import { User } from "../models/User.js";
import { Seller } from "../models/Seller.js";
import { Category } from "../models/Category.js";
import { Product } from "../models/Product.js";
import { Banner } from "../models/Banner.js";
import { Coupon } from "../models/Coupon.js";
import { Order } from "../models/Order.js";
import { Suborder } from "../models/Suborder.js";
import { Commission } from "../models/Commission.js";
import { Payment } from "../models/Payment.js";
import { Review } from "../models/Review.js";
import { MarketplaceSetting } from "../models/MarketplaceSetting.js";
import { getUploadsDir } from "../services/storageService.js";
import { slugify } from "../utils/helpers.js";

function createProductSvg(title, brand, accent = "#ec4899", categoryLabel = "BEAUTY") {
  const safeTitle = title.replace(/&/g, "&amp;").slice(0, 28);
  const safeBrand = brand.replace(/&/g, "&amp;").toUpperCase();
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fff1f5"/>
      <stop offset="100%" stop-color="#fce7f3"/>
    </linearGradient>
    <linearGradient id="bottle" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${accent}"/>
      <stop offset="100%" stop-color="#111827"/>
    </linearGradient>
  </defs>
  <rect width="600" height="600" fill="url(#bg)"/>
  <circle cx="480" cy="120" r="110" fill="${accent}" fill-opacity="0.12"/>
  <circle cx="110" cy="490" r="140" fill="#111827" fill-opacity="0.05"/>
  <rect x="225" y="135" width="150" height="58" rx="12" fill="#111827"/>
  <rect x="255" y="105" width="90" height="36" rx="8" fill="${accent}"/>
  <rect x="195" y="190" width="210" height="250" rx="28" fill="url(#bottle)"/>
  <rect x="215" y="235" width="170" height="150" rx="16" fill="#ffffff" fill-opacity="0.94"/>
  <text x="300" y="280" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="700" fill="${accent}" letter-spacing="2">${safeBrand}</text>
  <text x="300" y="315" text-anchor="middle" font-family="Arial, sans-serif" font-size="17" font-weight="700" fill="#111827">${safeTitle}</text>
  <text x="300" y="352" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="600" fill="#6b7280" letter-spacing="1.5">${categoryLabel}</text>
  <text x="300" y="520" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" font-weight="700" fill="#111827" letter-spacing="3">MK COSMETIC PAKISTAN</text>
</svg>`;
}

function writeSeedImage(filename, title, brand, accent, catLabel) {
  const seedDir = path.join(getUploadsDir(), "seed");
  fs.mkdirSync(seedDir, { recursive: true });
  const filePath = path.join(seedDir, filename);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, createProductSvg(title, brand, accent, catLabel), "utf8");
  }
  return `/uploads/seed/${filename}`;
}

export async function ensureSeeded() {
  const existingCategories = await Category.countDocuments();
  if (existingCategories > 0) {
    return;
  }

  console.log("[Seed] Initializing MK COSMETIC marketplace database...");

  await MarketplaceSetting.create({
    key: "global",
    defaultCommissionRate: 10,
    flatShippingFee: 200,
    freeShippingThreshold: 3500,
    minWithdrawalAmount: 1000,
  });

  const adminPass = await bcrypt.hash("Admin@12345", 10);
  const sellerPass = await bcrypt.hash("Seller@12345", 10);
  const custPass = await bcrypt.hash("Customer@12345", 10);

  const adminUser = await User.create({
    name: "MK Platform Admin",
    email: "admin@mkcosmetic.pk",
    phone: "0300-1112233",
    passwordHash: adminPass,
    role: "admin",
  });

  const customer1 = await User.create({
    name: "Ayesha Khan",
    email: "ayesha@example.pk",
    phone: "0321-4567890",
    passwordHash: custPass,
    role: "customer",
    addresses: [
      {
        fullName: "Ayesha Khan",
        phone: "0321-4567890",
        city: "Lahore",
        area: "DHA Phase 5",
        streetAddress: "House 42, Street 7, Sector K",
        postalCode: "54792",
        isDefault: true,
      },
    ],
  });

  const customer2 = await User.create({
    name: "Zainab Malik",
    email: "zainab@example.pk",
    phone: "0333-9876543",
    passwordHash: custPass,
    role: "customer",
  });

  const sellerSeeds = [
    {
      name: "Mahnoor Tariq",
      email: "glamaura@mkcosmetic.pk",
      phone: "0301-2233445",
      shopName: "GlamAura Karachi",
      city: "Karachi",
      description: "100% authentic luxury makeup, matte lipsticks, and studio foundations shipped nationwide from Clifton, Karachi.",
      status: "approved",
      commissionRate: 10,
      isFeatured: true,
    },
    {
      name: "Hira Siddiqui",
      email: "noorbotanics@mkcosmetic.pk",
      phone: "0322-5566778",
      shopName: "Noor Botanics Lahore",
      city: "Lahore",
      description: "Dermatologist-tested Vitamin C serums, niacinamide glow drops, and hydrating moisturizers formulated for South Asian skin.",
      status: "approved",
      commissionRate: 10,
      isFeatured: true,
    },
    {
      name: "Sana Raza",
      email: "velvetrose@mkcosmetic.pk",
      phone: "0345-8899001",
      shopName: "Velvet & Rose Islamabad",
      city: "Islamabad",
      description: "Long-lasting floral perfumes, oud mists, keratin haircare, and salon-grade beauty accessories.",
      status: "approved",
      commissionRate: 12,
      isFeatured: true,
    },
    {
      name: "Fariha Sheikh",
      email: "silktouch@mkcosmetic.pk",
      phone: "0312-4455667",
      shopName: "SilkTouch Studio",
      city: "Rawalpindi",
      description: "Trendy nail lacquers, gentle cleansers, and everyday beauty essentials at honest PKR prices.",
      status: "approved",
      commissionRate: null,
      isFeatured: true,
    },
    {
      name: "Kiran Waheed",
      email: "pending@mkcosmetic.pk",
      phone: "0308-7766554",
      shopName: "GlowCraft Multan",
      city: "Multan",
      description: "Herbal ubtan masks, rosewater toners, and organic skincare.",
      status: "pending",
      commissionRate: null,
      isFeatured: false,
    },
  ];

  const sellers = [];
  for (const s of sellerSeeds) {
    const u = await User.create({
      name: s.name,
      email: s.email,
      phone: s.phone,
      passwordHash: sellerPass,
      role: "seller",
    });
    const sellerDoc = await Seller.create({
      userId: u._id,
      shopName: s.shopName,
      slug: slugify(s.shopName),
      description: s.description,
      city: s.city,
      phone: s.phone,
      status: s.status,
      commissionRate: s.commissionRate,
      isFeatured: s.isFeatured,
      payoutAccount: {
        preferredMethod: "BankTransfer",
        accountTitle: s.name,
        accountNumber: "0109-88776655",
        bankName: "HBL",
      },
      logo: writeSeedImage(`seller-${slugify(s.shopName)}.svg`, s.shopName, "VERIFIED", "#db2777", s.city),
    });
    sellers.push(sellerDoc);
  }

  const categoryNames = [
    { name: "Makeup", icon: "palette", desc: "Eyeshadows, blushes, primers & palettes" },
    { name: "Skincare", icon: "sparkles", desc: "Daily glow routines & treatments" },
    { name: "Haircare", icon: "wind", desc: "Shampoos, keratin masks & hair serums" },
    { name: "Perfumes", icon: "gem", desc: "Eau de parfum, body mists & oud" },
    { name: "Lipsticks", icon: "heart", desc: "Matte, satin & liquid lip shades" },
    { name: "Foundations", icon: "droplet", desc: "Full-coverage & dewy skin tints" },
    { name: "Face Wash", icon: "sun", desc: "Gentle foaming & salicylic cleansers" },
    { name: "Serums", icon: "flask", desc: "Vitamin C, niacinamide & hyaluronic" },
    { name: "Moisturizers", icon: "cloud", desc: "Ceramide & oil-free gel creams" },
    { name: "Beauty Accessories", icon: "brush", desc: "Brushes, sponges, curlers & pouches" },
    { name: "Nail Products", icon: "star", desc: "Gel polishes, nail care & removers" },
  ];

  const categories = [];
  for (let i = 0; i < categoryNames.length; i++) {
    const c = categoryNames[i];
    const doc = await Category.create({
      name: c.name,
      slug: slugify(c.name),
      description: c.desc,
      icon: c.icon,
      sortOrder: i + 1,
      image: writeSeedImage(`cat-${slugify(c.name)}.svg`, c.name, "MK COSMETIC", "#ec4899", "CATEGORY"),
    });
    categories.push(doc);
  }

  const catByName = Object.fromEntries(categories.map((c) => [c.name, c]));

  const productData = [
    {
      sellerIdx: 0,
      cat: "Lipsticks",
      title: "Velvet Matte Liquid Lipstick — Rose Nude",
      brand: "GlamAura",
      price: 1650,
      discount: 25,
      stock: 48,
      sold: 214,
      tags: ["flash_sale", "best_selling", "special_discount"],
      variants: ["01 Rose Nude", "04 Crimson Silk", "07 Mocha Spice"],
      accent: "#db2777",
      desc: "Transfer-proof 12-hour velvet matte liquid lipstick enriched with vitamin E and sweet almond oil.",
    },
    {
      sellerIdx: 0,
      cat: "Foundations",
      title: "Silk Finish HD Liquid Foundation SPF 25",
      brand: "GlamAura",
      price: 3800,
      discount: 20,
      stock: 32,
      sold: 165,
      tags: ["trending", "best_selling", "special_discount"],
      variants: ["Ivory 110", "Warm Beige 220", "Golden Tan 310"],
      accent: "#be185d",
      desc: "Buildable medium-to-full coverage foundation tailored for humid Pakistani summers with zero flashback.",
    },
    {
      sellerIdx: 0,
      cat: "Makeup",
      title: "24-Shade Bridal & Glam Eyeshadow Palette",
      brand: "GlamAura",
      price: 4500,
      discount: 30,
      stock: 22,
      sold: 128,
      tags: ["flash_sale", "trending", "special_discount"],
      variants: ["Rosewood Edition", "Champagne Gold"],
      accent: "#ec4899",
      desc: "Highly pigmented matte and shimmer pressed pigments with creamy blendability for party and bridal looks.",
    },
    {
      sellerIdx: 1,
      cat: "Serums",
      title: "15% Vitamin C + Ferulic Brightening Serum",
      brand: "Noor Botanics",
      price: 2600,
      discount: 20,
      stock: 64,
      sold: 340,
      tags: ["flash_sale", "best_selling", "trending"],
      variants: ["30ml Dropper", "50ml Value"],
      accent: "#f43f5e",
      desc: "Stabilized L-ascorbic acid serum that visibly fades dark spots, evens tone, and boosts natural radiance.",
    },
    {
      sellerIdx: 1,
      cat: "Face Wash",
      title: "Salicylic + Tea Tree Pore Purifying Face Wash",
      brand: "Noor Botanics",
      price: 1250,
      discount: 15,
      stock: 80,
      sold: 290,
      tags: ["best_selling", "special_discount"],
      variants: ["150ml Tube"],
      accent: "#10b981",
      desc: "Sulfate-free foaming cleanser formulated to unclog pores and control excess sebum without stripping skin.",
    },
    {
      sellerIdx: 1,
      cat: "Moisturizers",
      title: "Ceramide + Hyaluronic Barrier Gel Cream",
      brand: "Noor Botanics",
      price: 2200,
      discount: 10,
      stock: 55,
      sold: 192,
      tags: ["trending", "new_arrival"],
      variants: ["50g Jar", "100g Tube"],
      accent: "#ec4899",
      desc: "Featherlight oil-free moisturizer delivering 48-hour hydration and soothing skin barrier repair.",
    },
    {
      sellerIdx: 1,
      cat: "Skincare",
      title: "Invisible Broad-Spectrum Sunblock SPF 60 PA++++",
      brand: "Noor Botanics",
      price: 1850,
      discount: 20,
      stock: 72,
      sold: 410,
      tags: ["flash_sale", "best_selling", "trending"],
      variants: ["60ml Matte Finish"],
      accent: "#f59e0b",
      desc: "Zero white-cast gel sunscreen engineered for everyday wear under makeup in sunny climates.",
    },
    {
      sellerIdx: 2,
      cat: "Perfumes",
      title: "Velvet Rose & White Oud Eau de Parfum 100ml",
      brand: "Velvet & Rose",
      price: 6200,
      discount: 22,
      stock: 19,
      sold: 98,
      tags: ["flash_sale", "trending", "special_discount"],
      variants: ["100ml EDP", "50ml Travel"],
      accent: "#9d174d",
      desc: "Long-lasting signature Pakistani luxury fragrance blending Damask rose, saffron, and warm white oud.",
    },
    {
      sellerIdx: 2,
      cat: "Haircare",
      title: "Argan & Keratin Frizz-Control Hair Serum",
      brand: "Velvet & Rose",
      price: 1950,
      discount: 15,
      stock: 44,
      sold: 154,
      tags: ["best_selling", "new_arrival"],
      variants: ["100ml Pump"],
      accent: "#db2777",
      desc: "Heat-protectant Moroccan argan oil serum that tames frizz and restores glossy shine from first use.",
    },
    {
      sellerIdx: 2,
      cat: "Beauty Accessories",
      title: "12-Piece Rose Gold Luxury Makeup Brush Set",
      brand: "Velvet & Rose",
      price: 3200,
      discount: 25,
      stock: 30,
      sold: 145,
      tags: ["flash_sale", "special_discount"],
      variants: ["Pink & Rose Gold + Pouch"],
      accent: "#ec4899",
      desc: "Ultra-soft cruelty-free synthetic bristles for seamless foundation, contour, blush, and eye blending.",
    },
    {
      sellerIdx: 3,
      cat: "Nail Products",
      title: "High-Gloss Gel Effect Nail Lacquer Trio",
      brand: "SilkTouch",
      price: 1350,
      discount: 18,
      stock: 60,
      sold: 176,
      tags: ["new_arrival", "special_discount"],
      variants: ["Blush Pink Set", "French Classic"],
      accent: "#f472b6",
      desc: "Chip-resistant, fast-drying nail polish trio with salon-like mirror shine.",
    },
    {
      sellerIdx: 3,
      cat: "Lipsticks",
      title: "HydraPlump Satin Lip Balm Tint",
      brand: "SilkTouch",
      price: 990,
      discount: 10,
      stock: 90,
      sold: 230,
      tags: ["new_arrival", "trending"],
      variants: ["Peach Sorbet", "Berry Kiss"],
      accent: "#e11d48",
      desc: "Nourishing shea butter tinted lip balm that leaves a soft glossy flush.",
    },
    {
      sellerIdx: 3,
      cat: "Beauty Accessories",
      title: "Latex-Free Teardrop Beauty Blender Duo",
      brand: "SilkTouch",
      price: 750,
      discount: 20,
      stock: 110,
      sold: 310,
      tags: ["best_selling", "special_discount"],
      variants: ["Hot Pink + Black"],
      accent: "#db2777",
      desc: "Ultra-bouncy makeup sponges for airbrushed concealer and foundation blending.",
    },
    {
      sellerIdx: 0,
      cat: "Makeup",
      title: "Waterproof Kajal & Precision Wing Eyeliner",
      brand: "GlamAura",
      price: 1150,
      discount: 15,
      stock: 52,
      sold: 205,
      tags: ["trending", "best_selling"],
      variants: ["Jet Black"],
      accent: "#111827",
      desc: "Smudge-proof 24-hour intense carbon black felt-tip liner for crisp winged eyes.",
    },
    {
      sellerIdx: 1,
      cat: "Serums",
      title: "10% Niacinamide + Zinc Blemish Control Drops",
      brand: "Noor Botanics",
      price: 1890,
      discount: 12,
      stock: 46,
      sold: 184,
      tags: ["new_arrival", "trending"],
      variants: ["30ml Bottle"],
      accent: "#db2777",
      desc: "Minimizes enlarged pores, balances oil production, and calms redness.",
    },
    {
      sellerIdx: 2,
      cat: "Perfumes",
      title: "Midnight Jasmine & Vanilla Body Mist 250ml",
      brand: "Velvet & Rose",
      price: 2100,
      discount: 10,
      stock: 38,
      sold: 112,
      tags: ["new_arrival"],
      variants: ["250ml Spray"],
      accent: "#be185d",
      desc: "Refreshing everyday floral-gourmand mist ideal for summer wear.",
    },
    {
      sellerIdx: 3,
      cat: "Haircare",
      title: "Biotin & Rosemary Root Strengthening Shampoo",
      brand: "SilkTouch",
      price: 1600,
      discount: 15,
      stock: 40,
      sold: 88,
      tags: ["new_arrival", "special_discount"],
      variants: ["300ml Bottle"],
      accent: "#059669",
      desc: "Gentle paraben-free cleanser formulated to reduce hair fall and nourish the scalp.",
    },
    {
      sellerIdx: 0,
      cat: "Foundations",
      title: "Dewy Skin Tint CC Cream SPF 30",
      brand: "GlamAura",
      price: 2450,
      discount: 10,
      stock: 25,
      sold: 67,
      tags: ["new_arrival"],
      variants: ["Light-Medium", "Medium-Tan"],
      accent: "#ec4899",
      desc: "Breathable everyday tint with hyaluronic acid for a natural glass-skin glow.",
    },
    // Pending product for Admin moderation queue
    {
      sellerIdx: 2,
      cat: "Skincare",
      title: "24K Gold Collagen Under-Eye Hydrogel Patches",
      brand: "Velvet & Rose",
      price: 1750,
      discount: 10,
      stock: 30,
      sold: 0,
      tags: ["new_arrival"],
      accent: "#d97706",
      approvalStatus: "pending",
      desc: "Cooling hydrogel eye patches infused with peptides to depuff and brighten tired eyes.",
    },
  ];

  const createdProducts = [];
  for (const p of productData) {
    const seller = sellers[p.sellerIdx];
    const category = catByName[p.cat];
    const slug = slugify(p.title);
    const imgUrl = writeSeedImage(
      `prod-${slug}.svg`,
      p.title,
      p.brand,
      p.accent || "#ec4899",
      p.cat.toUpperCase()
    );

    const doc = await Product.create({
      sellerId: seller._id,
      categoryId: category._id,
      title: p.title,
      slug,
      brand: p.brand,
      description: p.desc,
      price: p.price,
      discountPercent: p.discount,
      salePrice: Math.round(p.price * (1 - p.discount / 100)),
      stock: p.stock,
      sku: `MK-${slug.slice(0, 6).toUpperCase()}`,
      images: [imgUrl],
      variants: p.variants || [],
      tags: p.tags,
      approvalStatus: p.approvalStatus || "approved",
      soldCount: p.sold,
      ratingAvg: p.sold > 0 ? 4.7 : 0,
      reviewCount: p.sold > 0 ? 2 : 0,
    });
    createdProducts.push(doc);
  }

  // Homepage Promotional Banners
  await Banner.insertMany([
    {
      title: "Pakistan's Pink Beauty Fest — Up to 35% Off",
      subtitle: "Verified sellers from Karachi, Lahore & Islamabad. Authentic cosmetics delivered to your doorstep.",
      badgeText: "FLASH BEAUTY SALE",
      ctaText: "Shop Flash Deals",
      ctaLink: "/shop?tag=flash_sale",
      themeColor: "#db2777",
      sortOrder: 1,
      isActive: true,
    },
    {
      title: "Glow Season Skincare — Serums, SPF & Moisturizers",
      subtitle: "Dermatologist-loved formulas in PKR with Cash on Delivery nationwide.",
      badgeText: "SKINCARE ESSENTIALS",
      ctaText: "Explore Skincare",
      ctaLink: "/shop?category=skincare",
      themeColor: "#111827",
      sortOrder: 2,
      isActive: true,
    },
    {
      title: "Start Your Cosmetics Store on MK COSMETIC",
      subtitle: "Reach beauty shoppers across Pakistan with transparent commissions and automated payouts.",
      badgeText: "BECOME A SELLER",
      ctaText: "Open Your Shop",
      ctaLink: "/auth/seller-register",
      themeColor: "#be185d",
      sortOrder: 3,
      isActive: true,
    },
  ]);

  // Coupons
  await Coupon.insertMany([
    {
      code: "MKBEAUTY10",
      description: "10% off across all cosmetics categories (up to Rs. 800)",
      discountType: "percent",
      discountValue: 10,
      minOrderAmount: 1500,
      maxDiscount: 800,
      usageLimit: 500,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
    {
      code: "PAKGLOW300",
      description: "Flat Rs. 300 off on orders above Rs. 2,500",
      discountType: "fixed",
      discountValue: 300,
      minOrderAmount: 2500,
      maxDiscount: 300,
      usageLimit: 500,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
  ]);

  // Seed 2 realistic multi-vendor historical orders so Customer, Seller & Admin dashboards show real DB records
  const lip = createdProducts[0]; // GlamAura (seller 0)
  const serum = createdProducts[3]; // Noor Botanics (seller 1)
  const perfume = createdProducts[7]; // Velvet & Rose (seller 2)

  const order1Subtotal = lip.salePrice + serum.salePrice;
  const order1 = await Order.create({
    orderNumber: "MK-261125-SEED01",
    customerId: customer1._id,
    shippingAddress: {
      fullName: "Ayesha Khan",
      phone: "0321-4567890",
      city: "Lahore",
      area: "DHA Phase 5",
      streetAddress: "House 42, Street 7, Sector K",
    },
    paymentMethod: "COD",
    paymentStatus: "paid",
    subtotal: order1Subtotal,
    discountAmount: 0,
    shippingFee: 0,
    totalAmount: order1Subtotal,
  });

  const sub1Comm = Math.round(lip.salePrice * 0.1);
  const sub1Earn = lip.salePrice - sub1Comm;
  const sub1 = await Suborder.create({
    suborderNumber: "MKS-261125-A1",
    orderId: order1._id,
    customerId: customer1._id,
    sellerId: sellers[0]._id,
    items: [
      {
        productId: lip._id,
        title: lip.title,
        image: lip.images[0],
        variant: "01 Rose Nude",
        qty: 1,
        unitPrice: lip.salePrice,
        lineTotal: lip.salePrice,
      },
    ],
    subtotal: lip.salePrice,
    discountShare: 0,
    commissionRate: 10,
    commissionAmount: sub1Comm,
    sellerEarnings: sub1Earn,
    status: "Delivered",
    trackingNumber: "TCS-7788991",
    courierName: "TCS Express",
    statusHistory: [
      { status: "Pending", note: "Order placed", updatedByRole: "customer" },
      { status: "Shipped", note: "Dispatched via TCS", updatedByRole: "seller" },
      { status: "Delivered", note: "Delivered to customer", updatedByRole: "seller" },
    ],
  });

  const sub2Comm = Math.round(serum.salePrice * 0.1);
  const sub2Earn = serum.salePrice - sub2Comm;
  const sub2 = await Suborder.create({
    suborderNumber: "MKS-261125-A2",
    orderId: order1._id,
    customerId: customer1._id,
    sellerId: sellers[1]._id,
    items: [
      {
        productId: serum._id,
        title: serum.title,
        image: serum.images[0],
        variant: "30ml Dropper",
        qty: 1,
        unitPrice: serum.salePrice,
        lineTotal: serum.salePrice,
      },
    ],
    subtotal: serum.salePrice,
    discountShare: 0,
    commissionRate: 10,
    commissionAmount: sub2Comm,
    sellerEarnings: sub2Earn,
    status: "Delivered",
    trackingNumber: "LEOP-441122",
    courierName: "Leopards Courier",
    statusHistory: [
      { status: "Pending", note: "Order placed", updatedByRole: "customer" },
      { status: "Delivered", note: "Delivered to customer", updatedByRole: "seller" },
    ],
  });

  order1.suborderIds = [sub1._id, sub2._id];
  await order1.save();

  await Commission.insertMany([
    {
      orderId: order1._id,
      suborderId: sub1._id,
      sellerId: sellers[0]._id,
      grossAmount: lip.salePrice,
      commissionRate: 10,
      commissionAmount: sub1Comm,
      sellerEarnings: sub1Earn,
      status: "credited",
      creditedAt: new Date(),
    },
    {
      orderId: order1._id,
      suborderId: sub2._id,
      sellerId: sellers[1]._id,
      grossAmount: serum.salePrice,
      commissionRate: 10,
      commissionAmount: sub2Comm,
      sellerEarnings: sub2Earn,
      status: "credited",
      creditedAt: new Date(),
    },
  ]);

  await Seller.findByIdAndUpdate(sellers[0]._id, {
    availableBalance: sub1Earn,
    totalEarnings: sub1Earn,
  });
  await Seller.findByIdAndUpdate(sellers[1]._id, {
    availableBalance: sub2Earn,
    totalEarnings: sub2Earn,
  });

  await Payment.create({
    orderId: order1._id,
    customerId: customer1._id,
    method: "COD",
    amount: order1Subtotal,
    currency: "PKR",
    status: "paid",
    gatewayProvider: "COD",
    paidAt: new Date(),
    verifiedByAdminId: adminUser._id,
  });

  // Order 2: Pending / Shipped order for Seller 2
  const order2 = await Order.create({
    orderNumber: "MK-261125-SEED02",
    customerId: customer2._id,
    shippingAddress: {
      fullName: "Zainab Malik",
      phone: "0333-9876543",
      city: "Islamabad",
      area: "F-10 Markaz",
      streetAddress: "Flat 9, Street 14",
    },
    paymentMethod: "BankTransfer",
    paymentStatus: "awaiting_verification",
    subtotal: perfume.salePrice,
    discountAmount: 0,
    shippingFee: 0,
    totalAmount: perfume.salePrice,
  });

  const sub3Comm = Math.round(perfume.salePrice * 0.12);
  const sub3Earn = perfume.salePrice - sub3Comm;
  const sub3 = await Suborder.create({
    suborderNumber: "MKS-261125-B1",
    orderId: order2._id,
    customerId: customer2._id,
    sellerId: sellers[2]._id,
    items: [
      {
        productId: perfume._id,
        title: perfume.title,
        image: perfume.images[0],
        variant: "100ml EDP",
        qty: 1,
        unitPrice: perfume.salePrice,
        lineTotal: perfume.salePrice,
      },
    ],
    subtotal: perfume.salePrice,
    discountShare: 0,
    commissionRate: 12,
    commissionAmount: sub3Comm,
    sellerEarnings: sub3Earn,
    status: "Processing",
    statusHistory: [
      { status: "Pending", note: "Order placed", updatedByRole: "customer" },
      { status: "Processing", note: "Packing gift box", updatedByRole: "seller" },
    ],
  });

  order2.suborderIds = [sub3._id];
  await order2.save();

  await Commission.create({
    orderId: order2._id,
    suborderId: sub3._id,
    sellerId: sellers[2]._id,
    grossAmount: perfume.salePrice,
    commissionRate: 12,
    commissionAmount: sub3Comm,
    sellerEarnings: sub3Earn,
    status: "pending",
  });

  await Seller.findByIdAndUpdate(sellers[2]._id, { pendingBalance: sub3Earn });

  await Payment.create({
    orderId: order2._id,
    customerId: customer2._id,
    method: "BankTransfer",
    amount: perfume.salePrice,
    currency: "PKR",
    status: "awaiting_verification",
    gatewayProvider: "BankTransfer",
    transactionRef: "IBFT-9928371",
    proofNote: "Customer transferred via Meezan IBFT.",
  });

  // Reviews
  await Review.insertMany([
    {
      productId: lip._id,
      sellerId: sellers[0]._id,
      customerId: customer1._id,
      orderId: order1._id,
      rating: 5,
      title: "Genuinely long-lasting matte shade!",
      comment: "Rose Nude looks gorgeous on medium Pakistani skin tones and stayed put after dinner. Fast Karachi-to-Lahore delivery.",
      verifiedPurchase: true,
    },
    {
      productId: serum._id,
      sellerId: sellers[1]._id,
      customerId: customer1._id,
      orderId: order1._id,
      rating: 5,
      title: "Visible glow in two weeks",
      comment: "Lightweight, absorbs quickly, and authentic sealed packaging from Noor Botanics.",
      verifiedPurchase: true,
    },
    {
      productId: perfume._id,
      sellerId: sellers[2]._id,
      customerId: customer2._id,
      rating: 5,
      title: "Luxurious oud & rose projection",
      comment: "Lasts 8+ hours on clothes. Worth every rupee in PKR!",
      verifiedPurchase: false,
    },
  ]);

  console.log("[Seed] Seeded categories, sellers, products, banners, coupons, orders, and reviews.");
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename);
if (isDirectRun) {
  connectDB()
    .then(async () => {
      await ensureSeeded();
      await disconnectDB();
      process.exit(0);
    })
    .catch((err) => {
      console.error("[Seed Error]", err);
      process.exit(1);
    });
}
