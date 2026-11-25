"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useStore } from "@/context/StoreContext";

export default function RegisterPage() {
  const router = useRouter();
  const { loginSuccess } = useStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiFetch<{ token: string; user: any }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, phone, password }),
      });
      loginSuccess(res.token, res.user);
      router.push("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white border border-zinc-200 rounded-2xl p-7 shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-black text-white flex items-center justify-center mb-4">
          <UserPlus className="w-5 h-5 text-pink-400" />
        </div>
        <h1 className="text-2xl font-black mb-1">Create Customer Account</h1>
        <p className="text-sm text-zinc-500 mb-6">
          Shop authentic beauty products across Pakistan with fast order tracking.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Full Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Fatima Noor"
              className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="fatima@example.pk"
              className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Mobile Number</label>
            <input
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="03XX-XXXXXXX"
              className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
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
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-zinc-600">
          Already registered?{" "}
          <Link href="/auth/login" className="text-pink-600 font-bold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
