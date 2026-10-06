"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { platformStyle, shortHost, type PlatformResult } from "@/lib/api";

export default function ResultCard({ result }: { result: PlatformResult }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <article className="group flex flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.08)] transition hover:shadow-[0_12px_32px_-12px_rgba(15,23,42,0.18)]">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-[12px] font-bold ring-1 ring-inset ${platformStyle(
            result.platform
          )}`}
        >
          {result.platform}
        </span>
        <span className="truncate text-[12px] font-medium text-slate-400">
          {shortHost(result.link)}
        </span>
      </div>

      <h3 className="line-clamp-2 text-[15.5px] font-bold leading-snug text-slate-900">
        {result.title || "Untitled result"}
      </h3>

      {result.snippet && (
        <p className="mt-1.5 line-clamp-3 text-[13.5px] leading-relaxed text-slate-600">
          {result.snippet}
        </p>
      )}

      <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3.5">
        <a
          href={result.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-[13.5px] font-semibold text-white transition hover:bg-indigo-700"
        >
          <span className="truncate">Open link</span>
          <ExternalLink size={15} className="shrink-0" />
        </a>
        <button
          type="button"
          onClick={copy}
          aria-label="Copy link"
          className="inline-flex shrink-0 items-center justify-center rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
        >
          {copied ? (
            <Check size={16} className="text-green-600" />
          ) : (
            <Copy size={16} />
          )}
        </button>
      </div>
    </article>
  );
}
