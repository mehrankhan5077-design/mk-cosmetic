"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  Tag,
  TrendingUp,
  Truck,
} from "lucide-react";
import { apiFetch, assetUrl } from "@/lib/api";
import ProductCard from "@/components/ProductCard";

export default function HomePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bannerIdx, setBannerIdx] = useState(0);
  const [countdown, setCountdown] = useState({ h: 5, m: 42, s: 18 });

  useEffect(() => {
    apiFetch("/storefront/home")
      .then((res) => setData(res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev.s > 0) return { ...prev, s: prev.s - 1 };
        if (prev.m > 0) return { ...prev, m: prev.m - 1, s: 59 };
        if (prev.h > 0) return { h: prev.h - 1, m: 59, s: 59 };
        return { h: 6, m: 0, s: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!data?.banners?.length) return;
    const t = setInterval(() => {
      setBannerIdx((i) => (i + 1) % data.banners.length);
    }, 5000);
    return () => clearInterval(t);
  }, [data?.banners?.length]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="inline-block w-10 h-10 border-4 border-pink-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm text-zinc-500">Loading MK COSMETIC marketplace...</p>
      </div>
    );
  }

  const banners = data?.banners || [];
  const activeBanner = banners[bannerIdx] || null;
  const categories = data?.categories || [];

  return (
    <div className="pb-12">
      {/* Hero Section: Daraz-style Category Sidebar + Promo Carousel */}
      <section className="max-w-7xl mx-auto px-4 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Category Mega-Sidebar */}
          <aside className="hidden lg:block lg:col-span-3 bg-white border border-zinc-200 rounded-2xl p-3 shadow-sm">
            <div className="text-xs font-extrabold uppercase tracking-wider text-pink-600 px-2 pb-2 border-b border-zinc-100 mb-1.5">
              Beauty Categories
            </div>
            <ul className="space-y-0.5">
              {categories.map((cat: any) => (
                <li key={cat._id}>
                  <Link
                    href={`/shop?category=${cat.slug}`}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm font-medium text-zinc-700 hover:bg-pink-50 hover:text-pink-700 transition"
                  >
                    <span>{cat.name}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                  </Link>
                </li>
              ))}
            </ul>
          </aside>

          {/* Promotional Banner Slider */}
          <div className="lg:col-span-9 relative rounded-2xl overflow-hidden shadow-md min-h-[300px] sm:min-h-[360px] flex items-center bg-[#0f0f12] text-white">
            {activeBanner && (
              <div
                className="w-full h-full p-7 sm:p-12 flex flex-col justify-center"
                style={{
                  background: `linear-gradient(125deg, #0f0f12 10%, ${activeBanner.themeColor || "#db2777"} 100%)`,
                }}
              >
                {activeBanner.image && (
                  <img
                    src={assetUrl(activeBanner.image)}
                    alt={activeBanner.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-25 pointer-events-none"
                  />
                )}
                <div className="relative z-10 max-w-xl">
                  <span className="inline-block px-3 py-1 rounded-full bg-white/15 border border-white/25 text-pink-200 text-xs font-bold tracking-wider mb-3">
                    {activeBanner.badgeText || "MK COSMETIC"}
                  </span>
                  <h1 className="text-2xl sm:text-4xl font-black leading-tight mb-3">
                    {activeBanner.title}
                  </h1>
                  <p className="text-sm sm:text-base text-pink-50/90 mb-6">
                    {activeBanner.subtitle}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={activeBanner.ctaLink || "/shop"}
                      className="px-6 py-3 rounded-xl bg-white text-black font-bold text-sm hover:bg-pink-100 transition shadow"
                    >
                      {activeBanner.ctaText || "Shop Now"}
                    </Link>
                    <Link
                      href="/auth/seller-register"
                      className="px-5 py-3 rounded-xl border border-white/40 text-white font-semibold text-sm hover:bg-white/10 transition"
                    >
                      Become a Seller
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {banners.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setBannerIdx((i) => (i - 1 + banners.length) % banners.length)}
                  aria-label="Previous banner"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setBannerIdx((i) => (i + 1) % banners.length)}
                  aria-label="Next banner"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Trust Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          {[
            { icon: ShieldCheck, title: "100% Verified Sellers", sub: "Admin-approved beauty shops" },
            { icon: Truck, title: "All-Pakistan Delivery", sub: "Cash on Delivery in PKR" },
            { icon: Tag, title: "Exclusive Flash Deals", sub: "Use coupon MKBEAUTY10" },
            { icon: Store, title: "Multi-Vendor Marketplace", sub: "Direct from independent brands" },
          ].map((b) => (
            <div
              key={b.title}
              className="bg-white border border-zinc-200 rounded-xl px-4 py-3 flex items-center gap-3"
            >
              <b.icon className="w-6 h-6 text-pink-600 shrink-0" />
              <div>
                <div className="text-xs sm:text-sm font-bold text-zinc-900">{b.title}</div>
                <div className="text-[11px] text-zinc-500">{b.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories Quick Grid */}
      <section className="max-w-7xl mx-auto px-4 mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-black text-zinc-900">Shop by Category</h2>
          <Link href="/shop" className="text-xs font-bold text-pink-600 hover:underline">
            View All →
          </Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-11 gap-2.5">
          {categories.map((cat: any) => (
            <Link
              key={cat._id}
              href={`/shop?category=${cat.slug}`}
              className="bg-white border border-zinc-200 rounded-xl p-2.5 text-center hover:border-pink-400 hover:shadow-md transition group"
            >
              <img
                src={assetUrl(cat.image)}
                alt={cat.name}
                className="w-12 h-12 mx-auto rounded-xl object-cover mb-2 bg-pink-50"
              />
              <div className="text-[11px] font-bold text-zinc-800 group-hover:text-pink-600 line-clamp-2">
                {cat.name}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Flash Sales */}
      {data?.flashSales?.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 mt-10">
          <div className="bg-gradient-to-r from-[#0f0f12] via-[#1f1020] to-pink-900 text-white rounded-2xl p-4 sm:p-5 mb-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Flame className="w-6 h-6 text-pink-400" />
              <div>
                <h2 className="text-lg sm:text-xl font-black">Flash Sales</h2>
                <p className="text-xs text-pink-200">Limited-time deals from top cosmetics shops</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="text-zinc-300">Ending in:</span>
              <span className="px-2.5 py-1 rounded bg-pink-600 tabular-nums">
                {String(countdown.h).padStart(2, "0")}h
              </span>
              <span className="px-2.5 py-1 rounded bg-pink-600 tabular-nums">
                {String(countdown.m).padStart(2, "0")}m
              </span>
              <span className="px-2.5 py-1 rounded bg-pink-600 tabular-nums">
                {String(countdown.s).padStart(2, "0")}s
              </span>
              <Link
                href="/shop?tag=flash_sale"
                className="ml-2 px-3 py-1.5 rounded-lg bg-white text-black hover:bg-pink-100"
              >
                Shop All
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {data.flashSales.map((p: any) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Trending Products */}
      <ProductSection
        title="Trending Now"
        icon={<TrendingUp className="w-5 h-5 text-pink-600" />}
        href="/shop?tag=trending"
        products={data?.trending || []}
      />

      {/* Best Selling */}
      <ProductSection
        title="Best-Selling Cosmetics"
        icon={<Star className="w-5 h-5 text-pink-600" />}
        href="/shop?tag=best_selling"
        products={data?.bestSelling || []}
      />

      {/* New Arrivals */}
      <ProductSection
        title="New Arrivals"
        icon={<Sparkles className="w-5 h-5 text-pink-600" />}
        href="/shop?sort=newest"
        products={data?.newArrivals || []}
      />

      {/* Special Discounts */}
      <ProductSection
        title="Special Discounts (15%+ Off)"
        icon={<Tag className="w-5 h-5 text-pink-600" />}
        href="/shop?minDiscount=15"
        products={data?.specialDiscounts || []}
      />

      {/* Featured Sellers */}
      {data?.featuredSellers?.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 mt-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-zinc-900">Featured Verified Sellers</h2>
              <p className="text-xs text-zinc-500">Independent Pakistani beauty boutiques on MK COSMETIC</p>
            </div>
            <Link href="/auth/seller-register" className="text-xs font-bold text-pink-600 hover:underline">
              Open Your Shop →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.featuredSellers.map((s: any) => (
              <Link
                key={s._id}
                href={`/seller/${s.slug}`}
                className="bg-white border border-zinc-200 rounded-2xl p-4 hover:border-pink-400 hover:shadow-md transition flex items-center gap-3.5"
              >
                <img
                  src={assetUrl(s.logo)}
                  alt={s.shopName}
                  className="w-14 h-14 rounded-xl object-cover bg-pink-50 border border-pink-100 shrink-0"
                />
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-zinc-900 truncate">{s.shopName}</h3>
                  <div className="text-xs text-zinc-500">{s.city}, Pakistan</div>
                  <div className="flex items-center gap-1 text-xs text-amber-500 mt-1">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="font-semibold text-zinc-800">{s.ratingAvg || "4.8"}</span>
                    <span className="text-zinc-400">({s.reviewCount || 0} reviews)</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Customer Reviews */}
      {data?.recentReviews?.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 mt-12">
          <h2 className="text-lg sm:text-xl font-black text-zinc-900 mb-4">
            Verified Customer Reviews
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.recentReviews.map((r: any) => (
              <div key={r._id} className="bg-white border border-zinc-200 rounded-2xl p-5">
                <div className="flex items-center gap-1 text-amber-500 mb-2">
                  {Array.from({ length: r.rating }).map((_, idx) => (
                    <Star key={idx} className="w-4 h-4 fill-current" />
                  ))}
                  {r.verifiedPurchase && (
                    <span className="ml-auto text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Verified Buyer
                    </span>
                  )}
                </div>
                {r.title && <h4 className="font-bold text-sm text-zinc-900 mb-1">{r.title}</h4>}
                <p className="text-sm text-zinc-600 mb-3">&ldquo;{r.comment}&rdquo;</p>
                <div className="text-xs text-zinc-500 flex items-center justify-between border-t border-zinc-100 pt-2.5">
                  <span className="font-semibold text-zinc-800">{r.customerId?.name || "Customer"}</span>
                  {r.productId?.slug && (
                    <Link href={`/product/${r.productId.slug}`} className="text-pink-600 hover:underline truncate max-w-[160px]">
                      {r.productId.title}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ProductSection({
  title,
  icon,
  href,
  products,
}: {
  title: string;
  icon: React.ReactNode;
  href: string;
  products: any[];
}) {
  if (!products.length) return null;
  return (
    <section className="max-w-7xl mx-auto px-4 mt-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-lg sm:text-xl font-black text-zinc-900">{title}</h2>
        </div>
        <Link href={href} className="text-xs font-bold text-pink-600 hover:underline">
          View More →
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((p) => (
          <ProductCard key={p._id} product={p} />
        ))}
      </div>
    </section>
  );
}
