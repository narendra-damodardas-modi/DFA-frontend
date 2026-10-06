"use client";

import {
  AlertTriangle,
  FileSearch,
  Loader2,
  SearchX,
  ShieldCheck,
} from "lucide-react";

export function LoadingState() {
  return (
    <div
      aria-live="polite"
      className="rounded-[28px] border border-indigo-100 bg-white p-8 text-center shadow-sm"
    >
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">
        <Loader2 size={26} className="animate-spin text-indigo-600" />
      </div>
      <h3 className="text-[16px] font-bold text-slate-900">
        Searching the internet for you…
      </h3>
      <p className="mx-auto mt-1.5 max-w-sm text-[13.5px] leading-relaxed text-slate-500">
        Checking Instagram, Facebook, LinkedIn, Google and more. This can take
        20–40 seconds. Please don&apos;t close this page.
      </p>
      <div className="mx-auto mt-5 h-2 max-w-xs overflow-hidden rounded-full bg-slate-100">
        <div className="h-full w-1/2 animate-[loading-slide_1.2s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" />
      </div>
      <p className="mt-4 text-[12px] text-slate-400">
        First search of the day may take longer — server is waking up ☕
      </p>
    </div>
  );
}

export function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-3xl border border-slate-100 bg-white p-5"
        >
          <div className="mb-3 h-6 w-24 rounded-full bg-slate-100" />
          <div className="mb-2 h-4 w-11/12 rounded bg-slate-100" />
          <div className="mb-4 h-4 w-2/3 rounded bg-slate-100" />
          <div className="h-10 rounded-xl bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ onExample }: { onExample: () => void }) {
  return (
    <div className="rounded-[28px] border border-dashed border-slate-300 bg-white/70 p-8 text-center sm:p-10">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-100 to-violet-100">
        <FileSearch size={30} className="text-indigo-600" />
      </div>
      <h3 className="text-[17px] font-bold text-slate-900">
        Your results will appear here
      </h3>
      <p className="mx-auto mt-1.5 max-w-sm text-[13.5px] leading-relaxed text-slate-500">
        Fill any box above — like your name or phone number — and tap{" "}
        <span className="font-semibold text-slate-700">Search Digital Footprint</span>.
      </p>
      <button
        type="button"
        onClick={onExample}
        className="mt-5 rounded-full border border-indigo-200 bg-indigo-50 px-5 py-2.5 text-[13.5px] font-bold text-indigo-700 transition hover:bg-indigo-100"
      >
        Not sure? Try an example →
      </button>
    </div>
  );
}

export function NoResults() {
  return (
    <div className="rounded-[28px] border border-emerald-100 bg-emerald-50/60 p-8 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
        <ShieldCheck size={28} className="text-emerald-600" />
      </div>
      <h3 className="text-[16.5px] font-bold text-slate-900">
        Good news — nothing found! 🎉
      </h3>
      <p className="mx-auto mt-1.5 max-w-sm text-[13.5px] leading-relaxed text-slate-600">
        We could not find any public pages with these details. That usually
        means your privacy settings are strong. Try adding your city or
        username for a deeper check.
      </p>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="rounded-[28px] border border-red-200 bg-red-50 p-7 text-center"
    >
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
        {message.toLowerCase().includes("nothing") ? (
          <SearchX size={24} className="text-slate-500" />
        ) : (
          <AlertTriangle size={24} className="text-red-500" />
        )}
      </div>
      <h3 className="text-[16px] font-bold text-slate-900">
        Something went wrong
      </h3>
      <p className="mx-auto mt-1.5 max-w-md text-[13.5px] leading-relaxed text-slate-600">
        {message}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-full bg-slate-900 px-6 py-2.5 text-[13.5px] font-bold text-white transition hover:bg-slate-700"
      >
        Try again
      </button>
    </div>
  );
}
