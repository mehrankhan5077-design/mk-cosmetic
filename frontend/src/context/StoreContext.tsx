"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiFetch, getStoredToken, setStoredToken } from "@/lib/api";

export interface CartItem {
  productId: string;
  slug: string;
  title: string;
  brand: string;
  image: string;
  salePrice: number;
  price: number;
  discountPercent: number;
  stock: number;
  variant: string;
  qty: number;
  sellerId: string;
  sellerName: string;
  sellerSlug: string;
}

interface StoreContextValue {
  user: any | null;
  seller: any | null;
  authLoading: boolean;
  cart: CartItem[];
  wishlistIds: string[];
  cartCount: number;
  cartSubtotal: number;
  addToCart: (item: CartItem) => void;
  updateCartQty: (productId: string, variant: string, qty: number) => void;
  removeFromCart: (productId: string, variant: string) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => Promise<void>;
  loginSuccess: (token: string, user: any, seller?: any) => void;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

const CART_KEY = "mk_cosmetic_cart_v1";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [seller, setSeller] = useState<any | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_KEY);
      if (saved) setCart(JSON.parse(saved));
    } catch {
      // ignore invalid storage
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {
      // ignore storage errors
    }
  }, [cart]);

  const refreshSession = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setSeller(null);
      setWishlistIds([]);
      setAuthLoading(false);
      return;
    }
    try {
      const res = await apiFetch<{ user: any; seller: any }>("/auth/me", { token });
      setUser(res.user);
      setSeller(res.seller || null);
      const ids = Array.isArray(res.user?.wishlist)
        ? res.user.wishlist.map((w: any) => (typeof w === "string" ? w : w._id))
        : [];
      setWishlistIds(ids);
    } catch {
      setStoredToken(null);
      setUser(null);
      setSeller(null);
      setWishlistIds([]);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const loginSuccess = useCallback((token: string, userData: any, sellerData?: any) => {
    setStoredToken(token);
    setUser(userData);
    setSeller(sellerData || null);
    const ids = Array.isArray(userData?.wishlist)
      ? userData.wishlist.map((w: any) => (typeof w === "string" ? w : w._id))
      : [];
    setWishlistIds(ids);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    setStoredToken(null);
    setUser(null);
    setSeller(null);
    setWishlistIds([]);
  }, []);

  const addToCart = useCallback((item: CartItem) => {
    setCart((prev) => {
      const idx = prev.findIndex(
        (c) => c.productId === item.productId && c.variant === item.variant
      );
      if (idx >= 0) {
        const next = [...prev];
        const newQty = Math.min(item.stock, next[idx].qty + item.qty);
        next[idx] = { ...next[idx], qty: newQty };
        return next;
      }
      return [...prev, { ...item, qty: Math.min(item.stock, Math.max(1, item.qty)) }];
    });
  }, []);

  const updateCartQty = useCallback((productId: string, variant: string, qty: number) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.productId === productId && c.variant === variant) {
            return { ...c, qty: Math.min(c.stock, Math.max(1, qty)) };
          }
          return c;
        })
    );
  }, []);

  const removeFromCart = useCallback((productId: string, variant: string) => {
    setCart((prev) => prev.filter((c) => !(c.productId === productId && c.variant === variant)));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const toggleWishlist = useCallback(
    async (productId: string) => {
      if (!user) {
        window.location.href = "/auth/login";
        return;
      }
      const res = await apiFetch<{ wishlist: string[] }>(`/auth/wishlist/${productId}`, {
        method: "POST",
      });
      setWishlistIds(res.wishlist.map(String));
    },
    [user]
  );

  const cartCount = cart.reduce((acc, item) => acc + item.qty, 0);
  const cartSubtotal = cart.reduce((acc, item) => acc + item.salePrice * item.qty, 0);

  return (
    <StoreContext.Provider
      value={{
        user,
        seller,
        authLoading,
        cart,
        wishlistIds,
        cartCount,
        cartSubtotal,
        addToCart,
        updateCartQty,
        removeFromCart,
        clearCart,
        toggleWishlist,
        loginSuccess,
        refreshSession,
        logout,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
