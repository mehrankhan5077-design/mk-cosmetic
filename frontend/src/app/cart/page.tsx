"use client";

import React from "react";
import Link from "next/link";
import { ShoppingBag, Store, Trash2 } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { assetUrl, formatPKR } from "@/lib/api";

export default function CartPage() {
  const { cart, cartSubtotal, updateCartQty, removeFromCart } = useStore();

  // Group cart items by seller so customer sees multi-vendor packages clearly
  const grouped = cart.reduce<Record<string, { sellerName: string; sellerSlug: string; items: typeof cart }>>(
    (acc, item) => {
      const key = item.sellerId || item.sellerName;
      if (!acc[key]) {
        acc[key] = { sellerName: item.sellerName, sellerSlug: item.sellerSlug, items: [] };
      }
      acc[key].items.push(item);
      return acc;
    },
    {}
  );

  const shippingFee = cartSubtotal >= 3500 || cartSubtotal === 0 ? 0 : 200;

  if (cart.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-pink-50 text-pink-600 mx-auto flex items-center justify-center mb-4">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black mb-2">Your MK COSMETIC Cart is Empty</h1>
        <p className="text-sm text-zinc-500 mb-6">
          Discover lipsticks, skincare serums, perfumes, and more from verified Pakistani sellers.
        </p>
        <Link
          href="/shop"
          className="inline-block px-6 py-3 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-sm"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black mb-6">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          {Object.entries(grouped).map(([key, group]) => (
            <div key={key} className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 bg-pink-50/70 border-b border-pink-100 flex items-center justify-between text-xs font-bold text-zinc-800">
                <span className="flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-pink-600" />
                  Package by {group.sellerName}
                </span>
                <span className="text-pink-600">{group.items.length} item(s)</span>
              </div>

              <div className="divide-y divide-zinc-100">
                {group.items.map((item) => (
                  <div
                    key={`${item.productId}-${item.variant}`}
                    className="p-4 flex flex-wrap sm:flex-nowrap items-center gap-4"
                  >
                    <img
                      src={assetUrl(item.image)}
                      alt={item.title}
                      className="w-20 h-20 rounded-xl object-cover bg-pink-50 border border-zinc-100 shrink-0"
                    />
                    <div className="flex-1 min-w-[180px]">
                      <Link
                        href={`/product/${item.slug}`}
                        className="font-bold text-sm text-zinc-900 hover:text-pink-600"
                      >
                        {item.title}
                      </Link>
                      <div className="text-xs text-zinc-500 mt-0.5">
                        {item.brand} · Variant: {item.variant}
                      </div>
                      <div className="text-sm font-black text-pink-600 mt-1 tabular-nums">
                        {formatPKR(item.salePrice)}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center border border-zinc-300 rounded-lg">
                        <button
                          type="button"
                          onClick={() =>
                            updateCartQty(item.productId, item.variant, item.qty - 1)
                          }
                          className="px-2.5 py-1 text-sm font-bold hover:bg-zinc-100"
                        >
                          -
                        </button>
                        <span className="px-3 text-sm font-bold tabular-nums">{item.qty}</span>
                        <button
                          type="button"
                          onClick={() =>
                            updateCartQty(item.productId, item.variant, item.qty + 1)
                          }
                          className="px-2.5 py-1 text-sm font-bold hover:bg-zinc-100"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.productId, item.variant)}
                        className="p-2 text-zinc-400 hover:text-red-600"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <aside className="lg:col-span-4 bg-white border border-zinc-200 rounded-2xl p-5 h-fit space-y-4">
          <h2 className="text-lg font-black">Order Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-zinc-600">
              <span>Subtotal</span>
              <span className="font-bold text-zinc-900 tabular-nums">{formatPKR(cartSubtotal)}</span>
            </div>
            <div className="flex justify-between text-zinc-600">
              <span>Delivery Fee</span>
              <span className="font-bold text-zinc-900 tabular-nums">
                {shippingFee === 0 ? "FREE" : formatPKR(shippingFee)}
              </span>
            </div>
            {cartSubtotal < 3500 && (
              <p className="text-xs text-pink-600 bg-pink-50 px-3 py-2 rounded-lg">
                Add {formatPKR(3500 - cartSubtotal)} more for free nationwide delivery!
              </p>
            )}
            <div className="border-t border-zinc-200 pt-3 flex justify-between text-base font-black">
              <span>Estimated Total</span>
              <span className="text-pink-600 tabular-nums">
                {formatPKR(cartSubtotal + shippingFee)}
              </span>
            </div>
          </div>

          <Link
            href="/checkout"
            className="block w-full text-center py-3.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-sm transition"
          >
            Proceed to Checkout
          </Link>
        </aside>
      </div>
    </div>
  );
}
