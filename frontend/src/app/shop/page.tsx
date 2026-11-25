"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter, Search } from "lucide-react";
import { apiFetch } from "@/lib/api";
import ProductCard from "@/components/ProductCard";

function ShopCatalogInner() {
  const router = useRouter();
  const params = useSearchParams();

  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState(params.get("q") || "");
  const [category, setCategory] = useState(params.get("category") || "");
  const [tag, setTag] = useState(params.get("tag") || "");
  const [sort, setSort] = useState(params.get("sort") || "popular");
  const [minPrice, setMinPrice] = useState(params.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(params.get("maxPrice") || "");
  const [minDiscount, setMinDiscount] = useState(params.get("minDiscount") || "");

  useEffect(() => {
    setQ(params.get("q") || "");
    setCategory(params.get("category") || "");
    setTag(params.get("tag") || "");
    setSort(params.get("sort") || "popular");
    setMinDiscount(params.get("minDiscount") || "");
  }, [params]);

  useEffect(() => {
    apiFetch<{ categories: any[] }>("/storefront/categories")
      .then((res) => setCategories(res.categories))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (category) sp.set("category", category);
    if (tag) sp.set("tag", tag);
    if (sort) sp.set("sort", sort);
    if (minPrice) sp.set("minPrice", minPrice);
    if (maxPrice) sp.set("maxPrice", maxPrice);
    if (minDiscount) sp.set("minDiscount", minDiscount);

    apiFetch<{ products: any[]; total: number }>(`/storefront/products?${sp.toString()}`)
      .then((res) => {
        setProducts(res.products);
        setTotal(res.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [q, category, tag, sort, minPrice, maxPrice, minDiscount]);

  const clearFilters = () => {
    setQ("");
    setCategory("");
    setTag("");
    setSort("popular");
    setMinPrice("");
    setMaxPrice("");
    setMinDiscount("");
    router.push("/shop");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-zinc-900">Explore MK COSMETIC Catalog</h1>
          <p className="text-sm text-zinc-500">
            Showing {total} authentic beauty products in PKR from verified Pakistani sellers
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-zinc-600">Sort by:</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-3 py-2 text-sm bg-white border border-zinc-300 rounded-xl"
          >
            <option value="popular">Best Selling / Popular</option>
            <option value="newest">New Arrivals</option>
            <option value="price_asc">Price: Low to High (PKR)</option>
            <option value="price_desc">Price: High to Low (PKR)</option>
            <option value="rating">Top Rated</option>
            <option value="discount">Biggest Discounts</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Filters Sidebar */}
        <aside className="lg:col-span-3 bg-white border border-zinc-200 rounded-2xl p-4 h-fit space-y-5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-pink-600" /> Filters
            </span>
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-semibold text-pink-600 hover:underline"
            >
              Reset All
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-600 mb-1.5">Search Keyword</label>
            <div className="relative">
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Lipstick, serum..."
                className="w-full pl-8 pr-3 py-2 text-sm border border-zinc-300 rounded-xl"
              />
              <Search className="w-4 h-4 text-zinc-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-600 mb-1.5">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-xl bg-white"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-600 mb-1.5">Collection Tag</label>
            <select
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-xl bg-white"
            >
              <option value="">All Collections</option>
              <option value="flash_sale">Flash Sale</option>
              <option value="trending">Trending</option>
              <option value="best_selling">Best Selling</option>
              <option value="new_arrival">New Arrivals</option>
              <option value="special_discount">Special Discounts</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-600 mb-1.5">Price Range (PKR)</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Min Rs."
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="px-2.5 py-2 text-sm border border-zinc-300 rounded-xl"
              />
              <input
                type="number"
                placeholder="Max Rs."
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="px-2.5 py-2 text-sm border border-zinc-300 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-600 mb-1.5">Minimum Discount %</label>
            <select
              value={minDiscount}
              onChange={(e) => setMinDiscount(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-xl bg-white"
            >
              <option value="">Any</option>
              <option value="10">10% or more</option>
              <option value="15">15% or more</option>
              <option value="20">20% or more</option>
              <option value="25">25% or more</option>
            </select>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="lg:col-span-9">
          {loading ? (
            <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center text-zinc-500 text-sm">
              Loading cosmetics...
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center">
              <h3 className="font-bold text-lg text-zinc-900 mb-1">No products matched your filters</h3>
              <p className="text-sm text-zinc-500 mb-4">Try clearing filters or searching another beauty product.</p>
              <button
                type="button"
                onClick={clearFilters}
                className="px-5 py-2.5 rounded-xl bg-pink-600 text-white text-sm font-bold"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {products.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm text-zinc-500">Loading catalog...</div>}>
      <ShopCatalogInner />
    </Suspense>
  );
}
