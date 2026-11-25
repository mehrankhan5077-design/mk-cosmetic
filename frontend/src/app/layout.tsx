import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/context/StoreContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "MK COSMETIC — Beauty Shopping Made Easy | Pakistan Multi-Vendor Marketplace",
  description:
    "Shop authentic makeup, skincare, haircare, perfumes, lipsticks, serums and beauty essentials from verified Pakistani sellers in PKR with Cash on Delivery.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#fafafa] text-zinc-900">
        <StoreProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </StoreProvider>
      </body>
    </html>
  );
}
