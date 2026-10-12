"use client";

import { useState } from "react";
import { Loader2, Wallet, X } from "lucide-react";
import {
  createOrder,
  verifyPayment,
  type RazorpaySuccessResponse,
} from "@/lib/payments";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Called with the fresh balance after a verified purchase. */
  onSuccess: (balance: number) => void;
  onAuthExpired: () => void;
}

export default function BuyCreditsModal({ open, onClose, onSuccess, onAuthExpired }: Props) {
  const [credits, setCredits] = useState(50);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (!open) return null;

  const buy = async () => {
    setError(null);
    setNotice(null);
    const n = Math.floor(Number(credits));
    if (!Number.isFinite(n) || n < 1 || n > 100000) {
      setError("Please enter credits between 1 and 100000.");
      return;
    }
    if (typeof window === "undefined" || !window.Razorpay) {
      setError("Payment box is still loading. Please wait a moment and try again.");
      return;
    }
    setBusy(true);
    try {
      const order = await createOrder(n);
      await new Promise<void>((resolve) => {
        const rzp = new window.Razorpay!({
          key: order.key_id,
          amount: order.amount,
          currency: order.currency || "INR",
          order_id: order.order_id,
          name: "Deep Internet Analysis",
          description: `${order.credits} credits`,
          theme: { color: "#4f46e5" },
          handler: (r: RazorpaySuccessResponse) => {
            (async () => {
              try {
                const verified = await verifyPayment({
                  razorpay_order_id: r.razorpay_order_id,
                  razorpay_payment_id: r.razorpay_payment_id,
                  razorpay_signature: r.razorpay_signature,
                });
                onSuccess(verified.balance);
                onClose();
              } catch (e) {
                const withStatus = e as Error & { status?: number };
                if (withStatus.status === 401) {
                  onAuthExpired();
                  return;
                }
                setError(
                  e instanceof Error ? e.message : "Payment verification failed."
                );
              } finally {
                resolve();
              }
            })();
          },
          modal: {
            ondismiss: () => {
              setNotice("Payment cancelled.");
              resolve();
            },
          },
        });
        rzp.on("payment.failed", (e) => {
          setError(e?.error?.description || "Payment failed. Please try again.");
        });
        rzp.open();
      });
    } catch (e) {
      const withStatus = e as Error & { status?: number };
      if (withStatus.status === 401) {
        onAuthExpired();
        return;
      }
      setError(e instanceof Error ? e.message : "Could not start payment.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Buy credits"
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-[28px] bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white">
              <Wallet size={20} />
            </span>
            <div>
              <h2 className="text-[17px] font-extrabold text-slate-900">Buy credits</h2>
              <p className="text-[12.5px] text-slate-500">1 credit = ₹1 • Secure UPI/cards via Razorpay</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            disabled={busy}
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        <label htmlFor="credits-input" className="mb-1.5 mt-4 block text-[14px] font-semibold text-slate-800">
          How many credits?
        </label>
        <input
          id="credits-input"
          type="number"
          min={1}
          max={100000}
          value={credits}
          disabled={busy}
          onChange={(e) => setCredits(Number(e.target.value))}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3.5 text-[16px] font-bold text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
        />
        <p className="mt-1.5 text-[13px] text-slate-500">
          You pay <span className="font-bold text-slate-800">₹{Number.isFinite(credits) ? credits : 0}</span> for{" "}
          <span className="font-bold text-slate-800">{Number.isFinite(credits) ? credits : 0} credits</span>. Min 1, max 100000.
        </p>

        {error && (
          <p role="alert" className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13.5px] font-medium leading-snug text-red-700">
            {error}
          </p>
        )}
        {notice && !error && (
          <p className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[13.5px] font-medium text-slate-600">
            {notice}
          </p>
        )}

        <button
          type="button"
          onClick={buy}
          disabled={busy}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-indigo-600 to-indigo-700 px-6 py-4 text-[16px] font-bold text-white shadow-[0_12px_30px_-8px_rgba(79,70,229,0.6)] transition hover:from-indigo-500 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {busy ? (
            <>
              <Loader2 size={19} className="animate-spin" /> Opening payment…
            </>
          ) : (
            <>Pay ₹{Number.isFinite(credits) ? credits : 0} securely</>
          )}
        </button>
        <p className="mt-2.5 text-center text-[12px] text-slate-400">
          UPI • Cards • Netbanking — powered by Razorpay
        </p>
      </div>
    </div>
  );
}
