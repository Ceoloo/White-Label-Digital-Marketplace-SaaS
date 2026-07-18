import type { Order, PaymentMethodId } from "@/config/types";

/**
 * Payment method abstraction.
 *
 * Each method returns a normalized `PaymentInstruction` describing what happens
 * next. Stripe settles instantly (in production it would create a Checkout
 * Session); crypto and Zelle return manual-verification instructions. Keeping
 * this behind one interface is what lets clients enable/disable methods purely
 * through configuration.
 */

export interface PaymentInstruction {
  method: PaymentMethodId;
  /** "instant" = paid immediately; "manual" = awaiting verification. */
  settlement: "instant" | "manual";
  /** Human-readable next step shown to the buyer. */
  message: string;
  /** Optional structured details (wallet addresses, Zelle recipient, etc.). */
  details?: Record<string, string>;
}

function cryptoWallets(): Record<string, string> {
  return {
    BTC: process.env.CRYPTO_WALLET_BTC || "(configure CRYPTO_WALLET_BTC)",
    ETH: process.env.CRYPTO_WALLET_ETH || "(configure CRYPTO_WALLET_ETH)",
    USDC: process.env.CRYPTO_WALLET_USDC || "(configure CRYPTO_WALLET_USDC)",
    USDT: process.env.CRYPTO_WALLET_USDT || "(configure CRYPTO_WALLET_USDT)",
  };
}

function zelleRecipient(): Record<string, string> {
  return {
    Name: process.env.ZELLE_RECIPIENT_NAME || "(configure ZELLE_RECIPIENT_NAME)",
    Email: process.env.ZELLE_RECIPIENT_EMAIL || "(configure ZELLE_RECIPIENT_EMAIL)",
    Phone: process.env.ZELLE_RECIPIENT_PHONE || "",
  };
}

/**
 * Produce the instruction + resulting payment status for an order. In the MVP
 * Stripe is treated as instantly paid; the others enter a verification queue.
 */
export function initiatePayment(order: Order): {
  instruction: PaymentInstruction;
  paymentStatus: Order["paymentStatus"];
} {
  switch (order.paymentMethod) {
    case "stripe":
      return {
        instruction: {
          method: "stripe",
          settlement: "instant",
          message:
            "Payment confirmed. Your downloads are unlocked and a receipt has been emailed.",
        },
        paymentStatus: "paid",
      };
    case "crypto":
      return {
        instruction: {
          method: "crypto",
          settlement: "manual",
          message:
            "Send the exact total to one of the wallet addresses below, then paste your transaction hash. Access unlocks once the transaction is confirmed on-chain.",
          details: cryptoWallets(),
        },
        paymentStatus: "verifying",
      };
    case "zelle":
      return {
        instruction: {
          method: "zelle",
          settlement: "manual",
          message:
            "Send the total via Zelle to the recipient below, include your order ID as the memo, and upload the confirmation screenshot. Our team verifies Zelle payments manually.",
          details: { ...zelleRecipient(), "Order ID (memo)": order.id },
        },
        paymentStatus: "verifying",
      };
    default:
      return {
        instruction: {
          method: order.paymentMethod,
          settlement: "manual",
          message: "Awaiting payment.",
        },
        paymentStatus: "pending",
      };
  }
}
