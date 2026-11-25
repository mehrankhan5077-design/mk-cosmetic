"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Store } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useStore } from "@/context/StoreContext";

export default function SellerRegisterPage() {
  const router = useRouter();
  const { loginSuccess } = useStore();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    shopName: "",
    city: "Karachi",
    description: "",
    businessCnic: "",
    preferredMethod: "BankTransfer",
    accountTitle: "",
    accountNumber: "",
    bankName: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiFetch<{ token: string; user: any; seller: any }>(
        "/auth/register-seller",
        {
          method: "POST",
          body: JSON.stringify(form),
        }
      );
      loginSuccess(res.token, res.user, res.seller);
      router.push("/seller/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="bg-white border border-zinc-200 rounded-2xl p-7 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-xl bg-pink-600 text-white flex items-center justify-center">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black">Sell Cosmetics on MK COSMETIC</h1>
            <p className="text-sm text-zinc-500">
              Register as an independent seller. Admin reviews and activates your shop quickly.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Owner Full Name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-zinc-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Business Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-zinc-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Mobile / WhatsApp</label>
              <input
                required
                placeholder="03XX-XXXXXXX"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-zinc-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-zinc-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Shop Name</label>
              <input
                required
                placeholder="e.g. Pearl Beauty Lahore"
                value={form.shopName}
                onChange={(e) => setForm({ ...form, shopName: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-zinc-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">City</label>
              <select
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-zinc-300 rounded-xl bg-white"
              >
                {["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Multan", "Faisalabad", "Peshawar"].map(
                  (c) => (
                    <option key={c}>{c}</option>
                  )
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Shop Description</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the cosmetics & skincare brands you sell..."
              className="w-full px-3 py-2.5 text-sm border border-zinc-300 rounded-xl"
            />
          </div>

          <div className="bg-pink-50/70 border border-pink-100 rounded-xl p-4 space-y-3">
            <div className="text-xs font-bold uppercase text-pink-700">
              Payout Account Details (PKR Withdrawals)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                value={form.preferredMethod}
                onChange={(e) => setForm({ ...form, preferredMethod: e.target.value })}
                className="px-3 py-2 text-sm border border-zinc-300 rounded-xl bg-white"
              >
                <option value="BankTransfer">Bank Transfer</option>
                <option value="JazzCash">JazzCash</option>
                <option value="Easypaisa">Easypaisa</option>
              </select>
              <input
                placeholder="Account Title"
                value={form.accountTitle}
                onChange={(e) => setForm({ ...form, accountTitle: e.target.value })}
                className="px-3 py-2 text-sm border border-zinc-300 rounded-xl bg-white"
              />
              <input
                placeholder="Account / Mobile Number"
                value={form.accountNumber}
                onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                className="px-3 py-2 text-sm border border-zinc-300 rounded-xl bg-white"
              />
              <input
                placeholder="Bank Name (if Bank Transfer)"
                value={form.bankName}
                onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                className="px-3 py-2 text-sm border border-zinc-300 rounded-xl bg-white"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-black hover:bg-pink-600 text-white font-bold text-sm transition"
          >
            {loading ? "Submitting Application..." : "Create Seller Shop"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-zinc-500">
          Already have a seller account?{" "}
          <Link href="/auth/login" className="text-pink-600 font-bold underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
