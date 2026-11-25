"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Check,
  CreditCard,
  Layers,
  Package,
  RotateCcw,
  ShieldCheck,
  Store,
  Tag,
  Users,
  Wallet,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { apiFetch, formatPKR } from "@/lib/api";

type AdminTab =
  | "reports"
  | "sellers"
  | "products"
  | "categories"
  | "orders"
  | "withdrawals"
  | "marketing"
  | "returns";

export default function AdminDashboardPage() {
  const { user, authLoading } = useStore();
  const [tab, setTab] = useState<AdminTab>("reports");

  const [dash, setDash] = useState<any>(null);
  const [sellers, setSellers] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [returns, setReturns] = useState<any[]>([]);

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  // Settings Form
  const [defaultCommission, setDefaultCommission] = useState("10");
  const [flatShipping, setFlatShipping] = useState("200");

  // New Category / Banner / Coupon Forms
  const [catName, setCatName] = useState("");
  const [bannerTitle, setBannerTitle] = useState("");
  const [bannerSub, setBannerSub] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponVal, setCouponVal] = useState("15");

  const loadAll = async () => {
    try {
      const [d, s, cust, p, c, o, pay, w, b, coup, ret] = await Promise.all([
        apiFetch("/admin/dashboard"),
        apiFetch<{ sellers: any[] }>("/admin/sellers"),
        apiFetch<{ customers: any[] }>("/admin/customers"),
        apiFetch<{ products: any[] }>("/admin/products"),
        apiFetch<{ categories: any[] }>("/admin/categories"),
        apiFetch<{ orders: any[] }>("/admin/orders"),
        apiFetch<{ payments: any[] }>("/admin/payments"),
        apiFetch<{ withdrawals: any[] }>("/admin/withdrawals"),
        apiFetch<{ banners: any[] }>("/admin/banners"),
        apiFetch<{ coupons: any[] }>("/admin/coupons"),
        apiFetch<{ returns: any[] }>("/admin/returns"),
      ]);
      setDash(d);
      setSellers(s.sellers);
      setCustomers(cust.customers);
      setProducts(p.products);
      setCategories(c.categories);
      setOrders(o.orders);
      setPayments(pay.payments);
      setWithdrawals(w.withdrawals);
      setBanners(b.banners);
      setCoupons(coup.coupons);
      setReturns(ret.returns);
      setDefaultCommission(String(d.settings?.defaultCommissionRate ?? 10));
      setFlatShipping(String(d.settings?.flatShippingFee ?? 200));
    } catch (e: any) {
      setErr(e.message);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") loadAll();
  }, [user]);

  const act = async (fn: () => Promise<any>, successText: string) => {
    setErr("");
    setMsg("");
    try {
      await fn();
      setMsg(successText);
      loadAll();
    } catch (e: any) {
      setErr(e.message);
    }
  };

  if (authLoading) return <div className="p-12 text-center text-sm">Loading Admin Panel...</div>;
  if (!user || user.role !== "admin") {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <ShieldCheck className="w-12 h-12 text-pink-600 mx-auto mb-3" />
        <h1 className="text-2xl font-black mb-2">MK COSMETIC Admin Access Required</h1>
        <Link href="/auth/login" className="px-6 py-3 rounded-xl bg-pink-600 text-white text-sm font-bold">
          Sign In as Admin
        </Link>
      </div>
    );
  }

  const ov = dash?.overview || {};
  const rep = dash?.reports || {};

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-[#0f0f12] text-white rounded-2xl p-6 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase text-pink-400">MK COSMETIC OWNER CONTROL PANEL</span>
          <h1 className="text-2xl font-black">Marketplace Administration</h1>
          <p className="text-xs text-zinc-400">
            Manage independent sellers, commission rules, products, payments, payouts, and reports.
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-zinc-400">Total Marketplace Revenue (GMV)</div>
          <div className="text-2xl font-black text-pink-400 tabular-nums">
            {formatPKR(ov.totalMarketplaceGmv)}
          </div>
          <div className="text-xs text-emerald-400 tabular-nums">
            Commission Earned: {formatPKR(ov.totalCommissionRevenue)}
          </div>
        </div>
      </div>

      {msg && <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold">{msg}</div>}
      {err && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold">{err}</div>}

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        {[
          { label: "Total Sellers", val: ov.totalSellers ?? 0 },
          { label: "Pending Sellers", val: ov.pendingSellers ?? 0, alert: ov.pendingSellers > 0 },
          { label: "Customers", val: ov.totalCustomers ?? 0 },
          { label: "Total Products", val: ov.totalProducts ?? 0 },
          { label: "Pending Products", val: ov.pendingProducts ?? 0, alert: ov.pendingProducts > 0 },
          { label: "Total Orders", val: ov.totalOrders ?? 0 },
          { label: "Pending Payouts", val: ov.pendingWithdrawals ?? 0, alert: ov.pendingWithdrawals > 0 },
        ].map((k) => (
          <div
            key={k.label}
            className={`rounded-2xl p-3.5 border ${
              k.alert ? "bg-pink-50 border-pink-300" : "bg-white border-zinc-200"
            }`}
          >
            <div className="text-[11px] font-bold text-zinc-500 uppercase">{k.label}</div>
            <div className="text-xl font-black mt-1 tabular-nums">{k.val}</div>
          </div>
        ))}
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { id: "reports", label: "Sales Reports & Commission", icon: BarChart3 },
          { id: "sellers", label: `Sellers (${sellers.length})`, icon: Store },
          { id: "products", label: `Products (${products.length})`, icon: Package },
          { id: "categories", label: `Categories (${categories.length})`, icon: Layers },
          { id: "orders", label: `Orders & Payments`, icon: CreditCard },
          { id: "withdrawals", label: `Withdrawals (${withdrawals.length})`, icon: Wallet },
          { id: "marketing", label: "Banners & Coupons", icon: Tag },
          { id: "returns", label: `Customers & Returns`, icon: RotateCcw },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id as AdminTab)}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition ${
              tab === t.id
                ? "bg-black text-white border-black"
                : "bg-white text-zinc-700 border-zinc-200 hover:border-pink-400"
            }`}
          >
            <t.icon className="w-3.5 h-3.5 text-pink-500" />
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB: REPORTS & SETTINGS */}
      {tab === "reports" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4 h-fit">
            {[
              { title: "Daily Sales Report", data: rep.daily },
              { title: "Weekly Sales Report", data: rep.weekly },
              { title: "Monthly Sales Report", data: rep.monthly },
            ].map((r) => (
              <div key={r.title} className="bg-white border border-zinc-200 rounded-2xl p-5 space-y-2">
                <div className="text-xs font-bold uppercase text-pink-600">{r.title}</div>
                <div className="text-2xl font-black tabular-nums">{formatPKR(r.data?.gmv)}</div>
                <div className="text-xs text-zinc-500">Orders: <strong>{r.data?.orders ?? 0}</strong></div>
                <div className="text-xs text-emerald-700 font-semibold tabular-nums">
                  Commission: {formatPKR(r.data?.commission)}
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-5 bg-white border border-zinc-200 rounded-2xl p-6">
            <h2 className="text-lg font-black mb-4">Global Commission &amp; Shipping Settings</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-600 mb-1">
                  Default Marketplace Commission (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={defaultCommission}
                  onChange={(e) => setDefaultCommission(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-600 mb-1">
                  Standard Shipping Fee (PKR)
                </label>
                <input
                  type="number"
                  min={0}
                  value={flatShipping}
                  onChange={(e) => setFlatShipping(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-xl"
                />
              </div>
              <button
                type="button"
                onClick={() =>
                  act(
                    () =>
                      apiFetch("/admin/settings", {
                        method: "PATCH",
                        body: JSON.stringify({
                          defaultCommissionRate: Number(defaultCommission),
                          flatShippingFee: Number(flatShipping),
                        }),
                      }),
                    "Marketplace commission & shipping settings updated."
                  )
                }
                className="w-full py-3 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-sm"
              >
                Save Global Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB: SELLERS */}
      {tab === "sellers" && (
        <div className="space-y-3">
          {sellers.map((s) => (
            <div key={s._id} className="bg-white border border-zinc-200 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="font-bold text-base">
                  {s.shopName} <span className="text-xs font-normal text-zinc-500">· {s.city}</span>
                </div>
                <div className="text-xs text-zinc-500">
                  Owner: {s.userId?.name} ({s.userId?.email}) · Balance:{" "}
                  <strong className="tabular-nums">{formatPKR(s.availableBalance)}</strong>
                </div>
                <span
                  className={`inline-block mt-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                    s.status === "approved"
                      ? "bg-emerald-100 text-emerald-700"
                      : s.status === "suspended" || s.status === "rejected"
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {s.status}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <label className="font-semibold text-zinc-600">Comm %:</label>
                <input
                  type="number"
                  min={0}
                  max={60}
                  defaultValue={s.commissionRate ?? defaultCommission}
                  onBlur={(e) =>
                    act(
                      () =>
                        apiFetch(`/admin/sellers/${s._id}`, {
                          method: "PATCH",
                          body: JSON.stringify({ commissionRate: Number(e.target.value) }),
                        }),
                      `Updated commission % for ${s.shopName}`
                    )
                  }
                  className="w-16 px-2 py-1.5 border border-zinc-300 rounded-lg"
                />
                {s.status !== "approved" && (
                  <button
                    type="button"
                    onClick={() =>
                      act(
                        () => apiFetch(`/admin/sellers/${s._id}`, { method: "PATCH", body: JSON.stringify({ status: "approved" }) }),
                        `Approved ${s.shopName}`
                      )
                    }
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold"
                  >
                    Approve
                  </button>
                )}
                {s.status === "pending" && (
                  <button
                    type="button"
                    onClick={() =>
                      act(
                        () => apiFetch(`/admin/sellers/${s._id}`, { method: "PATCH", body: JSON.stringify({ status: "rejected" }) }),
                        `Rejected ${s.shopName}`
                      )
                    }
                    className="px-3 py-1.5 rounded-lg bg-red-600 text-white font-bold"
                  >
                    Reject
                  </button>
                )}
                {s.status === "approved" && (
                  <button
                    type="button"
                    onClick={() =>
                      act(
                        () => apiFetch(`/admin/sellers/${s._id}`, { method: "PATCH", body: JSON.stringify({ status: "suspended" }) }),
                        `Suspended ${s.shopName}`
                      )
                    }
                    className="px-3 py-1.5 rounded-lg border border-red-300 text-red-600 font-bold"
                  >
                    Suspend
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB: PRODUCTS */}
      {tab === "products" && (
        <div className="space-y-3">
          {products.map((p) => (
            <div key={p._id} className="bg-white border border-zinc-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="font-bold text-sm">{p.title}</div>
                <div className="text-xs text-zinc-500">
                  Seller: <strong>{p.sellerId?.shopName}</strong> · Category: {p.categoryId?.name} ·{" "}
                  {formatPKR(p.salePrice)} · Status: <strong>{p.approvalStatus.toUpperCase()}</strong>
                </div>
              </div>
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={() =>
                    act(
                      () => apiFetch(`/admin/products/${p._id}`, { method: "PATCH", body: JSON.stringify({ approvalStatus: "approved" }) }),
                      `Approved "${p.title}"`
                    )
                  }
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() =>
                    act(
                      () => apiFetch(`/admin/products/${p._id}`, { method: "PATCH", body: JSON.stringify({ approvalStatus: "rejected" }) }),
                      `Rejected "${p.title}"`
                    )
                  }
                  className="px-3 py-1.5 rounded-lg border border-red-300 text-red-600 font-bold"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB: CATEGORIES */}
      {tab === "categories" && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-4 bg-white border border-zinc-200 rounded-2xl p-5 h-fit">
            <h2 className="font-black text-base mb-3">Add Category</h2>
            <div className="flex gap-2">
              <input
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="Category name"
                className="flex-1 px-3 py-2 text-sm border border-zinc-300 rounded-xl"
              />
              <button
                type="button"
                onClick={() => {
                  if (!catName.trim()) return;
                  act(
                    () => apiFetch("/admin/categories", { method: "POST", body: JSON.stringify({ name: catName }) }),
                    `Category "${catName}" created.`
                  );
                  setCatName("");
                }}
                className="px-4 py-2 rounded-xl bg-pink-600 text-white text-xs font-bold"
              >
                Add
              </button>
            </div>
          </div>
          <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categories.map((c) => (
              <div key={c._id} className="bg-white border border-zinc-200 rounded-xl p-4 flex justify-between items-center">
                <div>
                  <div className="font-bold text-sm">{c.name}</div>
                  <div className="text-xs text-zinc-400">/{c.slug}</div>
                </div>
                <button
                  type="button"
                  onClick={() => act(() => apiFetch(`/admin/categories/${c._id}`, { method: "DELETE" }), "Category deleted.")}
                  className="text-xs text-red-600 font-bold hover:underline"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: ORDERS & PAYMENTS */}
      {tab === "orders" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-3">
            <h2 className="font-black text-lg">Marketplace Orders ({orders.length})</h2>
            {orders.map((o) => (
              <div key={o._id} className="bg-white border border-zinc-200 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex justify-between font-bold text-sm">
                  <span>{o.orderNumber} · {o.customerId?.name}</span>
                  <span className="text-pink-600 tabular-nums">{formatPKR(o.totalAmount)}</span>
                </div>
                {(o.suborderIds || []).map((sub: any) => (
                  <div key={sub._id} className="flex justify-between items-center bg-zinc-50 px-3 py-2 rounded-lg">
                    <span>
                      {sub.suborderNumber} ({sub.sellerId?.shopName}) · Comm: {formatPKR(sub.commissionAmount)}
                    </span>
                    <span className="font-bold">{sub.status}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="lg:col-span-5 space-y-3">
            <h2 className="font-black text-lg">Payment Verification ({payments.length})</h2>
            {payments.map((pay) => (
              <div key={pay._id} className="bg-white border border-zinc-200 rounded-2xl p-4 flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-sm">{pay.orderId?.orderNumber} · {pay.method}</div>
                  <div className="text-zinc-500">
                    {formatPKR(pay.amount)} · Ref: {pay.transactionRef || "N/A"} · <strong>{pay.status}</strong>
                  </div>
                </div>
                {pay.status !== "paid" && (
                  <button
                    type="button"
                    onClick={() =>
                      act(
                        () => apiFetch(`/admin/payments/${pay._id}`, { method: "PATCH", body: JSON.stringify({ status: "paid" }) }),
                        "Payment marked as Paid."
                      )
                    }
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" /> Verify Paid
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: WITHDRAWALS */}
      {tab === "withdrawals" && (
        <div className="space-y-3">
          {withdrawals.map((w) => (
            <div key={w._id} className="bg-white border border-zinc-200 rounded-2xl p-5 flex flex-wrap justify-between items-center gap-4">
              <div>
                <div className="font-bold text-sm">
                  {w.sellerId?.shopName} · <span className="text-pink-600 tabular-nums">{formatPKR(w.amount)}</span> via {w.method}
                </div>
                <div className="text-xs text-zinc-500">
                  Account: {w.accountDetails?.accountTitle} ({w.accountDetails?.accountNumber}) · Status: <strong>{w.status.toUpperCase()}</strong>
                </div>
              </div>
              {w.status === "pending" && (
                <div className="flex gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() =>
                      act(
                        () => apiFetch(`/admin/withdrawals/${w._id}`, { method: "PATCH", body: JSON.stringify({ status: "paid", payoutReference: `PAY-${Date.now()}` }) }),
                        "Withdrawal marked as Paid."
                      )
                    }
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold"
                  >
                    Approve &amp; Mark Paid
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      act(
                        () => apiFetch(`/admin/withdrawals/${w._id}`, { method: "PATCH", body: JSON.stringify({ status: "rejected" }) }),
                        "Withdrawal rejected & balance refunded to seller."
                      )
                    }
                    className="px-3 py-1.5 rounded-lg border border-red-300 text-red-600 font-bold"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TAB: MARKETING (BANNERS & COUPONS) */}
      {tab === "marketing" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-4">
            <h2 className="font-black text-lg">Homepage Promotional Banners</h2>
            <div className="space-y-2">
              <input
                placeholder="Banner Headline"
                value={bannerTitle}
                onChange={(e) => setBannerTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-xl"
              />
              <input
                placeholder="Subtitle"
                value={bannerSub}
                onChange={(e) => setBannerSub(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-xl"
              />
              <button
                type="button"
                onClick={() => {
                  if (!bannerTitle.trim()) return;
                  act(
                    () => apiFetch("/admin/banners", { method: "POST", body: JSON.stringify({ title: bannerTitle, subtitle: bannerSub }) }),
                    "Homepage banner published."
                  );
                  setBannerTitle("");
                  setBannerSub("");
                }}
                className="px-4 py-2 rounded-xl bg-pink-600 text-white text-xs font-bold"
              >
                Add Banner
              </button>
            </div>
            <div className="space-y-2 pt-2">
              {banners.map((b) => (
                <div key={b._id} className="p-3 rounded-xl bg-zinc-50 flex justify-between items-center text-xs">
                  <span className="font-bold">{b.title}</span>
                  <button
                    type="button"
                    onClick={() => act(() => apiFetch(`/admin/banners/${b._id}`, { method: "DELETE" }), "Banner deleted.")}
                    className="text-red-600 font-bold"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-4">
            <h2 className="font-black text-lg">Discount Coupons</h2>
            <div className="flex gap-2">
              <input
                placeholder="CODE (e.g. EID20)"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-zinc-300 rounded-xl uppercase"
              />
              <input
                type="number"
                placeholder="% Off"
                value={couponVal}
                onChange={(e) => setCouponVal(e.target.value)}
                className="w-24 px-3 py-2 text-sm border border-zinc-300 rounded-xl"
              />
              <button
                type="button"
                onClick={() => {
                  if (!couponCode.trim()) return;
                  act(
                    () =>
                      apiFetch("/admin/coupons", {
                        method: "POST",
                        body: JSON.stringify({
                          code: couponCode,
                          discountType: "percent",
                          discountValue: Number(couponVal),
                          expiresAt: new Date(Date.now() + 60 * 86400000).toISOString(),
                        }),
                      }),
                    `Coupon ${couponCode.toUpperCase()} created.`
                  );
                  setCouponCode("");
                }}
                className="px-4 py-2 rounded-xl bg-black text-white text-xs font-bold"
              >
                Create
              </button>
            </div>
            <div className="space-y-2">
              {coupons.map((c) => (
                <div key={c._id} className="p-3 rounded-xl bg-zinc-50 flex justify-between items-center text-xs">
                  <span>
                    <strong className="text-pink-600">{c.code}</strong> · {c.discountValue}
                    {c.discountType === "percent" ? "%" : " PKR"} off (Used: {c.usedCount})
                  </span>
                  <button
                    type="button"
                    onClick={() => act(() => apiFetch(`/admin/coupons/${c._id}`, { method: "DELETE" }), "Coupon removed.")}
                    className="text-red-600 font-bold"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: CUSTOMERS & RETURNS */}
      {tab === "returns" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-3">
            <h2 className="font-black text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-pink-600" /> Customers ({customers.length})
            </h2>
            {customers.map((c) => (
              <div key={c._id} className="p-3 rounded-xl bg-zinc-50 flex justify-between items-center text-xs">
                <div>
                  <strong>{c.name}</strong> ({c.email})
                </div>
                <button
                  type="button"
                  onClick={() =>
                    act(
                      () => apiFetch(`/admin/customers/${c._id}`, { method: "PATCH", body: JSON.stringify({ isActive: !c.isActive }) }),
                      `Updated customer status.`
                    )
                  }
                  className={`px-3 py-1 rounded-lg font-bold ${
                    c.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                  }`}
                >
                  {c.isActive ? "Active" : "Suspended"}
                </button>
              </div>
            ))}
          </div>

          <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-3">
            <h2 className="font-black text-lg">Returns &amp; Refunds ({returns.length})</h2>
            {returns.length === 0 ? (
              <p className="text-sm text-zinc-500">No return requests submitted yet.</p>
            ) : (
              returns.map((r) => (
                <div key={r._id} className="p-4 rounded-xl bg-zinc-50 space-y-2 text-xs">
                  <div className="flex justify-between font-bold">
                    <span>{r.suborderId?.suborderNumber} · {r.customerId?.name}</span>
                    <span className="text-pink-600">{formatPKR(r.refundAmount)}</span>
                  </div>
                  <p className="text-zinc-600">{r.reason}: {r.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="font-bold uppercase">{r.status}</span>
                    {r.status === "requested" && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            act(
                              () => apiFetch(`/admin/returns/${r._id}`, { method: "PATCH", body: JSON.stringify({ status: "refunded" }) }),
                              "Refund approved & commission reversed."
                            )
                          }
                          className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold"
                        >
                          Approve Refund
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            act(
                              () => apiFetch(`/admin/returns/${r._id}`, { method: "PATCH", body: JSON.stringify({ status: "rejected" }) }),
                              "Return request rejected."
                            )
                          }
                          className="px-3 py-1 rounded-lg border border-red-300 text-red-600 font-bold"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
