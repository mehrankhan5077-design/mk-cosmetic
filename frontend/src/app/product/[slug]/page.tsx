"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, ShieldCheck, ShoppingCart, Star, Store, Truck, Zap } from "lucide-react";
import { apiFetch, assetUrl, formatPKR } from "@/lib/api";
import { useStore } from "@/context/StoreContext";
import ProductCard from "@/components/ProductCard";

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const { addToCart, toggleWishlist, wishlistIds, user } = useStore();

  const [product, setProduct] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState("");
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  const [rating, setRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewMsg, setReviewMsg] = useState("");

  const loadProduct = async () => {
    try {
      const res = await apiFetch<{ product: any; reviews: any[]; relatedProducts: any[] }>(
        `/storefront/products/${slug}`
      );
      setProduct(res.product);
      setReviews(res.reviews);
      setRelated(res.relatedProducts);
      setSelectedVariant(res.product.variants?.[0] || "Standard");
    } catch {
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProduct();
  }, [slug]);

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-16 text-center text-sm text-zinc-500">Loading product...</div>;
  }

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-black mb-2">Product Not Found</h1>
        <Link href="/shop" className="text-pink-600 font-bold hover:underline">
          Return to Shop
        </Link>
      </div>
    );
  }

  const isWishlisted = wishlistIds.includes(String(product._id));

  const buildCartPayload = () => ({
    productId: product._id,
    slug: product.slug,
    title: product.title,
    brand: product.brand,
    image: product.images?.[0] || "",
    salePrice: product.salePrice,
    price: product.price,
    discountPercent: product.discountPercent || 0,
    stock: product.stock,
    variant: selectedVariant || "Standard",
    qty,
    sellerId: String(product.sellerId?._id || ""),
    sellerName: product.sellerId?.shopName || "Verified Seller",
    sellerSlug: product.sellerId?.slug || "",
  });

  const handleBuyNow = () => {
    addToCart(buildCartPayload());
    router.push("/checkout");
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewMsg("");
    try {
      await apiFetch("/orders/reviews", {
        method: "POST",
        body: JSON.stringify({
          productId: product._id,
          rating,
          title: reviewTitle,
          comment: reviewComment,
        }),
      });
      setReviewTitle("");
      setReviewComment("");
      setReviewMsg("Review submitted successfully!");
      loadProduct();
    } catch (err: any) {
      setReviewMsg(err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="text-xs text-zinc-500 mb-4 flex items-center gap-2">
        <Link href="/" className="hover:text-pink-600">Home</Link>
        <span>/</span>
        <Link href={`/shop?category=${product.categoryId?.slug}`} className="hover:text-pink-600">
          {product.categoryId?.name}
        </Link>
        <span>/</span>
        <span className="text-zinc-900 font-medium truncate">{product.title}</span>
      </div>

      <div className="bg-white border border-zinc-200 rounded-2xl p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Image Gallery */}
        <div className="lg:col-span-5">
          <div className="aspect-square rounded-2xl overflow-hidden bg-pink-50 border border-zinc-100 mb-3">
            <img
              src={assetUrl(product.images?.[activeImage] || product.images?.[0])}
              alt={product.title}
              className="w-full h-full object-cover"
            />
          </div>
          {product.images?.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((img: string, idx: number) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImage(idx)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 ${
                    activeImage === idx ? "border-pink-600" : "border-zinc-200"
                  }`}
                >
                  <img src={assetUrl(img)} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-700 text-xs font-bold uppercase">
                {product.brand}
              </span>
              <span className="text-xs text-zinc-500">SKU: {product.sku || product._id.slice(-6)}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 mb-2">{product.title}</h1>

            <div className="flex items-center gap-3 text-sm mb-4">
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="w-4 h-4 fill-current" />
                <span className="font-bold text-zinc-900">{product.ratingAvg || "New"}</span>
                <span className="text-zinc-500">({product.reviewCount || 0} reviews)</span>
              </div>
              <span className="text-zinc-300">|</span>
              <span className="text-zinc-600">{product.soldCount || 0} sold</span>
              <span className="text-zinc-300">|</span>
              <span className={product.stock > 0 ? "text-emerald-600 font-semibold" : "text-red-600 font-semibold"}>
                {product.stock > 0 ? `${product.stock} in stock` : "Out of Stock"}
              </span>
            </div>

            <div className="bg-pink-50/70 border border-pink-100 rounded-xl p-4 mb-5 flex items-baseline gap-3">
              <span className="text-3xl font-black text-pink-600 tabular-nums">
                {formatPKR(product.salePrice)}
              </span>
              {product.discountPercent > 0 && (
                <>
                  <span className="text-base text-zinc-400 line-through tabular-nums">
                    {formatPKR(product.price)}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-pink-600 text-white text-xs font-bold">
                    Save {product.discountPercent}%
                  </span>
                </>
              )}
            </div>

            {product.variants?.length > 0 && (
              <div className="mb-5">
                <div className="text-xs font-bold uppercase text-zinc-600 mb-2">
                  Select Shade / Variant
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v: string) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
                        selectedVariant === v
                          ? "border-pink-600 bg-pink-50 text-pink-700"
                          : "border-zinc-200 hover:border-zinc-400"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 mb-5">
              <span className="text-xs font-bold uppercase text-zinc-600">Quantity</span>
              <div className="flex items-center border border-zinc-300 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="px-3 py-1.5 font-bold hover:bg-zinc-100"
                >
                  -
                </button>
                <span className="px-4 py-1.5 text-sm font-bold tabular-nums">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.min(product.stock || 1, q + 1))}
                  className="px-3 py-1.5 font-bold hover:bg-zinc-100"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mb-6">
              <button
                type="button"
                disabled={product.stock <= 0}
                onClick={() => addToCart(buildCartPayload())}
                className="flex-1 min-w-[160px] py-3.5 px-5 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-300 text-white font-bold text-sm flex items-center justify-center gap-2 transition"
              >
                <ShoppingCart className="w-4 h-4" />
                Add to Cart
              </button>
              <button
                type="button"
                disabled={product.stock <= 0}
                onClick={handleBuyNow}
                className="flex-1 min-w-[160px] py-3.5 px-5 rounded-xl bg-pink-600 hover:bg-pink-700 disabled:bg-zinc-300 text-white font-bold text-sm flex items-center justify-center gap-2 transition"
              >
                <Zap className="w-4 h-4" />
                Buy Now
              </button>
              <button
                type="button"
                onClick={() => toggleWishlist(product._id)}
                className={`p-3.5 rounded-xl border transition ${
                  isWishlisted
                    ? "bg-pink-600 text-white border-pink-600"
                    : "border-zinc-300 text-zinc-700 hover:border-pink-400"
                }`}
                aria-label="Add to Wishlist"
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? "fill-current" : ""}`} />
              </button>
            </div>

            <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-line border-t border-zinc-100 pt-4">
              {product.description}
            </p>
          </div>

          {/* Seller Shop Card */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-pink-600 text-white flex items-center justify-center">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-zinc-500">Sold &amp; Fulfilled by Independent Seller</div>
                <Link
                  href={`/seller/${product.sellerId?.slug}`}
                  className="font-bold text-sm text-zinc-900 hover:text-pink-600"
                >
                  {product.sellerId?.shopName} · {product.sellerId?.city}
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-zinc-600">
              <span className="flex items-center gap-1">
                <Truck className="w-4 h-4 text-pink-600" /> COD Available
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Authentic Guarantee
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews & Write Review */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
        <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-2xl p-6">
          <h2 className="text-lg font-black mb-4">Customer Ratings &amp; Reviews ({reviews.length})</h2>
          {reviews.length === 0 ? (
            <p className="text-sm text-zinc-500">No reviews yet. Be the first to review this product.</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((r) => (
                <div key={r._id} className="border-b border-zinc-100 pb-4 last:border-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex text-amber-500">
                      {Array.from({ length: r.rating }).map((_, idx) => (
                        <Star key={idx} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-zinc-900">{r.customerId?.name || "Customer"}</span>
                    {r.verifiedPurchase && (
                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                        Verified Purchase
                      </span>
                    )}
                  </div>
                  {r.title && <div className="text-sm font-bold text-zinc-900">{r.title}</div>}
                  <p className="text-sm text-zinc-600 mt-1">{r.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 bg-white border border-zinc-200 rounded-2xl p-6 h-fit">
          <h3 className="text-lg font-black mb-3">Write a Review</h3>
          {user ? (
            <form onSubmit={handleSubmitReview} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-600 mb-1">Rating</label>
                <select
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-xl bg-white"
                >
                  <option value={5}>5 Stars — Love it</option>
                  <option value={4}>4 Stars — Great</option>
                  <option value={3}>3 Stars — Good</option>
                  <option value={2}>2 Stars — Fair</option>
                  <option value={1}>1 Star — Poor</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-600 mb-1">Review Title</label>
                <input
                  type="text"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  placeholder="Great pigment and packaging"
                  className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-600 mb-1">Comment</label>
                <textarea
                  required
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your honest experience..."
                  className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-xl"
                />
              </div>
              {reviewMsg && <p className="text-xs font-semibold text-pink-600">{reviewMsg}</p>}
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-black hover:bg-pink-600 text-white text-sm font-bold transition"
              >
                Submit Review
              </button>
            </form>
          ) : (
            <p className="text-sm text-zinc-500">
              Please{" "}
              <Link href="/auth/login" className="text-pink-600 font-bold underline">
                sign in
              </Link>{" "}
              to rate and review this cosmetic product.
            </p>
          )}
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-black mb-4">Similar Beauty Products</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {related.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
