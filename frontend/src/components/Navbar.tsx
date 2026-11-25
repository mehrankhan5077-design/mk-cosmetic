"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  LogOut,
  Search,
  ShoppingBag,
  Store,
  User,
  ShieldCheck,
  Package,
  Menu,
  X,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { apiFetch, assetUrl, formatPKR } from "@/lib/api";

export default function Navbar() {
  const router = useRouter();
  const { user, cartCount, wishlistIds, logout } = useStore();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<{
    products: any[];
    categories: any[];
    sellers: any[];
  } | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const searchWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setSuggestions(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await apiFetch<{ products: any[]; categories: any[]; sellers: any[] }>(
          `/storefront/search-suggestions?q=${encodeURIComponent(q)}`
        );
        setSuggestions(res);
        setShowSuggestions(true);
      } catch {
        // ignore transient search error
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    router.push(`/shop?q=${encodeURIComponent(query.trim())}`);
  };

  const dashboardHref =
    user?.role === "admin"
      ? "/admin/dashboard"
      : user?.role === "seller"
      ? "/seller/dashboard"
      : "/orders";

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-pink-100 shadow-sm">
      {/* Top Utility Strip */}
      <div className="bg-[#0f0f12] text-white text-xs">
        <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-pink-400 font-semibold">🇵🇰 Pakistan · PKR (Rs.)</span>
            <span className="hidden sm:inline text-zinc-300">
              Multi-Vendor Cosmetics Marketplace · Cash on Delivery Nationwide
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/seller-register" className="hover:text-pink-400 transition">
              Sell on MK COSMETIC
            </Link>
            <Link href="/track" className="hover:text-pink-400 transition">
              Track Order
            </Link>
          </div>
        </div>
      </div>

      {/* Main Daraz-style Header */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-600 to-black flex items-center justify-center text-white font-black text-lg shadow">
            MK
          </div>
          <div>
            <div className="text-lg sm:text-xl font-black tracking-tight text-zinc-900 leading-none">
              MK <span className="text-pink-600">COSMETIC</span>
            </div>
            <div className="text-[11px] font-medium text-zinc-500">Beauty Shopping Made Easy</div>
          </div>
        </Link>

        {/* Live Autocomplete Search Bar */}
        <div ref={searchWrapRef} className="relative flex-1 max-w-2xl hidden md:block">
          <form onSubmit={onSearchSubmit} className="flex">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => suggestions && setShowSuggestions(true)}
              placeholder="Search lipsticks, Vitamin C serums, foundations, sellers..."
              className="w-full px-4 py-2.5 text-sm bg-zinc-50 border-2 border-pink-500 rounded-l-xl focus:outline-none focus:bg-white"
            />
            <button
              type="submit"
              aria-label="Search products"
              className="px-5 bg-pink-600 hover:bg-pink-700 text-white rounded-r-xl flex items-center justify-center transition"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          {showSuggestions && suggestions && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-zinc-200 rounded-xl shadow-2xl z-50 overflow-hidden">
              {suggestions.categories.length > 0 && (
                <div className="px-3 py-2 bg-pink-50/70 border-b border-pink-100">
                  <div className="text-[11px] font-bold uppercase text-pink-700 mb-1">Categories</div>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestions.categories.map((cat) => (
                      <Link
                        key={cat._id}
                        href={`/shop?category=${cat.slug}`}
                        onClick={() => setShowSuggestions(false)}
                        className="text-xs px-2.5 py-1 bg-white border border-pink-200 rounded-full hover:bg-pink-600 hover:text-white transition"
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {suggestions.sellers.length > 0 && (
                <div className="px-3 py-2 border-b border-zinc-100">
                  <div className="text-[11px] font-bold uppercase text-zinc-500 mb-1">Verified Shops</div>
                  {suggestions.sellers.map((s) => (
                    <Link
                      key={s._id}
                      href={`/seller/${s.slug}`}
                      onClick={() => setShowSuggestions(false)}
                      className="flex items-center gap-2 py-1 text-sm hover:text-pink-600"
                    >
                      <Store className="w-3.5 h-3.5 text-pink-600" />
                      <span className="font-medium">{s.shopName}</span>
                      <span className="text-xs text-zinc-400">· {s.city}</span>
                    </Link>
                  ))}
                </div>
              )}

              {suggestions.products.length > 0 ? (
                <div className="divide-y divide-zinc-100 max-h-80 overflow-y-auto">
                  {suggestions.products.map((p) => (
                    <Link
                      key={p._id}
                      href={`/product/${p.slug}`}
                      onClick={() => setShowSuggestions(false)}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-pink-50/50 transition"
                    >
                      <img
                        src={assetUrl(p.images?.[0])}
                        alt={p.title}
                        className="w-10 h-10 rounded-lg object-cover bg-pink-50 border border-zinc-100"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-zinc-900 truncate">{p.title}</div>
                        <div className="text-xs text-zinc-500">{p.brand}</div>
                      </div>
                      <div className="text-sm font-bold text-pink-600 tabular-nums">
                        {formatPKR(p.salePrice)}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-sm text-zinc-500 text-center">
                  No matching cosmetics found. Press Enter to browse all products.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/wishlist"
            className="relative p-2 rounded-xl hover:bg-pink-50 text-zinc-700 hover:text-pink-600 transition"
            title="Wishlist"
          >
            <Heart className="w-5 h-5" />
            {wishlistIds.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-black text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {wishlistIds.length}
              </span>
            )}
          </Link>

          <Link
            href="/cart"
            className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 font-semibold text-sm transition"
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="hidden sm:inline">Cart</span>
            <span className="bg-pink-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full tabular-nums">
              {cartCount}
            </span>
          </Link>

          {user ? (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                href={dashboardHref}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-pink-600 text-white text-xs font-semibold transition"
              >
                {user.role === "admin" ? (
                  <ShieldCheck className="w-4 h-4 text-pink-400" />
                ) : user.role === "seller" ? (
                  <Store className="w-4 h-4 text-pink-400" />
                ) : (
                  <Package className="w-4 h-4 text-pink-400" />
                )}
                <span>
                  {user.role === "admin"
                    ? "Admin Panel"
                    : user.role === "seller"
                    ? "Seller Hub"
                    : user.name.split(" ")[0]}
                </span>
              </Link>
              <button
                type="button"
                onClick={() => logout()}
                title="Sign Out"
                className="p-2 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-zinc-600"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                href="/auth/login"
                className="px-3 py-2 rounded-xl text-sm font-semibold text-zinc-800 hover:bg-zinc-100 transition"
              >
                Login
              </Link>
              <Link
                href="/auth/register"
                className="px-3.5 py-2 rounded-xl text-sm font-semibold bg-black hover:bg-pink-600 text-white transition"
              >
                Sign Up
              </Link>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMobileMenu((v) => !v)}
            className="md:hidden p-2 rounded-xl border border-zinc-200"
            aria-label="Toggle Menu"
          >
            {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Search & Drawer */}
      <div className="md:hidden px-4 pb-3">
        <form onSubmit={onSearchSubmit} className="flex">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search cosmetics in PKR..."
            className="w-full px-3 py-2 text-sm bg-zinc-50 border border-pink-500 rounded-l-lg focus:outline-none"
          />
          <button type="submit" className="px-4 bg-pink-600 text-white rounded-r-lg">
            <Search className="w-4 h-4" />
          </button>
        </form>
      </div>

      {mobileMenu && (
        <div className="md:hidden border-t border-zinc-100 bg-white px-4 py-3 space-y-2 text-sm">
          <Link href="/shop" onClick={() => setMobileMenu(false)} className="block py-1.5 font-medium">
            All Cosmetics
          </Link>
          <Link href="/orders" onClick={() => setMobileMenu(false)} className="block py-1.5 font-medium">
            My Orders
          </Link>
          <Link href="/track" onClick={() => setMobileMenu(false)} className="block py-1.5 font-medium">
            Track Order
          </Link>
          <Link
            href="/auth/seller-register"
            onClick={() => setMobileMenu(false)}
            className="block py-1.5 font-medium text-pink-600"
          >
            Become a Seller
          </Link>
          {user ? (
            <>
              <Link
                href={dashboardHref}
                onClick={() => setMobileMenu(false)}
                className="block py-1.5 font-bold text-zinc-900"
              >
                Dashboard ({user.role})
              </Link>
              <button
                type="button"
                onClick={() => {
                  logout();
                  setMobileMenu(false);
                }}
                className="text-red-600 font-semibold py-1"
              >
                Sign Out
              </button>
            </>
          ) : (
            <div className="flex gap-2 pt-2">
              <Link
                href="/auth/login"
                onClick={() => setMobileMenu(false)}
                className="flex-1 text-center py-2 border border-zinc-300 rounded-lg font-semibold"
              >
                Login
              </Link>
              <Link
                href="/auth/register"
                onClick={() => setMobileMenu(false)}
                className="flex-1 text-center py-2 bg-pink-600 text-white rounded-lg font-semibold"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
