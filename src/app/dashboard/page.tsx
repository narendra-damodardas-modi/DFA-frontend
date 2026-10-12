"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Globe2,
  ListFilter,
  Loader2,
  Lock,
  LogOut,
  RotateCcw,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import SearchForm from "@/components/SearchForm";
import ResultCard from "@/components/ResultCard";
import SummaryCard from "@/components/SummaryCard";
import PaywallBanner from "@/components/PaywallBanner";
import BuyCreditsModal from "@/components/BuyCreditsModal";
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  LoadingState,
  NoResults,
} from "@/components/States";
import {
  PaywallError,
  UnauthorizedError,
  reportCost,
  searchFootprint,
  summarizeFootprint,
  validateForm,
  type FootprintResponse,
  type LockedReport,
  type SearchFormValues,
} from "@/lib/api";
import {
  clearAuth,
  fetchMe,
  getToken,
  getUser,
  type AuthUser,
} from "@/lib/auth";
import { getCreditsBalance } from "@/lib/payments";

const EMPTY: SearchFormValues = {
  name: "",
  city: "",
  phone: "",
  username: "",
  email: "",
};

const EXAMPLE: SearchFormValues = {
  name: "Rahul Sharma",
  city: "Hyderabad",
  phone: "",
  username: "rahul.sharma",
  email: "",
};

type Status = "idle" | "loading" | "done" | "error";
type AuthStatus = "checking" | "ok";

