import { MarketplaceSetting } from "../models/MarketplaceSetting.js";
import { Seller } from "../models/Seller.js";
import { Commission } from "../models/Commission.js";

export async function getMarketplaceSettings() {
  let settings = await MarketplaceSetting.findOne({ key: "global" });
  if (!settings) {
    settings = await MarketplaceSetting.create({
      key: "global",
      defaultCommissionRate: 10,
      flatShippingFee: 200,
      freeShippingThreshold: 3500,
      minWithdrawalAmount: 1000,
    });
  }
  return settings;
}

export async function resolveCommissionRate(seller) {
  if (seller && typeof seller.commissionRate === "number") {
    return seller.commissionRate;
  }
  const settings = await getMarketplaceSettings();
  return settings.defaultCommissionRate ?? 10;
}

export function calculateCommissionBreakdown(netSubtotal, commissionRate) {
  const rate = Math.max(0, Math.min(60, Number(commissionRate || 0)));
  const commissionAmount = Math.round((netSubtotal * rate) / 100);
  const sellerEarnings = Math.max(0, netSubtotal - commissionAmount);
  return { commissionRate: rate, commissionAmount, sellerEarnings };
}

/**
 * Sync seller balances & Commission ledger when suborder status transitions.
 */
export async function syncCommissionOnStatusChange(suborder, previousStatus, nextStatus) {
  const commission = await Commission.findOne({ suborderId: suborder._id });
  if (!commission) return;

  const seller = await Seller.findById(suborder.sellerId);
  if (!seller) return;

  // Transition into Delivered -> credit availableBalance from pendingBalance
  if (nextStatus === "Delivered" && commission.status === "pending") {
    commission.status = "credited";
    commission.creditedAt = new Date();
    await commission.save();

    seller.pendingBalance = Math.max(0, seller.pendingBalance - commission.sellerEarnings);
    seller.availableBalance += commission.sellerEarnings;
    seller.totalEarnings += commission.sellerEarnings;
    await seller.save();
    return;
  }

  // Transition into Cancelled or Returned -> reverse commission & balance
  if ((nextStatus === "Cancelled" || nextStatus === "Returned") && commission.status !== "reversed") {
    if (commission.status === "pending") {
      seller.pendingBalance = Math.max(0, seller.pendingBalance - commission.sellerEarnings);
    } else if (commission.status === "credited") {
      seller.availableBalance = Math.max(0, seller.availableBalance - commission.sellerEarnings);
      seller.totalEarnings = Math.max(0, seller.totalEarnings - commission.sellerEarnings);
    }
    commission.status = "reversed";
    commission.reversedAt = new Date();
    await commission.save();
    await seller.save();
  }
}
