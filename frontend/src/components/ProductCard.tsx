"use client";

import React from "react";
import Link from "next/link";
import { Heart, ShoppingCart, Star, Store } from "lucide-react";
import { assetUrl, formatPKR } from "@/lib/api";
import { useStore } from "@/context/StoreContext";

export default function ProductCard({ product }: { product: any }) {
  const { addToCart, toggleWishlist, wishlistIds } = useStore();
  const isWishlisted = wishlistIds.includes(String(product._id));

  const sellerName = product.sellerId?.shopName || "Verified Shop";
  const sellerSlug = product.sellerId?.slug || "";
  const sellerId = typeof product.sellerId === "string" ? product.sellerId : product.sellerId?._id;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      productId: product._id,
      slug: product.slug,
      title: product.title,
      brand: product.brand,
      image: product.images?.[0] || "",
      salePrice: product.salePrice,
      price: product.price,
      discountPercent: product.discountPercent || 0,
      stock: product.stock,
      variant: product.variants?.[0] || "Standard",
      qty: 1,
      sellerId: String(sellerId || ""),
      sellerName,
      sellerSlug,
    });
  };

  return (
    <div className="group bg-white border border-zinc-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-pink-300 transition flex flex-col">
      <Link href={`/product/${product.slug}`} className="relative block aspect-square bg-pink-50/40 overflow-hidden">
        <img
          src={assetUrl(product.images?.[0])}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
        />

        {product.discountPercent > 0 && (
          <span className="absolute top-2.5 left-2.5 bg-pink-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow">
            -{product.discountPercent}%
          </span>
        )}

        {product.stock <= 0 && (
          <span className="absolute inset-0 bg-black/50 text-white font-bold text-xs flex items-center justify-center">
            OUT OF STOCK
          </span>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product._id);
          }}
          aria-label="Toggle wishlist"
          className={`absolute top-2.5 right-2.5 p-1.5 rounded-full shadow transition ${
            isWishlisted ? "bg-pink-600 text-white" : "bg-white/90 text-zinc-700 hover:text-pink-600"
          }`}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? "fill-current" : ""}`} />
        </button>
      </Link>

      <div className="p-3.5 flex flex-col flex-1 justify-between gap-2">
        <div>
          <div className="flex items-center justify-between gap-2 text-[11px] text-zinc-500 mb-1">
            <span className="font-semibold text-pink-600 uppercase truncate">{product.brand}</span>
            {sellerSlug ? (
              <Link
                href={`/seller/${sellerSlug}`}
                className="inline-flex items-center gap-1 hover:text-zinc-900 truncate"
              >
                <Store className="w-3 h-3 shrink-0" />
                <span className="truncate">{sellerName}</span>
              </Link>
            ) : (
              <span className="truncate">{sellerName}</span>
            )}
          </div>

          <Link href={`/product/${product.slug}`}>
            <h3 className="text-sm font-semibold text-zinc-900 line-clamp-2 hover:text-pink-600 transition min-h-[2.5rem]">
              {product.title}
            </h3>
          </Link>
        </div>

        <div>
          <div className="flex items-center gap-1 text-xs text-amber-500 mb-1.5">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span className="font-semibold text-zinc-800">{product.ratingAvg || "New"}</span>
            {product.reviewCount > 0 && (
              <span className="text-zinc-400">({product.reviewCount})</span>
            )}
            <span className="ml-auto text-[11px] text-zinc-400">{product.soldCount || 0} sold</span>
          </div>

          <div className="flex items-baseline gap-2 mb-2.5">
            <span className="text-base font-black text-pink-600 tabular-nums">
              {formatPKR(product.salePrice)}
            </span>
            {product.discountPercent > 0 && (
              <span className="text-xs text-zinc-400 line-through tabular-nums">
                {formatPKR(product.price)}
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={product.stock <= 0}
            onClick={handleAdd}
            className="w-full py-2 px-3 rounded-xl bg-zinc-900 hover:bg-pink-600 disabled:bg-zinc-300 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>{product.stock > 0 ? "Add to Cart" : "Out of Stock"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
