"use client";

import { getToken } from "@/lib/auth";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "https://dfa-9ha3.onrender.com";

/* ---------- Razorpay Standard Checkout types (public key_id only) ---------- */

export interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  handler: (response: RazorpaySuccessResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
  theme?: { color?: string };
}

export interface RazorpayInstance {
  open: () => void;
  on: (event: "payment.failed", cb: (e: { error: { description?: string } }) => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

/* ---------- Credits API ---------- */

function authHeaders(): Record<string, string> {
  const token = getToken();
  if (!token) throw new Error("Please log in again.");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function extractDetail(data: unknown, fallback: string): string {
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (typeof d.detail === "string" && d.detail) return d.detail;
    if (typeof d.message === "string" && d.message) return d.message;
  }
  return fallback;
}

export async function getCreditsBalance(): Promise<number> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/credits/balance`, {
      headers: authHeaders(),
    });
  } catch {
    throw new Error(
      "Could not connect to server. It may be waking up — please wait 30 seconds and try again."
    );
  }
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    const err = new Error(
      extractDetail(data, `Request failed (${res.status}). Please try again.`)
    ) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  const credits = (data as { credits?: unknown })?.credits;
  if (typeof credits !== "number") throw new Error("Unexpected balance response.");
  return credits;
}

export interface CreateOrderResponse {
  order_id: string;
  amount: number;
  currency: string;
  credits: number;
  key_id: string;
}

export async function createOrder(credits: number): Promise<CreateOrderResponse> {
  const n = Math.floor(Number(credits));
  if (!Number.isFinite(n) || n < 1 || n > 100000) {
    throw new Error("Credits must be between 1 and 100000.");
  }
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/create-order`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ credits: n }),
    });
  } catch {
    throw new Error(
      "Could not connect to server. It may be waking up — please wait 30 seconds and try again."
    );
  }
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    const err = new Error(
      extractDetail(data, `Could not create order (${res.status}).`)
    ) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return data as CreateOrderResponse;
}

export interface VerifyPaymentResponse {
  credits_added: number;
  balance: number;
}

export async function verifyPayment(input: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): Promise<VerifyPaymentResponse> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/verify-payment`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(input),
    });
  } catch {
    throw new Error(
      "Could not connect to server. It may be waking up — please wait 30 seconds and try again."
    );
  }
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    if (res.status === 400) {
      throw new Error("Payment verification failed. Please contact support.");
    }
    if (res.status === 401) {
      const err = new Error("Session expired. Please log in again.") as Error & {
        status?: number;
      };
      err.status = 401;
      throw err;
    }
    const err = new Error(
      extractDetail(data, `Verification failed (${res.status}).`)
    ) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return data as VerifyPaymentResponse;
}
