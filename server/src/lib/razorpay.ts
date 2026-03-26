import { createHmac, timingSafeEqual } from "crypto";

const ORDERS_URL = "https://api.razorpay.com/v1/orders";

export function razorpayConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID?.trim() && process.env.RAZORPAY_KEY_SECRET?.trim());
}

/**
 * Razorpay Checkout signature: HMAC_SHA256(order_id + "|" + payment_id, key_secret) === signature (hex).
 */
export function verifyRazorpayPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string,
): boolean {
  const body = `${orderId}|${paymentId}`;
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  if (expected.length !== signature.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"));
  } catch {
    return false;
  }
}

export type RazorpayOrderCreateResult = {
  id: string;
  amount: number;
  currency: string;
};

/**
 * Create a Razorpay order (server-side). Receipt must be unique; max 40 chars.
 */
export async function razorpayCreateOrder(
  amountPaise: number,
  receipt: string,
  notes?: Record<string, string>,
): Promise<RazorpayOrderCreateResult> {
  const keyId = process.env.RAZORPAY_KEY_ID!.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET!.trim();
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  const res = await fetch(ORDERS_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: "INR",
      receipt: receipt.slice(0, 40),
      notes: notes ?? {},
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Razorpay orders API ${res.status}: ${text.slice(0, 200)}`);
  }

  return res.json() as Promise<RazorpayOrderCreateResult>;
}
