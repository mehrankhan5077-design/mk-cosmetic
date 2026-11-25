"use client";

import React, { use, useEffect, useState } from "react";
import { MapPin, Star, Store } from "lucide-react";
import { apiFetch, assetUrl } from "@/lib/api";
import ProductCard from "@/components/ProductCard";

export default function SellerShopPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [seller, setSeller] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ seller: any; products: any[] }>(`/storefront/sellers/${slug}`)
      .then((res) => {
        setSeller(res.seller);
        setProducts(res.products);
      })
      .catch(() => setSeller(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-16 text-center text-sm text-zinc-500">Loading seller shop...</div>;
  }

  if (!seller) {
    return <div className="max-w-3xl mx-auto px-4 py-16 text-center font-bold">Seller shop not found.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-gradient-to-r from-[#0f0f12] to-pink-900 text-white rounded-2xl p-6 sm:p-8 mb-8 flex flex-wrap items-center gap-6">
        <img
          src={assetUrl(seller.logo)}
          alt={seller.shopName}
          className="w-20 h-20 rounded-2xl object-cover bg-white p-1 shrink-0"
        />
        <div className="flex-1 min-w-[220px]">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase text-pink-300 mb-1">
            <Store className="w-3.5 h-3.5" /> Verified MK COSMETIC Seller
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mb-1">{seller.shopName}</h1>
          <p className="text-sm text-pink-100 max-w-2xl mb-3">{seller.description}</p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-200">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-pink-400" /> {seller.city}, Pakistan
            </span>
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />{" "}
              {seller.ratingAvg || "4.8"} ({seller.reviewCount || 0} reviews)
            </span>
            <span>{products.length} Active Products</span>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-black text-zinc-900 mb-4">Products from {seller.shopName}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((p) => (
          <ProductCard key={p._id} product={{ ...p, sellerId: seller }} />
        ))}
      </div>
    </div>
  );
}