export default function DashboardPage() {
  const router = useRouter();
  const [authStatus, setAuthStatus] = useState<AuthStatus>("checking");
  // Lazy init from localStorage so refresh shows cached user without a sync setState in effect.
  const [user, setUser] = useState<AuthUser | null>(() => getUser());
  const [credits, setCredits] = useState<number | null>(
    () => getUser()?.credits ?? null
  );

  const [values, setValues] = useState<SearchFormValues>(EMPTY);
  const [status, setStatus] = useState<Status>("idle");
  const [data, setData] = useState<FootprintResponse | null>(null);
  const [locked, setLocked] = useState<LockedReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [platformFilter, setPlatformFilter] = useState<string>("All");
  const [includeSummary, setIncludeSummary] = useState(true);
  const [summarySkipped, setSummarySkipped] = useState(false);
  const [summaryBusy, setSummaryBusy] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [buyOpen, setBuyOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const refreshBalance = async () => {
    try {
      const b = await getCreditsBalance();
      setCredits(b);
    } catch {
      /* keep old balance on failure */
    }
  };

  // Protected guard: token required, validated via GET /auth/me.
  // Refresh persists login via localStorage + this check.
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    // Re-validate the stored token via GET /auth/me (in a callback, not sync).
    fetchMe(token)
      .then((me) => {
        setUser(me);
        if (typeof me.credits === "number") setCredits(me.credits);
        setAuthStatus("ok");
        // Keep cached copy fresh (persist login across refresh).
        try {
          localStorage.setItem("user", JSON.stringify(me));
        } catch {
          /* ignore */
        }
        // Fetch the latest wallet balance (auth required).
        refreshBalance();
      })
      .catch(() => {
        clearAuth();
        router.replace("/login");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const logout = () => {
    abortRef.current?.abort();
    clearAuth();
    router.replace("/login");
  };

  const patch = (p: Partial<SearchFormValues>) => {
    setValues((v) => ({ ...v, ...p }));
    if (formError) setFormError(null);
  };

  const doSearch = async (override?: SearchFormValues) => {
    const v = override ?? values;
    if (override) setValues(override);

    const msg = validateForm(v);
    if (msg) {
      setFormError(msg);
      return;
    }
    setFormError(null);
    setError(null);
    setSummaryError(null);
    setLocked(null);
    setStatus("loading");
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    requestAnimationFrame(() =>
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    );

    try {
      const res = await searchFootprint(v, ctrl.signal, includeSummary);
      setData(res);
      setLocked(null);
      setSummarySkipped(!includeSummary);
      setPlatformFilter("All");
      // Update wallet from the success payload; fall back to a refresh.
      if (typeof res.current_credits === "number") {
        setCredits(res.current_credits);
      } else {
        void refreshBalance();
      }
      setStatus("done");
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      if (e instanceof UnauthorizedError) {
        clearAuth();
        router.replace("/login");
        return;
      }
      if (e instanceof PaywallError) {
        setData(null);
        setLocked(e.locked);
        setCredits(e.locked.current_credits);
        setPlatformFilter("All");
        setStatus("done");
        return;
      }
      setError(
        e instanceof Error ? e.message : "Something went wrong. Please try again."
      );
      setStatus("error");
    }
  };

  const regenerateSummary = async () => {
    if (!data || summaryBusy) return;
    setSummaryBusy(true);
    setSummaryError(null);
    try {
      const summary = await summarizeFootprint(data.input, data.results);
      setData((d) => (d ? { ...d, agent_summary: summary } : d));
      setSummarySkipped(false);
      if (summary === null) {
        setSummaryError("Still no summary. Please try again in a minute.");
      }
      void refreshBalance();
    } catch (e) {
      if (e instanceof UnauthorizedError) {
        clearAuth();
        router.replace("/login");
        return;
      }
      setSummaryError(
        e instanceof Error ? e.message : "Could not make summary. Please try again."
      );
    } finally {
      setSummaryBusy(false);
    }
  };

  const report = data ?? locked;
  const platforms = useMemo(() => {
    if (!report) return ["All"];
    const set = new Set(report.results.map((r) => r.platform));
    return ["All", ...Array.from(set).sort()];
  }, [report]);

  // Group results by platform for the "grouped by platform" view.
  const grouped = useMemo(() => {
    const list =
      platformFilter === "All" || !report
        ? report?.results ?? []
        : report.results.filter((r) => r.platform === platformFilter);
    const map = new Map<string, typeof list>();
    for (const r of list) {
      const arr = map.get(r.platform) ?? [];
      arr.push(r);
      map.set(r.platform, arr);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [report, platformFilter]);

  const visibleCount = grouped.reduce((n, [, arr]) => n + arr.length, 0);

  if (authStatus === "checking" && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f7fb]">
        <div className="flex items-center gap-2.5 rounded-full bg-white px-6 py-3.5 text-[14px] font-bold text-slate-600 shadow-sm ring-1 ring-slate-200">
          <Loader2 size={18} className="animate-spin text-indigo-600" />
          Checking your login…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f7fb]">
      {/* ---------- Top bar ---------- */}
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md">
            <ShieldCheck size={21} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-extrabold leading-tight text-slate-900">
              Digital Footprint Finder
            </p>
            <p className="truncate text-[12px] font-medium text-slate-500">
              Hello, {user?.username ?? "friend"} 👋
            </p>
          </div>
          {/* Wallet balance */}
          <button
            type="button"
            onClick={() => setBuyOpen(true)}
            title="Buy credits"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-[12.5px] font-extrabold text-indigo-700 transition hover:bg-indigo-100"
          >
            <Wallet size={14} />
            {credits === null ? "…" : `${credits} credits`}
          </button>
          <button
            type="button"
            onClick={logout}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-[12.5px] font-bold text-slate-600 transition hover:bg-slate-50"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </header>

      <div className="relative overflow-hidden">
        <div className="dot-grid pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[42rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-200/60 via-violet-200/50 to-amber-100/60 blur-3xl" />
        <main className="relative mx-auto max-w-2xl px-4 pb-14 pt-8 sm:pt-10">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200/80 bg-white px-3.5 py-1.5 text-[12px] font-bold text-indigo-700 shadow-sm">
              🔍 Deep Internet Analysis • 1 credit = ₹1
            </span>
            <h1 className="mx-auto mt-3 max-w-md text-[28px] font-black leading-[1.15] tracking-tight text-slate-900 sm:text-[34px]">
              See what the internet knows{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                about you
              </span>
            </h1>
            <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-slate-600">
              Type your name, phone number, or username below. We&apos;ll run a
              Deep Internet Analysis and show public profiles &amp; mentions — in
              simple words. Cost: {reportCost(includeSummary)} credits
              {includeSummary ? " (with AI)" : ""}.
            </p>
          </div>

          {/* Form */}
          <div className="mt-5">
            <SearchForm
              values={values}
              onChange={patch}
              onSubmit={() => doSearch()}
              onFillExample={() => doSearch(EXAMPLE)}
              onClear={() => {
                setValues(EMPTY);
                setFormError(null);
              }}
              loading={status === "loading"}
              formError={formError}
              includeSummary={includeSummary}
              onToggleSummary={setIncludeSummary}
            />
          </div>

          {/* Results */}
          <div ref={resultsRef} className="mt-6 scroll-mt-20">
            {status === "idle" && (
              <EmptyState onExample={() => doSearch(EXAMPLE)} />
            )}

            {status === "loading" && (
              <div className="space-y-3">
                <LoadingState />
                <LoadingSkeleton />
              </div>
            )}

            {status === "error" && (
              <ErrorState
                message={error ?? "Please try again."}
                onRetry={() => doSearch()}
              />
            )}

            {status === "done" && locked && (
              <section aria-live="polite">
                <PaywallBanner
                  requiredCredits={locked.required_credits}
                  currentCredits={locked.current_credits}
                  includeSummary={includeSummary}
                  onBuy={() => setBuyOpen(true)}
                />
                <div className="mb-3 flex items-center gap-2.5 rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400 text-white">
                    <Lock size={19} />
                  </span>
                  <div>
                    <p className="text-[15px] font-extrabold text-slate-900">
                      {locked.total_results}{" "}
                      {locked.total_results === 1 ? "result" : "results"} found — 2
                      shown free
                    </p>
                    <p className="text-[12px] text-slate-500">
                      {locked.message || "Buy credits to unlock the full report"}
                    </p>
                  </div>
                </div>
                {/* Do NOT show agent summary when locked. */}
                {locked.results.length === 0 ? (
                  <NoResults />
                ) : (
                  <>
                    <p className="mb-2.5 text-[12.5px] font-medium text-slate-500">
                      Showing {locked.results.length} of {locked.total_results} •
                      First 2 unlocked, rest blurred 🔒
                    </p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {locked.results.map((r, i) => (
                        <ResultCard
                          key={`${r.link}-${i}`}
                          result={r}
                          locked={r.link === "locked"}
                        />
                      ))}
                    </div>
                  </>
                )}
              </section>
            )}

            {status === "done" && data && !locked && (
              <section aria-live="polite">
                <div className="mb-3 flex items-center justify-between gap-2 rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
                      <BadgeCheck size={19} />
                    </span>
                    <div>
                      <p className="text-[15px] font-extrabold text-slate-900">
                        {data.total_results}{" "}
                        {data.total_results === 1 ? "result" : "results"} found
                      </p>
                      <p className="text-[12px] text-slate-500">
                        {data.message || "Deep Internet Analysis completed"}
                        {typeof data.credits_charged === "number" &&
                          ` • ${data.credits_charged} credits used`}
                        {typeof data.current_credits === "number" &&
                          ` • Balance: ${data.current_credits}`}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setData(null);
                      setStatus("idle");
                      setPlatformFilter("All");
                      setSummaryError(null);
                      setSummarySkipped(false);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3.5 py-2 text-[12.5px] font-bold text-slate-600 transition hover:bg-slate-50"
                  >
                    <RotateCcw size={13} /> New search
                  </button>
                </div>

                {summaryError && (
                  <p
                    role="alert"
                    className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] font-medium leading-snug text-amber-800"
                  >
                    {summaryError}
                  </p>
                )}

                <SummaryCard
                  summary={data.agent_summary ?? null}
                  regenerating={summaryBusy}
                  skipped={summarySkipped && !data.agent_summary}
                  onRegenerate={regenerateSummary}
                />

                {data.results.length === 0 ? (
                  <NoResults />
                ) : (
                  <>
                    {platforms.length > 2 && (
                      <div className="mb-3 flex items-center gap-2 overflow-x-auto pb-1">
                        <ListFilter
                          size={15}
                          className="shrink-0 text-slate-400"
                        />
                        {platforms.map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setPlatformFilter(p)}
                            className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-bold transition ${
                              platformFilter === p
                                ? "bg-slate-900 text-white"
                                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    )}
                    <p className="mb-2.5 text-[12.5px] font-medium text-slate-500">
                      Showing {visibleCount} of {data.results.length} • Tap{" "}
                      <span className="font-bold text-slate-700">Open link</span>{" "}
                      to view
                    </p>
                    {grouped.map(([platform, items]) => (
                      <div key={platform} className="mb-5">
                        <h2 className="mb-2 flex items-center gap-2 text-[13.5px] font-extrabold uppercase tracking-wide text-slate-500">
                          <span className="h-px flex-1 bg-slate-200" />
                          {platform} • {items.length}
                          <span className="h-px flex-1 bg-slate-200" />
                        </h2>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {items.map((r, i) => (
                            <ResultCard key={`${r.link}-${i}`} result={r} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </section>
            )}
          </div>

          {/* Footer */}
          <footer className="mt-8 pb-4 text-center">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[12.5px] font-bold text-slate-600 shadow-sm ring-1 ring-slate-200">
              <Globe2 size={13} className="text-indigo-500" />
              Public data only • Built for India 🇮🇳
            </p>
            <p className="mx-auto mt-3 max-w-sm text-[12px] leading-relaxed text-slate-400">
              This tool only shows information that is already public on the
              internet. It cannot see passwords, OTPs, bank details or private
              messages. Stay safe online. 🙏
            </p>
          </footer>
        </main>
      </div>

      <BuyCreditsModal
        open={buyOpen}
        onClose={() => setBuyOpen(false)}
        onSuccess={(balance) => {
          setCredits(balance);
          // Re-run the last search to unlock the full report.
          void doSearch();
        }}
        onAuthExpired={() => {
          clearAuth();
          router.replace("/login");
        }}
      />
    </div>
  );
}
