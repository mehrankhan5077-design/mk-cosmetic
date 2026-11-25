"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Boxes,
  DollarSign,
  Package,
  Plus,
  Settings,
  Trash2,
  Upload,
  Wallet,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { apiFetch, assetUrl, formatPKR } from "@/lib/api";

const SUBORDER_STATUSES = [
  "Pending",
  "Confirmed",
  "Processing",
  "Shipped",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
  "Returned",
];

export default function SellerDashboardPage() {
  const { user, authLoading } = useStore();
  const [tab, setTab] = useState<"overview" | "products" | "orders" | "withdrawals" | "profile">("overview");
  const [dash, setDash] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  // New Product Form
  const [prodForm, setProdForm] = useState({
    title: "",
    categoryId: "",
    brand: "",
    description: "",
    price: "",
    discountPercent: "0",
    stock: "20",
    variants: "Standard",
    imageUrl: "",
    tags: ["new_arrival"] as string[],
  });
  const [uploadingImg, setUploadingImg] = useState(false);

  // Withdrawal Form
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("BankTransfer");

  // Shop Profile Form
  const [profileForm, setProfileForm] = useState({
    shopName: "",
    city: "",
    phone: "",
    description: "",
  });

  const loadAll = async () => {
    try {
      const [d, p, o, c] = await Promise.all([
        apiFetch("/seller/dashboard"),
        apiFetch<{ products: any[] }>("/seller/products"),
        apiFetch<{ suborders: any[] }>("/seller/orders"),
        apiFetch<{ categories: any[] }>("/storefront/categories"),
      ]);
      setDash(d);
      setProducts(p.products);
      setOrders(o.suborders);
      setCategories(c.categories);
      if (c.categories[0] && !prodForm.categoryId) {
        setProdForm((f) => ({ ...f, categoryId: c.categories[0]._id }));
      }
      if (d.seller) {
        setProfileForm({
          shopName: d.seller.shopName || "",
          city: d.seller.city || "",
          phone: d.seller.phone || "",
          description: d.seller.description || "",
        });
      }
    } catch (e: any) {
      setErr(e.message);
    }
  };

  useEffect(() => {
    if (user?.role === "seller") loadAll();
  }, [user]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    setErr("");
    try {
      const fd = new FormData();
      fd.append("image", file);
      fd.append("folder", "products");
      const res = await apiFetch<{ url: string }>("/uploads/image", {
        method: "POST",
        body: fd,
      });
      setProdForm((f) => ({ ...f, imageUrl: res.url }));
      setMsg("Product image uploaded successfully.");
    } catch (error: any) {
      setErr(error.message);
    } finally {
      setUploadingImg(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    setErr("");
    try {
      await apiFetch("/seller/products", {
        method: "POST",
        body: JSON.stringify({
          title: prodForm.title,
          categoryId: prodForm.categoryId,
          brand: prodForm.brand,
          description: prodForm.description,
          price: Number(prodForm.price),
          discountPercent: Number(prodForm.discountPercent || 0),
          stock: Number(prodForm.stock || 0),
          variants: prodForm.variants.split(",").map((s) => s.trim()).filter(Boolean),
          images: prodForm.imageUrl ? [prodForm.imageUrl] : [],
          tags: prodForm.tags,
        }),
      });
      setMsg("Product submitted for MK COSMETIC Admin approval!");
      setProdForm((f) => ({
        ...f,
        title: "",
        brand: "",
        description: "",
        price: "",
        discountPercent: "0",
        stock: "20",
        imageUrl: "",
      }));
      loadAll();
    } catch (error: any) {
      setErr(error.message);
    }
  };

  const handleQuickProductUpdate = async (id: string, patch: any) => {
    setErr("");
    try {
      await apiFetch(`/seller/products/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      setMsg("Product inventory/discount updated.");
      loadAll();
    } catch (error: any) {
      setErr(error.message);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await apiFetch(`/seller/products/${id}`, { method: "DELETE" });
      setMsg("Product deleted.");
      loadAll();
    } catch (error: any) {
      setErr(error.message);
    }
  };

  const handleOrderStatus = async (subId: string, status: string, trackingNumber?: string, courierName?: string) => {
    setErr("");
    try {
      await apiFetch(`/seller/orders/${subId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, trackingNumber, courierName }),
      });
      setMsg(`Suborder updated to ${status}.`);
      loadAll();
    } catch (error: any) {
      setErr(error.message);
    }
  };

  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    try {
      await apiFetch("/seller/withdrawals", {
        method: "POST",
        body: JSON.stringify({ amount: Number(withdrawAmount), method: withdrawMethod }),
      });
      setWithdrawAmount("");
      setMsg("Withdrawal request submitted to Admin.");
      loadAll();
    } catch (error: any) {
      setErr(error.message);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    try {
      await apiFetch("/seller/profile", {
        method: "PATCH",
        body: JSON.stringify(profileForm),
      });
      setMsg("Shop profile saved.");
      loadAll();
    } catch (error: any) {
      setErr(error.message);
    }
  };

  if (authLoading) return <div className="p-12 text-center text-sm">Loading seller hub...</div>;
  if (!user || user.role !== "seller") {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-black mb-2">Seller Access Required</h1>
        <p className="text-sm text-zinc-500 mb-4">Sign in with a Seller account to manage your MK COSMETIC shop.</p>
        <Link href="/auth/login" className="px-6 py-3 rounded-xl bg-pink-600 text-white font-bold text-sm">
          Sign In
        </Link>
      </div>
    );
  }

  const seller = dash?.seller;
  const stats = dash?.stats || {};
  const maxAnalyticSales = Math.max(1, ...(dash?.analytics || []).map((a: any) => a.sales));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Seller Header */}
      <div className="bg-[#0f0f12] text-white rounded-2xl p-6 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase text-pink-400">MK COSMETIC SELLER HUB</span>
          <h1 className="text-2xl font-black">{seller?.shopName || "My Shop"}</h1>
          <p className="text-xs text-zinc-400">
            Status:{" "}
            <strong className={seller?.status === "approved" ? "text-emerald-400" : "text-amber-400"}>
              {seller?.status?.toUpperCase()}
            </strong>{" "}
            · Commission Rate: <strong className="text-pink-300">{dash?.effectiveCommissionRate ?? 10}%</strong>
          </p>
        </div>
        {seller?.slug && (
          <Link
            href={`/seller/${seller.slug}`}
            className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-xs font-bold"
          >
            View Public Shop
          </Link>
        )}
      </div>

      {seller?.status !== "approved" && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-sm font-semibold">
          Your shop status is currently <strong>{seller?.status}</strong>. Once approved by MK COSMETIC Admin, you can upload products and accept orders.
        </div>
      )}

      {msg && <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold">{msg}</div>}
      {err && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold">{err}</div>}

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { label: "Total Sales", val: formatPKR(stats.totalSales) },
          { label: "Total Orders", val: stats.totalOrders ?? 0 },
          { label: "Total Products", val: stats.totalProducts ?? 0 },
          { label: "Pending Orders", val: stats.pendingOrders ?? 0 },
          { label: "Completed Orders", val: stats.completedOrders ?? 0 },
          { label: "Available Balance", val: formatPKR(stats.availableBalance), highlight: true },
        ].map((k) => (
          <div
            key={k.label}
            className={`rounded-2xl p-4 border ${
              k.highlight ? "bg-pink-600 text-white border-pink-600" : "bg-white border-zinc-200"
            }`}
          >
            <div className={`text-[11px] font-bold uppercase ${k.highlight ? "text-pink-100" : "text-zinc-500"}`}>
              {k.label}
            </div>
            <div className="text-lg font-black mt-1 tabular-nums">{k.val}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { id: "overview", label: "Overview & Analytics", icon: BarChart3 },
          { id: "products", label: "Products & Inventory", icon: Boxes },
          { id: "orders", label: "Order Management", icon: Package },
          { id: "withdrawals", label: "Earnings & Withdrawals", icon: Wallet },
          { id: "profile", label: "Shop Profile", icon: Settings },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id as any)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition ${
              tab === t.id
                ? "bg-black text-white border-black"
                : "bg-white text-zinc-700 border-zinc-200 hover:border-pink-400"
            }`}
          >
            <t.icon className="w-4 h-4 text-pink-500" />
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB: OVERVIEW */}
      {tab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-2xl p-6">
            <h2 className="text-lg font-black mb-4">7-Day Sales Analytics (PKR)</h2>
            <div className="flex items-end gap-3 h-48 pt-4">
              {(dash?.analytics || []).map((day: any) => {
                const h = Math.max(8, Math.round((day.sales / maxAnalyticSales) * 140));
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold text-zinc-600 tabular-nums">
                      {day.sales > 0 ? formatPKR(day.sales) : "0"}
                    </span>
                    <div
                      className="w-full max-w-[44px] bg-gradient-to-t from-pink-600 to-pink-400 rounded-t-lg"
                      style={{ height: `${h}px` }}
                    />
                    <span className="text-[10px] text-zinc-500">{day.date.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-5 bg-white border border-zinc-200 rounded-2xl p-6 space-y-3">
            <h2 className="text-lg font-black">Commission &amp; Balance Breakdown</h2>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-600">Current Commission Rate</span>
                <strong className="text-pink-600">{dash?.effectiveCommissionRate}%</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">Pending Balance (In Transit)</span>
                <strong className="tabular-nums">{formatPKR(stats.pendingBalance)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">Available for Withdrawal</span>
                <strong className="text-emerald-600 tabular-nums">{formatPKR(stats.availableBalance)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">Total Lifetime Earnings</span>
                <strong className="tabular-nums">{formatPKR(stats.totalEarnings)}</strong>
              </div>
            </div>
            <div className="bg-pink-50 border border-pink-100 rounded-xl p-3 text-xs text-zinc-700">
              Example at {dash?.effectiveCommissionRate}%: On a Rs. 1,000 sale, MK COSMETIC commission is{" "}
              <strong>Rs. {Math.round(10 * (dash?.effectiveCommissionRate || 10))}</strong> and your net earnings are{" "}
              <strong>Rs. {1000 - Math.round(10 * (dash?.effectiveCommissionRate || 10))}</strong>.
            </div>
          </div>
        </div>
      )}

      {/* TAB: PRODUCTS */}
      {tab === "products" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white border border-zinc-200 rounded-2xl p-6 h-fit">
            <h2 className="text-lg font-black mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-pink-600" /> Upload New Product
            </h2>
            <form onSubmit={handleCreateProduct} className="space-y-3">
              <input
                required
                placeholder="Product Title (e.g. Velvet Matte Lipstick)"
                value={prodForm.title}
                onChange={(e) => setProdForm({ ...prodForm, title: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-xl"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={prodForm.categoryId}
                  onChange={(e) => setProdForm({ ...prodForm, categoryId: e.target.value })}
                  className="px-3 py-2 text-sm border border-zinc-300 rounded-xl bg-white"
                >
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <input
                  required
                  placeholder="Brand Name"
                  value={prodForm.brand}
                  onChange={(e) => setProdForm({ ...prodForm, brand: e.target.value })}
                  className="px-3 py-2 text-sm border border-zinc-300 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  required
                  min={1}
                  placeholder="Price (PKR)"
                  value={prodForm.price}
                  onChange={(e) => setProdForm({ ...prodForm, price: e.target.value })}
                  className="px-3 py-2 text-sm border border-zinc-300 rounded-xl"
                />
                <input
                  type="number"
                  min={0}
                  max={90}
                  placeholder="Discount %"
                  value={prodForm.discountPercent}
                  onChange={(e) => setProdForm({ ...prodForm, discountPercent: e.target.value })}
                  className="px-3 py-2 text-sm border border-zinc-300 rounded-xl"
                />
                <input
                  type="number"
                  min={0}
                  placeholder="Stock Qty"
                  value={prodForm.stock}
                  onChange={(e) => setProdForm({ ...prodForm, stock: e.target.value })}
                  className="px-3 py-2 text-sm border border-zinc-300 rounded-xl"
                />
              </div>
              <input
                placeholder="Shades / Variants (comma separated)"
                value={prodForm.variants}
                onChange={(e) => setProdForm({ ...prodForm, variants: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-xl"
              />
              <textarea
                required
                rows={3}
                placeholder="Product Description & Usage..."
                value={prodForm.description}
                onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-xl"
              />
              <div className="border border-dashed border-pink-300 rounded-xl p-3 space-y-2 bg-pink-50/40">
                <label className="flex items-center gap-2 text-xs font-bold text-pink-700 cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>{uploadingImg ? "Uploading Image..." : "Upload Product Image"}</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
                <input
                  placeholder="Or paste image URL (/uploads/... or https://...)"
                  value={prodForm.imageUrl}
                  onChange={(e) => setProdForm({ ...prodForm, imageUrl: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs border border-zinc-300 rounded-lg bg-white"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-sm"
              >
                Publish Product
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 space-y-3">
            <h2 className="text-lg font-black">Your Inventory ({products.length})</h2>
            {products.map((p) => (
              <div
                key={p._id}
                className="bg-white border border-zinc-200 rounded-2xl p-4 flex flex-wrap items-center gap-4"
              >
                <img
                  src={assetUrl(p.images?.[0])}
                  alt={p.title}
                  className="w-16 h-16 rounded-xl object-cover bg-pink-50 shrink-0"
                />
                <div className="flex-1 min-w-[180px]">
                  <div className="font-bold text-sm text-zinc-900">{p.title}</div>
                  <div className="text-xs text-zinc-500">
                    {p.categoryId?.name} · {formatPKR(p.salePrice)} (-{p.discountPercent}%) · Stock:{" "}
                    <strong>{p.stock}</strong>
                  </div>
                  <span
                    className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      p.approvalStatus === "approved"
                        ? "bg-emerald-100 text-emerald-700"
                        : p.approvalStatus === "rejected"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {p.approvalStatus}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handleQuickProductUpdate(p._id, { stock: p.stock + 10 })}
                    className="px-2.5 py-1.5 rounded-lg border border-zinc-300 font-semibold hover:bg-zinc-50"
                  >
                    +10 Stock
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickProductUpdate(p._id, {
                        discountPercent: p.discountPercent >= 20 ? 0 : p.discountPercent + 10,
                      })
                    }
                    className="px-2.5 py-1.5 rounded-lg border border-pink-300 text-pink-700 font-semibold hover:bg-pink-50"
                  >
                    Toggle Disc
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteProduct(p._id)}
                    className="p-1.5 text-zinc-400 hover:text-red-600"
                    aria-label="Delete product"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: ORDERS */}
      {tab === "orders" && (
        <div className="space-y-4">
          <h2 className="text-lg font-black">Seller Suborders ({orders.length})</h2>
          {orders.map((sub) => (
            <div key={sub._id} className="bg-white border border-zinc-200 rounded-2xl p-5">
              <div className="flex flex-wrap justify-between items-center gap-3 mb-3">
                <div>
                  <div className="font-bold text-sm">
                    {sub.suborderNumber} · Master Order {sub.orderId?.orderNumber}
                  </div>
                  <div className="text-xs text-zinc-500">
                    Customer: {sub.customerId?.name} ({sub.orderId?.shippingAddress?.city}) · Payment:{" "}
                    {sub.orderId?.paymentMethod}
                  </div>
                </div>
                <div className="text-right text-xs">
                  <div className="font-bold text-zinc-900 tabular-nums">
                    Gross: {formatPKR(sub.subtotal - sub.discountShare)} | Your Earnings:{" "}
                    <span className="text-emerald-600">{formatPKR(sub.sellerEarnings)}</span>
                  </div>
                  <div className="text-zinc-500">
                    MK Commission ({sub.commissionRate}%): {formatPKR(sub.commissionAmount)}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-100">
                <div className="text-xs text-zinc-600">
                  Items: {sub.items.map((i: any) => `${i.title} ×${i.qty}`).join(", ")}
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold">Status:</label>
                  <select
                    value={sub.status}
                    onChange={(e) => handleOrderStatus(sub._id, e.target.value, sub.trackingNumber || "TCS-AUTO", sub.courierName || "TCS")}
                    className="px-3 py-1.5 text-xs font-bold border border-zinc-300 rounded-lg bg-white"
                  >
                    {SUBORDER_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB: WITHDRAWALS */}
      {tab === "withdrawals" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white border border-zinc-200 rounded-2xl p-6 h-fit">
            <h2 className="text-lg font-black mb-2 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-pink-600" /> Request Withdrawal
            </h2>
            <p className="text-xs text-zinc-500 mb-4">
              Available Balance: <strong className="text-emerald-600">{formatPKR(stats.availableBalance)}</strong>{" "}
              · Minimum: {formatPKR(dash?.minWithdrawalAmount || 1000)}
            </p>
            <form onSubmit={handleWithdrawal} className="space-y-3">
              <input
                type="number"
                required
                min={dash?.minWithdrawalAmount || 1000}
                placeholder="Amount in PKR"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-zinc-300 rounded-xl"
              />
              <select
                value={withdrawMethod}
                onChange={(e) => setWithdrawMethod(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-zinc-300 rounded-xl bg-white"
              >
                <option value="BankTransfer">Bank Transfer</option>
                <option value="JazzCash">JazzCash</option>
                <option value="Easypaisa">Easypaisa</option>
              </select>
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-black hover:bg-pink-600 text-white font-bold text-sm"
              >
                Submit Payout Request
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-2xl p-6">
            <h2 className="text-lg font-black mb-4">Withdrawal History &amp; Commission Ledger</h2>
            <div className="space-y-2.5">
              {(dash?.withdrawals || []).length === 0 ? (
                <p className="text-sm text-zinc-500">No withdrawal requests yet.</p>
              ) : (
                dash.withdrawals.map((w: any) => (
                  <div key={w._id} className="flex justify-between items-center p-3 rounded-xl bg-zinc-50 text-sm">
                    <div>
                      <strong className="tabular-nums">{formatPKR(w.amount)}</strong> via {w.method}
                      <div className="text-xs text-zinc-500">{new Date(w.createdAt).toLocaleDateString()}</div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-pink-100 text-pink-800 uppercase">
                      {w.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB: SHOP PROFILE */}
      {tab === "profile" && (
        <div className="max-w-xl bg-white border border-zinc-200 rounded-2xl p-6">
          <h2 className="text-lg font-black mb-4">Manage Shop Profile</h2>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-600 mb-1">Shop Name</label>
              <input
                value={profileForm.shopName}
                onChange={(e) => setProfileForm({ ...profileForm, shopName: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-zinc-300 rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-600 mb-1">City</label>
                <input
                  value={profileForm.city}
                  onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm border border-zinc-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-600 mb-1">Phone</label>
                <input
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm border border-zinc-300 rounded-xl"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-600 mb-1">Shop Bio</label>
              <textarea
                rows={3}
                value={profileForm.description}
                onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-zinc-300 rounded-xl"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-pink-600 text-white text-sm font-bold"
            >
              Save Changes
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
