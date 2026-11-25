"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Lock, ShieldCheck, Store } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { apiFetch, formatPKR } from "@/lib/api";

const PK_CITIES = [
  "Karachi",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Peshawar",
  "Quetta",
  "Sialkot",
  "Gujranwala",
];

export default function CheckoutPage() {
  const router = useRouter();
  const { user, cart, cartSubtotal, clearCart } = useStore();

  const [gateways, setGateways] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [bankReference, setBankReference] = useState("");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Lahore");
  const [area, setArea] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [orderResult, setOrderResult] = useState<any>(null);

  useEffect(() => {
    apiFetch<{ gateways: any }>("/orders/payment-methods")
      .then((res) => setGateways(res.gateways))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (user) {
      setFullName((v) => v || user.name || "");
      setPhone((v) => v || user.phone || "");
      const defAddr = user.addresses?.[0];
      if (defAddr) {
        setCity(defAddr.city || "Lahore");
        setArea((v) => v || defAddr.area || "");
        setStreetAddress((v) => v || defAddr.streetAddress || "");
      }
    }
  }, [user]);

  const shippingFee = cartSubtotal >= 3500 || cartSubtotal === 0 ? 0 : 200;
  const grandTotal = Math.max(0, cartSubtotal - couponDiscount + shippingFee);

  const uniqueSellers = Array.from(new Set(cart.map((c) => c.sellerName)));

  const handleApplyCoupon = async () => {
    setCouponMsg("");
    try {
      const res = await apiFetch<{ coupon: any; discountAmount: number }>(
        "/storefront/coupons/validate",
        {
          method: "POST",
          body: JSON.stringify({ code: couponInput, subtotal: cartSubtotal }),
        }
      );
      setAppliedCoupon(res.coupon);
      setCouponDiscount(res.discountAmount);
      setCouponMsg(`Applied ${res.coupon.code}: -${formatPKR(res.discountAmount)}`);
    } catch (err: any) {
      setAppliedCoupon(null);
      setCouponDiscount(0);
      setCouponMsg(err.message);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push("/auth/login");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await apiFetch("/orders", {
        method: "POST",
        body: JSON.stringify({
          items: cart.map((c) => ({
            productId: c.productId,
            variant: c.variant,
            qty: c.qty,
          })),
          shippingAddress: { fullName, phone, city, area, streetAddress, postalCode },
          paymentMethod,
          couponCode: appliedCoupon?.code || "",
          bankReference,
        }),
      });
      clearCart();
      setOrderResult(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (orderResult) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white border border-emerald-200 rounded-2xl p-8 text-center shadow-sm">
          <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto mb-3" />
          <h1 className="text-2xl font-black text-zinc-900 mb-2">
            Order Placed Successfully!
          </h1>
          <p className="text-sm text-zinc-600 mb-4">
            Order Number: <strong className="text-pink-600">{orderResult.order.orderNumber}</strong>
          </p>

          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-left text-sm mb-6 space-y-2">
            <div className="font-bold text-zinc-800">
              Split into {orderResult.suborders.length} Seller Suborder(s):
            </div>
            {orderResult.suborders.map((sub: any) => (
              <div
                key={sub._id}
                className="flex justify-between items-center py-1.5 border-b border-zinc-200 last:border-0 text-xs"
              >
                <span>
                  Suborder <strong>{sub.suborderNumber}</strong> ({sub.items.length} items)
                </span>
                <span className="font-bold text-pink-600">{sub.status}</span>
              </div>
            ))}
          </div>

          {orderResult.bankDetails && (
            <div className="bg-pink-50 border border-pink-200 rounded-xl p-4 text-left text-xs mb-6">
              <div className="font-bold text-pink-800 mb-1">Bank Transfer Verification Pending</div>
              <p>
                Bank: <strong>{orderResult.bankDetails.bankName}</strong> · Account:{" "}
                <strong>{orderResult.bankDetails.accountNumber}</strong> · IBAN:{" "}
                <strong>{orderResult.bankDetails.iban}</strong>
              </p>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/orders"
              className="px-6 py-3 rounded-xl bg-black text-white text-sm font-bold"
            >
              View My Orders
            </Link>
            <Link
              href="/shop"
              className="px-6 py-3 rounded-xl border border-zinc-300 text-sm font-bold"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-black mb-2">Nothing to Checkout</h1>
        <Link href="/shop" className="text-pink-600 font-bold underline">
          Browse Cosmetics
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black mb-2">Secure Multi-Vendor Checkout</h1>
      <p className="text-sm text-zinc-500 mb-6 flex items-center gap-2">
        <Store className="w-4 h-4 text-pink-600" />
        Fulfilled by {uniqueSellers.length} seller(s): {uniqueSellers.join(", ")} — automatically split
        into trackable seller suborders.
      </p>

      {!user && (
        <div className="bg-pink-50 border border-pink-200 rounded-xl p-4 mb-6 flex items-center justify-between gap-4">
          <span className="text-sm font-semibold text-pink-900">
            Please sign in to place your order and track suborders.
          </span>
          <Link href="/auth/login" className="px-4 py-2 rounded-lg bg-pink-600 text-white text-xs font-bold">
            Sign In
          </Link>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          {/* Shipping Address */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-black">1. Delivery Address (Pakistan)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-600 mb-1">Recipient Name</label>
                <input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-zinc-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-600 mb-1">Mobile Number</label>
                <input
                  required
                  placeholder="03XX-XXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-zinc-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-600 mb-1">City</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-zinc-300 rounded-xl bg-white"
                >
                  {PK_CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-600 mb-1">Area / Sector</label>
                <input
                  required
                  placeholder="e.g. DHA Phase 6 / Gulshan"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-zinc-300 rounded-xl"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-600 mb-1">Street Address</label>
              <input
                required
                placeholder="House #, Street #, Landmark"
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-zinc-300 rounded-xl"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-black">2. Payment Method</h2>
            <div className="space-y-2.5">
              {["COD", "BankTransfer", "JazzCash", "Easypaisa"].map((method) => {
                const info = gateways?.[method];
                const isConfigured = info ? info.configured : method === "COD" || method === "BankTransfer";
                return (
                  <label
                    key={method}
                    className={`block border rounded-xl p-4 cursor-pointer transition ${
                      paymentMethod === method
                        ? "border-pink-600 bg-pink-50/50"
                        : "border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method}
                        checked={paymentMethod === method}
                        onChange={() => setPaymentMethod(method)}
                        className="mt-1 accent-pink-600"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-sm text-zinc-900">
                            {info?.label || method}
                          </span>
                          {!isConfigured && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                              Credentials Required
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5">{info?.description}</p>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>

            {paymentMethod === "BankTransfer" && gateways?.BankTransfer?.bankDetails && (
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-3 text-xs">
                <div className="font-bold text-zinc-800">Transfer Total ({formatPKR(grandTotal)}) to:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-zinc-700">
                  <div>Bank: <strong>{gateways.BankTransfer.bankDetails.bankName}</strong></div>
                  <div>Title: <strong>{gateways.BankTransfer.bankDetails.accountTitle}</strong></div>
                  <div>Account: <strong>{gateways.BankTransfer.bankDetails.accountNumber}</strong></div>
                  <div>IBAN: <strong>{gateways.BankTransfer.bankDetails.iban}</strong></div>
                </div>
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">
                    Transaction Reference / TID (required for verification)
                  </label>
                  <input
                    required
                    value={bankReference}
                    onChange={(e) => setBankReference(e.target.value)}
                    placeholder="e.g. IBFT-8829104"
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg bg-white"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <aside className="lg:col-span-5 bg-white border border-zinc-200 rounded-2xl p-6 h-fit space-y-4">
          <h2 className="text-lg font-black">Order Summary</h2>
          <div className="divide-y divide-zinc-100 max-h-64 overflow-y-auto">
            {cart.map((c) => (
              <div key={`${c.productId}-${c.variant}`} className="py-2.5 flex justify-between text-sm gap-2">
                <div>
                  <div className="font-semibold text-zinc-900">{c.title}</div>
                  <div className="text-xs text-zinc-500">
                    {c.sellerName} · Qty {c.qty} ({c.variant})
                  </div>
                </div>
                <div className="font-bold tabular-nums">{formatPKR(c.salePrice * c.qty)}</div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <input
              type="text"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              placeholder="Coupon (e.g. MKBEAUTY10)"
              className="flex-1 px-3 py-2 text-sm border border-zinc-300 rounded-xl uppercase"
            />
            <button
              type="button"
              onClick={handleApplyCoupon}
              className="px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-bold"
            >
              Apply
            </button>
          </div>
          {couponMsg && <p className="text-xs font-semibold text-pink-600">{couponMsg}</p>}

          <div className="border-t border-zinc-200 pt-3 space-y-2 text-sm">
            <div className="flex justify-between text-zinc-600">
              <span>Subtotal</span>
              <span className="tabular-nums font-semibold">{formatPKR(cartSubtotal)}</span>
            </div>
            {couponDiscount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Coupon Discount</span>
                <span className="tabular-nums">-{formatPKR(couponDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-zinc-600">
              <span>Shipping</span>
              <span className="tabular-nums font-semibold">
                {shippingFee === 0 ? "FREE" : formatPKR(shippingFee)}
              </span>
            </div>
            <div className="flex justify-between text-lg font-black pt-2 border-t border-zinc-200">
              <span>Total Payable</span>
              <span className="text-pink-600 tabular-nums">{formatPKR(grandTotal)}</span>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-pink-600 hover:bg-pink-700 disabled:bg-zinc-400 text-white font-bold text-sm flex items-center justify-center gap-2 transition"
          >
            <Lock className="w-4 h-4" />
            {submitting ? "Placing Order..." : `Confirm Order (${formatPKR(grandTotal)})`}
          </button>

          <p className="text-[11px] text-zinc-400 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Protected by MK COSMETIC Buyer Assurance
          </p>
        </aside>
      </form>
    </div>
  );
}
