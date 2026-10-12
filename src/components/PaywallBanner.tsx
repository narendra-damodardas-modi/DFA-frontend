"use client";

import { Lock, Wallet } from "lucide-react";

interface Props {
  requiredCredits: number;
  currentCredits: number;
  includeSummary: boolean;
  onBuy: () => void;
}

export default function PaywallBanner({
  requiredCredits,
  currentCredits,
  includeSummary,
  onBuy,
}: Props) {
  const breakdown = includeSummary
    ? "(20 report + 10 AI)"
    : "(20 report)";
  return (
    <div
      role="alert"
      className="mb-4 rounded-[28px] border border-amber-200 bg-gradient-to-b from-amber-50 to-white p-5 shadow-sm sm:p-6"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-400 text-white shadow-sm">
          <Lock size={19} />
        </span>
        <div className="min-w-0">
          <h2 className="text-[15.5px] font-extrabold text-slate-900">
            Report locked 🔒
          </h2>
          <p className="mt-1 text-[13.5px] leading-relaxed text-slate-600">
            This report costs{" "}
            <span className="font-bold text-slate-900">
              {requiredCredits} credits {breakdown}
            </span>
            . You have{" "}
            <span className="font-bold text-slate-900">{currentCredits}</span>.
            Buy credits to unlock.
          </p>
          <button
            type="button"
            onClick={onBuy}
            className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-b from-indigo-600 to-indigo-700 px-5 py-3 text-[14.5px] font-bold text-white shadow-[0_12px_30px_-8px_rgba(79,70,229,0.6)] transition hover:from-indigo-500 hover:to-indigo-700"
          >
            <Wallet size={17} /> Buy credits to unlock
          </button>
        </div>
      </div>
    </div>
  );
}
