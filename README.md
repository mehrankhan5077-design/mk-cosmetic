# MK COSMETIC — Multi-Vendor Cosmetics Marketplace (Pakistan · PKR)

**Tagline:** *Beauty Shopping Made Easy*  
**Stack:** Next.js 15 (React 19, Tailwind CSS) · Node.js / Express · MongoDB (Mongoose) · JWT RBAC Auth · Cloudinary / Local Image Storage · Integration-Ready Pakistani Payment Gateways (COD, Bank Transfer, JazzCash, Easypaisa)

---

## Architecture Highlights

- **True Multi-Vendor Marketplace:** The platform owner does not sell personal products. Independent cosmetics sellers register shops, await Admin approval, upload products/images, manage stock & discounts, fulfill split seller suborders, and request PKR payouts.
- **Automatic Multi-Seller Order Splitting:** Checking out with items from multiple sellers automatically splits the master `Order` into separate per-seller `Suborders` with individual statuses (`Pending`, `Confirmed`, `Processing`, `Shipped`, `Out for Delivery`, `Delivered`, `Cancelled`, `Returned`).
- **Dynamic Commission Engine:** Calculates `MK COSMETIC` commission and `Seller Earnings` per suborder using either the seller's custom rate or the Admin-configured global rate (e.g., `Rs. 1,000` at `10%` → `Rs. 100` commission + `Rs. 900` seller earnings). Balances automatically move from `pendingBalance` to `availableBalance` upon `Delivered`, and reverse on `Cancelled`/`Returned`.
- **14 MongoDB Collections:** `Users`, `Sellers`, `Products`, `Categories`, `Orders`, `Suborders`, `Payments`, `Commissions`, `Withdrawals`, `Reviews`, `Coupons`, `Returns`, `Banners`, `Settings`.
- **Honest Payment System:** Cash on Delivery & Bank Transfer (with IBFT reference + Admin payment verification) work out-of-the-box. JazzCash & Easypaisa adapters generate genuine HMAC-SHA256 / AES payloads when merchant keys are provided in `.env`, and explicitly report unconfigured status otherwise (never faking live charges).

---

## Quick Start

1. Copy `.env.example` to `backend/.env` and `frontend/.env.local` if customizing MongoDB Atlas, Cloudinary, or JazzCash/Easypaisa credentials. (If `MONGODB_URI` is left blank in development, the backend automatically starts a persistent local MongoDB instance via `mongodb-memory-server`.)
2. Start both Backend (`:5000`) and Frontend (`:3000`):
   ```bash
   npm run dev
   ```
3. Run backend automated API tests:
   ```bash
   npm run test:backend
   ```
4. Build Next.js frontend for production:
   ```bash
   npm run build
   ```

---

## Seeded Test Accounts

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@mkcosmetic.pk` | `Admin@12345` |
| **Seller (Approved)** | `glamaura@mkcosmetic.pk` | `Seller@12345` |
| **Seller (Approved)** | `noorbotanics@mkcosmetic.pk` | `Seller@12345` |
| **Customer** | `ayesha@example.pk` | `Customer@12345` |
