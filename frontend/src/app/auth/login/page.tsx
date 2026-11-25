"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useStore } from "@/context/StoreContext";

export default function LoginPage() {
  const router = useRouter();
  const { loginSuccess } = useStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiFetch<{ token: string; user: any; seller: any }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      loginSuccess(res.token, res.user, res.seller);
      if (res.user.role === "admin") router.push("/admin/dashboard");
      else if (res.user.role === "seller") router.push("/seller/dashboard");
      else router.push("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillCreds = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white border border-zinc-200 rounded-2xl p-7 shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-pink-600 text-white flex items-center justify-center mb-4">
          <Lock className="w-5 h-5" />
        </div>
        <h1 className="text-2xl font-black mb-1">Sign In to MK COSMETIC</h1>
        <p className="text-sm text-zinc-500 mb-6">
          Access your Customer, Seller, or Admin marketplace account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.pk"
              className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-xl"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-sm transition"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        {/* Seeded Test Account Helpers */}
        <div className="mt-6 pt-5 border-t border-zinc-200">
          <div className="text-[11px] font-bold uppercase text-zinc-500 mb-2">
            Seeded Accounts (Quick Fill)
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              type="button"
              onClick={() => fillCreds("ayesha@example.pk", "Customer@12345")}
              className="py-2 px-2 rounded-lg border border-zinc-200 hover:border-pink-400 font-semibold"
            >
              Customer
            </button>
            <button
              type="button"
              onClick={() => fillCreds("glamaura@mkcosmetic.pk", "Seller@12345")}
              className="py-2 px-2 rounded-lg border border-zinc-200 hover:border-pink-400 font-semibold"
            >
              Seller
            </button>
            <button
              type="button"
              onClick={() => fillCreds("admin@mkcosmetic.pk", "Admin@12345")}
              className="py-2 px-2 rounded-lg border border-zinc-200 hover:border-pink-400 font-semibold"
            >
              Admin
            </button>
          </div>
        </div>

        <div className="mt-5 text-center text-xs text-zinc-600 space-y-1">
          <div>
            New customer?{" "}
            <Link href="/auth/register" className="text-pink-600 font-bold hover:underline">
              Create Customer Account
            </Link>
          </div>
          <div>
            Want to sell cosmetics?{" "}
            <Link href="/auth/seller-register" className="text-zinc-900 font-bold hover:underline">
              Register as Independent Seller
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
