"use client";

import { Fragment, type ReactNode } from "react";
import { Loader2, RefreshCw, Sparkles } from "lucide-react";

/** Render **bold** and *italic* safely (no raw HTML). */
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={key} className="font-bold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }
    return <Fragment key={key}>{part}</Fragment>;
  });
}

/**
 * Tiny markdown renderer for agent_summary (Overview / Key traces /
 * Privacy notes / Next steps). No dependencies, no raw HTML — safe by
 * construction. Falls back to plain paragraphs for anything unknown.
 */
export function SummaryBody({ markdown }: { markdown: string }) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let listBuf: { ordered: boolean; items: string[] } | null = null;
  let key = 0;

  const flushList = () => {
    if (!listBuf) return;
    const { ordered, items } = listBuf;
    listBuf = null;
    if (ordered) {
      blocks.push(
        <ol key={`b-${key++}`} className="list-decimal space-y-1.5 pl-5">
          {items.map((item, i) => (
            <li key={i} className="leading-relaxed">
              {renderInline(item, `ol-${key}-${i}`)}
            </li>
          ))}
        </ol>
      );
    } else {
      blocks.push(
        <ul key={`b-${key++}`} className="space-y-1.5">
          {items.map((item, i) => (
            <li key={i} className="flex gap-2 leading-relaxed">
              <span aria-hidden="true" className="mt-0.5 shrink-0 text-indigo-500">
                •
              </span>
              <span>{renderInline(item, `ul-${key}-${i}`)}</span>
            </li>
          ))}
        </ul>
      );
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushList();
      continue;
    }
    if (/^---+$/.test(line)) {
      flushList();
      blocks.push(<hr key={`b-${key++}`} className="border-slate-200" />);
      continue;
    }
    const h3 = line.match(/^###\s+(.*)/);
    if (h3) {
      flushList();
      blocks.push(
        <h4 key={`b-${key++}`} className="pt-1 text-[14px] font-extrabold text-slate-900">
          {renderInline(h3[1], `h3-${key}`)}
        </h4>
      );
      continue;
    }
    const h2 = line.match(/^##\s+(.*)/);
    if (h2) {
      flushList();
      blocks.push(
        <h3 key={`b-${key++}`} className="pt-1 text-[14.5px] font-extrabold text-slate-900">
          {renderInline(h2[1], `h2-${key}`)}
        </h3>
      );
      continue;
    }
    const h1 = line.match(/^#\s+(.*)/);
    if (h1) {
      flushList();
      blocks.push(
        <h3 key={`b-${key++}`} className="text-[15px] font-extrabold text-slate-900">
          {renderInline(h1[1], `h1-${key}`)}
        </h3>
      );
      continue;
    }
    const ordered = line.match(/^\d+[.)]\s+(.*)/);
    if (ordered) {
      if (!listBuf || !listBuf.ordered) {
        flushList();
        listBuf = { ordered: true, items: [] };
      }
      listBuf.items.push(ordered[1]);
      continue;
    }
    const bullet = line.match(/^[-*•]\s+(.*)/);
    if (bullet) {
      if (!listBuf || listBuf.ordered) {
        flushList();
        listBuf = { ordered: false, items: [] };
      }
      listBuf.items.push(bullet[1]);
      continue;
    }
    flushList();
    blocks.push(
      <p key={`b-${key++}`} className="leading-relaxed">
        {renderInline(line, `p-${key}`)}
      </p>
    );
  }
  flushList();

  return <div className="space-y-2 text-[13.5px] text-slate-600">{blocks}</div>;
}

export function SummarySkeleton() {
  return (
    <div className="animate-pulse space-y-2.5" aria-hidden="true">
      <div className="h-4 w-2/3 rounded bg-indigo-100" />
      <div className="h-3.5 w-full rounded bg-slate-100" />
      <div className="h-3.5 w-11/12 rounded bg-slate-100" />
      <div className="h-3.5 w-4/5 rounded bg-slate-100" />
      <div className="h-3.5 w-3/5 rounded bg-slate-100" />
    </div>
  );
}

interface Props {
  summary: string | null;
  regenerating: boolean;
  skipped: boolean;
  onRegenerate: () => void;
}

export default function SummaryCard({ summary, regenerating, skipped, onRegenerate }: Props) {
  return (
    <section
      aria-label="AI summary"
      aria-live="polite"
      className="mb-4 rounded-[28px] border border-indigo-100 bg-gradient-to-b from-indigo-50/70 to-white p-5 shadow-sm sm:p-6"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-[15px] font-extrabold text-slate-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-sm">
            <Sparkles size={16} />
          </span>
          Simple summary
        </h2>
        {(summary || (!summary && !regenerating)) && (
          <button
            type="button"
            onClick={onRegenerate}
            disabled={regenerating}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-indigo-200 bg-white px-3.5 py-1.5 text-[12.5px] font-bold text-indigo-700 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {regenerating ? (
              <>
                <Loader2 size={13} className="animate-spin" /> Working…
              </>
            ) : (
              <>
                <RefreshCw size={13} /> {summary ? "Regenerate" : skipped ? "Make summary" : "Retry"}
              </>
            )}
          </button>
        )}
      </div>

      {regenerating && !summary ? (
        <SummarySkeleton />
      ) : summary ? (
        <>
          {regenerating && (
            <p className="mb-2 flex items-center gap-1.5 text-[12.5px] font-medium text-indigo-600">
              <Loader2 size={13} className="animate-spin" /> Making a fresh summary…
            </p>
          )}
          <div className={regenerating ? "opacity-60" : undefined}>
            <SummaryBody markdown={summary} />
          </div>
          <p className="mt-3 border-t border-indigo-100 pt-2.5 text-[12px] leading-relaxed text-slate-400">
            Written by AI from public results only. It can make mistakes — please check the cards below.
          </p>
        </>
      ) : regenerating ? (
        <SummarySkeleton />
      ) : skipped ? (
        <div className="rounded-2xl border border-dashed border-indigo-200 bg-white/70 p-4 text-center">
          <p className="text-[13.5px] font-bold text-slate-800">Fast search — summary skipped ⚡</p>
          <p className="mx-auto mt-1 max-w-sm text-[13px] leading-relaxed text-slate-500">
            You turned off the AI summary for a quicker search. Tap below to make one now.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-4 text-center">
          <p className="text-[13.5px] font-bold text-slate-800">Summary not ready 😔</p>
          <p className="mx-auto mt-1 max-w-sm text-[13px] leading-relaxed text-slate-500">
            The helper could not write a summary this time. Your result cards below are still correct — tap retry to try again.
          </p>
        </div>
      )}
    </section>
  );
}
