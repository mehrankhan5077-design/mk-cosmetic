"use client";

import React, { useState } from "react";
import { Search, Truck } from "lucide-react";
import { apiFetch, formatPKR } from "@/lib/api";

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("MK-261125-SEED01");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const res = await apiFetch<{ order: any }>(
        `/orders/track/${encodeURIComponent(orderNumber.trim())}`
      );
      setResult(res.order);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <Truck className="w-10 h-10 text-pink-600 mx-auto mb-2" />
        <h1 className="text-2xl font-black">Track Your MK COSMETIC Order</h1>
        <p className="text-sm text-zinc-500">
          Enter your order number (e.g. MK-261125-SEED01) to view live seller shipment updates.
        </p>
      </div>

      <form onSubmit={handleTrack} className="flex gap-2 mb-6">
        <input
          type="text"
          required
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          placeholder="MK-XXXXXX-XXXXXX"
          className="flex-1 px-4 py-3 border border-zinc-300 rounded-xl text-sm uppercase"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-sm flex items-center gap-2"
        >
          <Search className="w-4 h-4" />
          {loading ? "Checking..." : "Track"}
        </button>
      </form>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-5">
          <div className="flex flex-wrap justify-between gap-3 border-b border-zinc-100 pb-4 text-sm">
            <div>
              Order: <strong className="text-pink-600">{result.orderNumber}</strong>
            </div>
            <div>Destination: <strong>{result.city}, Pakistan</strong></div>
            <div>Total: <strong className="tabular-nums">{formatPKR(result.totalAmount)}</strong></div>
          </div>

          <div className="space-y-4">
            {result.suborders.map((sub: any) => (
              <div key={sub._id} className="bg-zinc-50 border border-zinc-200 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="font-bold text-sm">
                    Seller: {sub.sellerId?.shopName} ({sub.suborderNumber})
                  </div>
                  <span className="px-3 py-1 rounded-full bg-pink-600 text-white text-xs font-bold">
                    {sub.status}
                  </span>
                </div>
                {sub.trackingNumber && (
                  <div className="text-xs text-zinc-600 mb-2">
                    Courier: <strong>{sub.courierName}</strong> · Tracking: <strong>{sub.trackingNumber}</strong>
                  </div>
                )}
                <div className="space-y-1.5 mt-3">
                  {sub.statusHistory.map((h: any, idx: number) => (
                    <div key={idx} className="text-xs flex justify-between text-zinc-600">
                      <span>
                        <strong>{h.status}</strong> — {h.note}
                      </span>
                      <span>{new Date(h.timestamp).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
