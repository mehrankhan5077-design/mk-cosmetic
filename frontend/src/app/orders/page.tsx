"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Package, RotateCcw, Store } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { apiFetch, assetUrl, formatPKR } from "@/lib/api";

export default function OrdersPage() {
  const { user } = useStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const [returnTarget, setReturnTarget] = useState<any>(null);
  const [returnReason, setReturnReason] = useState("Damaged or leaking product");
  const [returnDesc, setReturnDesc] = useState("");

  const loadOrders = () => {
    setLoading(true);
    apiFetch<{ orders: any[]; returns: any[] }>("/orders/my")
      .then((res) => {
        setOrders(res.orders);
        setReturns(res.returns);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user) loadOrders();
    else setLoading(false);
  }, [user]);

  const handleCancelSuborder = async (subId: string) => {
    try {
      await apiFetch(`/orders/suborders/${subId}/cancel`, {
        method: "POST",
        body: JSON.stringify({ reason: "Cancelled by customer" }),
      });
      setMsg("Suborder cancelled and stock restored.");
      loadOrders();
    } catch (err: any) {
      setMsg(err.message);
    }
  };

  const handleRequestReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnTarget) return;
    try {
      await apiFetch("/orders/returns", {
        method: "POST",
        body: JSON.stringify({
          suborderId: returnTarget._id,
          reason: returnReason,
          description: returnDesc,
        }),
      });
      setMsg("Return & refund request submitted to Admin.");
      setReturnTarget(null);
      setReturnDesc("");
      loadOrders();
    } catch (err: any) {
      setMsg(err.message);
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Package className="w-12 h-12 text-pink-600 mx-auto mb-3" />
        <h1 className="text-2xl font-black mb-2">Sign In to View Your Orders</h1>
        <Link href="/auth/login" className="inline-block px-6 py-3 rounded-xl bg-pink-600 text-white text-sm font-bold">
          Login
        </Link>
      </div>
    );
  }

  const returnBySubId = new Map(returns.map((r) => [String(r.suborderId), r]));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black">My Orders &amp; Returns</h1>
          <p className="text-sm text-zinc-500">Multi-vendor packages are tracked per seller suborder.</p>
        </div>
        <Link href="/track" className="text-sm font-bold text-pink-600 hover:underline">
          Track by Order Number →
        </Link>
      </div>

      {msg && (
        <div className="mb-4 p-3 rounded-xl bg-pink-50 border border-pink-200 text-pink-800 text-sm font-semibold">
          {msg}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-zinc-500">Loading order history...</p>
      ) : orders.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center">
          <p className="text-sm text-zinc-500 mb-4">You haven&apos;t placed any orders yet.</p>
          <Link href="/shop" className="px-5 py-2.5 rounded-xl bg-pink-600 text-white text-sm font-bold">
            Shop Cosmetics
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((ord) => (
            <div key={ord._id} className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-3.5 bg-zinc-900 text-white flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  Order <strong className="text-pink-400">{ord.orderNumber}</strong> ·{" "}
                  {new Date(ord.createdAt).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-4">
                  <span>Payment: <strong>{ord.paymentMethod}</strong> ({ord.paymentStatus})</span>
                  <span className="font-black text-sm text-pink-300 tabular-nums">
                    Total: {formatPKR(ord.totalAmount)}
                  </span>
                </div>
              </div>

              <div className="divide-y divide-zinc-200">
                {(ord.suborderIds || []).map((sub: any) => {
                  const ret = returnBySubId.get(String(sub._id));
                  return (
                    <div key={sub._id} className="p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2 text-sm font-bold">
                          <Store className="w-4 h-4 text-pink-600" />
                          <span>{sub.sellerId?.shopName || "Seller"}</span>
                          <span className="text-xs font-normal text-zinc-500">
                            ({sub.suborderNumber})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-pink-100 text-pink-800">
                            {sub.status}
                          </span>
                          {sub.trackingNumber && (
                            <span className="text-xs text-zinc-500">
                              {sub.courierName}: <strong>{sub.trackingNumber}</strong>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 mb-3">
                        {sub.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-3 text-sm">
                            <img
                              src={assetUrl(item.image)}
                              alt={item.title}
                              className="w-12 h-12 rounded-lg object-cover bg-pink-50"
                            />
                            <div className="flex-1">
                              <div className="font-semibold text-zinc-900">{item.title}</div>
                              <div className="text-xs text-zinc-500">
                                {item.variant} × {item.qty}
                              </div>
                            </div>
                            <div className="font-bold tabular-nums">{formatPKR(item.lineTotal)}</div>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-100 text-xs">
                        <span className="text-zinc-500">
                          Last update: {sub.statusHistory?.[sub.statusHistory.length - 1]?.note || sub.status}
                        </span>
                        <div className="flex gap-2">
                          {["Pending", "Confirmed"].includes(sub.status) && (
                            <button
                              type="button"
                              onClick={() => handleCancelSuborder(sub._id)}
                              className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 font-bold hover:bg-red-50"
                            >
                              Cancel Package
                            </button>
                          )}
                          {sub.status === "Delivered" && !ret && (
                            <button
                              type="button"
                              onClick={() => setReturnTarget(sub)}
                              className="px-3 py-1.5 rounded-lg border border-zinc-300 font-bold hover:bg-zinc-50 flex items-center gap-1"
                            >
                              <RotateCcw className="w-3.5 h-3.5" /> Request Return / Refund
                            </button>
                          )}
                          {ret && (
                            <span className="px-3 py-1 rounded-lg bg-amber-50 text-amber-800 font-bold">
                              Return Status: {ret.status.toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {returnTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-black mb-1">Request Return / Refund</h3>
            <p className="text-xs text-zinc-500 mb-4">Suborder {returnTarget.suborderNumber}</p>
            <form onSubmit={handleRequestReturn} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-600 mb-1">Reason</label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-xl bg-white"
                >
                  <option>Damaged or leaking product</option>
                  <option>Wrong shade or item delivered</option>
                  <option>Expired or sealed broken</option>
                  <option>Missing item in parcel</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-600 mb-1">Details</label>
                <textarea
                  required
                  rows={3}
                  value={returnDesc}
                  onChange={(e) => setReturnDesc(e.target.value)}
                  placeholder="Describe the issue clearly..."
                  className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-xl"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReturnTarget(null)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-300 text-sm font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-pink-600 text-white text-sm font-bold"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
