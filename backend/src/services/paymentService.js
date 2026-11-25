import crypto from "node:crypto";

export function getBankTransferDetails() {
  return {
    bankName: process.env.BANK_NAME || "Meezan Bank Limited",
    accountTitle: process.env.BANK_ACCOUNT_TITLE || "MK COSMETIC MARKETPLACE",
    accountNumber: process.env.BANK_ACCOUNT_NUMBER || "Configure BANK_ACCOUNT_NUMBER in .env",
    iban: process.env.BANK_IBAN || "Configure BANK_IBAN in .env",
    configured: Boolean(process.env.BANK_ACCOUNT_NUMBER && process.env.BANK_IBAN),
  };
}

export function getGatewayCapabilities() {
  const jazzcashConfigured = Boolean(
    process.env.JAZZCASH_MERCHANT_ID &&
      process.env.JAZZCASH_PASSWORD &&
      process.env.JAZZCASH_INTEGRITY_SALT
  );
  const easypaisaConfigured = Boolean(
    process.env.EASYPAISA_STORE_ID && process.env.EASYPAISA_HASH_KEY
  );

  return {
    COD: {
      enabled: true,
      configured: true,
      label: "Cash on Delivery (All Pakistan)",
      description: "Pay in cash (PKR) to the courier upon parcel arrival.",
    },
    BankTransfer: {
      enabled: true,
      configured: true,
      label: "Bank Transfer (IBFT / Raast)",
      description: "Transfer directly and submit your transaction reference for verification.",
      bankDetails: getBankTransferDetails(),
    },
    JazzCash: {
      enabled: true,
      configured: jazzcashConfigured,
      sandbox: process.env.JAZZCASH_SANDBOX !== "false",
      label: "JazzCash Mobile Wallet / Card",
      description: jazzcashConfigured
        ? "Live/Sandbox JazzCash HMAC-SHA256 gateway ready."
        : "Integration-ready adapter. Requires JAZZCASH_MERCHANT_ID, JAZZCASH_PASSWORD, and JAZZCASH_INTEGRITY_SALT in backend .env.",
    },
    Easypaisa: {
      enabled: true,
      configured: easypaisaConfigured,
      sandbox: process.env.EASYPAISA_SANDBOX !== "false",
      label: "Easypaisa Mobile Account",
      description: easypaisaConfigured
        ? "Live/Sandbox Easypaisa checkout ready."
        : "Integration-ready adapter. Requires EASYPAISA_STORE_ID and EASYPAISA_HASH_KEY in backend .env.",
    },
  };
}

/**
 * Build a genuine HMAC-SHA256 JazzCash checkout payload when credentials exist.
 */
export function buildJazzCashCheckoutSession(order) {
  const caps = getGatewayCapabilities();
  if (!caps.JazzCash.configured) {
    return {
      configured: false,
      error:
        "JazzCash merchant credentials are not configured on this server. Choose Cash on Delivery or Bank Transfer, or add JAZZCASH_* keys to backend/.env.",
    };
  }

  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const txnDateTime = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(
    now.getHours()
  )}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const expiry = new Date(now.getTime() + 60 * 60 * 1000);
  const txnExpiry = `${expiry.getFullYear()}${pad(expiry.getMonth() + 1)}${pad(
    expiry.getDate()
  )}${pad(expiry.getHours())}${pad(expiry.getMinutes())}${pad(expiry.getSeconds())}`;

  const fields = {
    pp_Version: "1.1",
    pp_TxnType: "MWALLET",
    pp_Language: "EN",
    pp_MerchantID: process.env.JAZZCASH_MERCHANT_ID,
    pp_Password: process.env.JAZZCASH_PASSWORD,
    pp_TxnRefNo: order.orderNumber,
    pp_Amount: String(Math.round(order.totalAmount * 100)),
    pp_TxnCurrency: "PKR",
    pp_TxnDateTime: txnDateTime,
    pp_BillReference: order.orderNumber,
    pp_Description: `MK COSMETIC Order ${order.orderNumber}`,
    pp_TxnExpiryDateTime: txnExpiry,
    pp_ReturnURL: process.env.JAZZCASH_RETURN_URL || "http://localhost:3000/orders",
  };

  const sortedKeys = Object.keys(fields).sort();
  const hashString =
    process.env.JAZZCASH_INTEGRITY_SALT +
    "&" +
    sortedKeys.map((k) => fields[k]).join("&");
  fields.pp_SecureHash = crypto
    .createHmac("sha256", process.env.JAZZCASH_INTEGRITY_SALT)
    .update(hashString)
    .digest("hex")
    .toUpperCase();

  const endpoint =
    process.env.JAZZCASH_SANDBOX !== "false"
      ? "https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/"
      : "https://payments.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/";

  return {
    configured: true,
    endpoint,
    fields,
  };
}

/**
 * Build a genuine Easypaisa checkout payload when credentials exist.
 */
export function buildEasypaisaCheckoutSession(order) {
  const caps = getGatewayCapabilities();
  if (!caps.Easypaisa.configured) {
    return {
      configured: false,
      error:
        "Easypaisa store credentials are not configured on this server. Choose Cash on Delivery or Bank Transfer, or add EASYPAISA_* keys to backend/.env.",
    };
  }

  const amountStr = Number(order.totalAmount).toFixed(2);
  const storeId = process.env.EASYPAISA_STORE_ID;
  const hashKey = process.env.EASYPAISA_HASH_KEY;
  const postBackURL = process.env.EASYPAISA_RETURN_URL || "http://localhost:3000/orders";

  const payload = {
    storeId,
    amount: amountStr,
    orderRefNum: order.orderNumber,
    postBackURL,
    paymentMethod: "MA_PAYMENT_METHOD",
  };

  const rawString = `amount=${payload.amount}&orderRefNum=${payload.orderRefNum}&postBackURL=${payload.postBackURL}&storeId=${payload.storeId}`;
  const cipher = crypto.createCipheriv(
    "aes-128-ecb",
    Buffer.from(hashKey.slice(0, 16).padEnd(16, "0")),
    null
  );
  let encryptedHashRequest = cipher.update(rawString, "utf8", "base64");
  encryptedHashRequest += cipher.final("base64");

  payload.merchantHashedReq = encryptedHashRequest;

  const endpoint =
    process.env.EASYPAISA_SANDBOX !== "false"
      ? "https://easypaystg.easypaisa.com.pk/easypay/Index.jsf"
      : "https://easypay.easypaisa.com.pk/easypay/Index.jsf";

  return {
    configured: true,
    endpoint,
    fields: payload,
  };
}
