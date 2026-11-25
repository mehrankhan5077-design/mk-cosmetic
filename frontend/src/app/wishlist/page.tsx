"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { apiFetch } from "@/lib/api";
import ProductCard from "@/components/ProductCard";

export default function WishlistPage() {
  const { user, wishlistIds } = useStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    apiFetch<{ user: any }>("/auth/me")
      .then((res) => setProducts(res.user?.wishlist || []))
      .finally(() => setLoading(false));
  }, [user, wishlistIds]);

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Heart className="w-12 h-12 text-pink-600 mx-auto mb-3" />
        <h1 className="text-2xl font-black mb-2">Sign In to View Your Wishlist</h1>
        <Link href="/auth/login" className="inline-block px-6 py-3 rounded-xl bg-pink-600 text-white text-sm font-bold">
          Login
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black mb-6">My Beauty Wishlist ({products.length})</h1>
      {loading ? (
        <p className="text-sm text-zinc-500">Loading wishlist...</p>
      ) : products.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center">
          <p className="text-sm text-zinc-500 mb-4">Your wishlist is empty.</p>
          <Link href="/shop" className="px-5 py-2.5 rounded-xl bg-pink-600 text-white text-sm font-bold">
            Explore Cosmetics
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
