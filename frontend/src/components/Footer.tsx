import React from "react";
import Link from "next/link";

const CATEGORIES = [
  "Makeup",
  "Skincare",
  "Haircare",
  "Perfumes",
  "Lipsticks",
  "Foundations",
  "Face Wash",
  "Serums",
  "Moisturizers",
  "Beauty Accessories",
  "Nail Products",
];

export default function Footer() {
  return (
    <footer className="bg-[#0f0f12] text-zinc-300 mt-16 border-t border-pink-900/40">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-lg bg-pink-600 text-white font-black flex items-center justify-center">
              MK
            </div>
            <div>
              <div className="text-white font-black text-lg leading-none">
                MK <span className="text-pink-400">COSMETIC</span>
              </div>
              <div className="text-[11px] text-zinc-400">Beauty Shopping Made Easy</div>
            </div>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Pakistan&apos;s dedicated multi-vendor beauty &amp; cosmetics marketplace. Independent verified
            beauty stores shipping nationwide in PKR.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="px-2.5 py-1 rounded bg-zinc-800 text-pink-300 font-semibold">COD Pakistan</span>
            <span className="px-2.5 py-1 rounded bg-zinc-800 text-zinc-200">JazzCash</span>
            <span className="px-2.5 py-1 rounded bg-zinc-800 text-zinc-200">Easypaisa</span>
            <span className="px-2.5 py-1 rounded bg-zinc-800 text-zinc-200">Bank Transfer</span>
          </div>
        </div>

        <div>
          <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-3">
            Popular Categories
          </h4>
          <div className="grid grid-cols-2 gap-1.5 text-sm">
            {CATEGORIES.map((c) => (
              <Link
                key={c}
                href={`/shop?category=${c.toLowerCase().replace(/\s+/g, "-")}`}
                className="text-zinc-400 hover:text-pink-400 transition"
              >
                {c}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-3">
            Customer Care
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/shop" className="hover:text-pink-400 transition">
                Browse All Cosmetics
              </Link>
            </li>
            <li>
              <Link href="/track" className="hover:text-pink-400 transition">
                Track Your Order
              </Link>
            </li>
            <li>
              <Link href="/orders" className="hover:text-pink-400 transition">
                Orders &amp; Return Requests
              </Link>
            </li>
            <li>
              <Link href="/wishlist" className="hover:text-pink-400 transition">
                My Wishlist
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-3">
            Sell &amp; Platform Portals
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/auth/seller-register" className="text-pink-400 font-semibold hover:underline">
                Register as Independent Seller
              </Link>
            </li>
            <li>
              <Link href="/seller/dashboard" className="hover:text-pink-400 transition">
                Seller Center Dashboard
              </Link>
            </li>
            <li>
              <Link href="/admin/dashboard" className="hover:text-pink-400 transition">
                Admin Control Panel
              </Link>
            </li>
            <li>
              <Link href="/auth/login" className="hover:text-pink-400 transition">
                Account Sign In
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-zinc-800 py-4 px-4 text-center text-xs text-zinc-500">
        © {new Date().getFullYear()} MK COSMETIC Marketplace Pakistan. All prices in Pakistani Rupees (PKR Rs.).
      </div>
    </footer>
  );
}
