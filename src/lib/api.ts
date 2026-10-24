export interface SearchFormValues {
  name: string;
  city: string;
  phone: string;
  username: string;
  email: string;
}

export interface PlatformResult {
  platform: string;
  title: string;
  link: string;
  snippet?: string | null;
  rank?: number | null;
}

export interface FootprintResponse {
  success: boolean;
  input: Record<string, string>;
  total_results: number;
  results: PlatformResult[];
  agent_summary: string | null;
  message: string;
  locked?: boolean;
  credits_charged?: number | null;
  current_credits?: number | null;
  required_credits?: number | null;
}

/** Locked (HTTP 402) report payload — first 2 rows visible, rest masked. */
export interface LockedReport {
  locked: true;
  message: string;
  input: Record<string, string>;
  total_results: number;
  results: PlatformResult[];
  agent_summary: null;
  required_credits: number;
  current_credits: number;
}

/** Thrown when the backend returns HTTP 402 (not enough credits). */
export class PaywallError extends Error {
  locked: LockedReport;
  constructor(locked: LockedReport) {
    super(locked.message || "Not enough credits to unlock this report.");
    this.name = "PaywallError";
    this.locked = locked;
  }
}

/** Thrown when the backend returns HTTP 401 (missing/expired token). */
export class UnauthorizedError extends Error {
  status = 401;
  constructor(message = "Please log in to run Deep Internet Analysis.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export interface SummarizeResponse {
  success: boolean;
  agent_summary: string | null;
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "https://dfa-9ha3.onrender.com";

export function buildSearchPayload(values: SearchFormValues) {
  const payload: Record<string, string> = {};
  const name = values.name.trim();
  const city = values.city.trim();
  const phone = values.phone.trim();
  const username = values.username.trim();
  const email = values.email.trim();

  if (name) payload.query = name;
  if (city) payload.city = city;
  if (phone) payload.phone = phone.replace(/[\s-]/g, "");
  if (username) payload.username = username.replace(/^@/, "");
  if (email) payload.email = email;

  return payload;
}

function getAuthHeader(): Record<string, string> {
  try {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) return { Authorization: `Bearer ${token}` };
  } catch {
    /* storage unavailable */
  }
  return {};
}

export async function searchFootprint(
  values: SearchFormValues,
  signal?: AbortSignal,
  includeSummary: boolean = true
): Promise<FootprintResponse> {
  const payload: Record<string, string | boolean> = buildSearchPayload(values);
  payload.include_summary = includeSummary;

  if (Object.keys(payload).length <= 1) {
    throw new Error("Please fill at least one box to start search.");
  }

  // Deep Internet Analysis requires login — send JWT Bearer token.
  const authHeader = getAuthHeader();
  if (!authHeader.Authorization) {
    throw new UnauthorizedError("Please log in to run Deep Internet Analysis.");
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/deep-internet-analysis`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader },
      body: JSON.stringify(payload),
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new Error(
      "Could not connect to server. It may be waking up — please wait 30 seconds and try again."
    );
  }

  if (!res.ok) {
    let data: Record<string, unknown> | null = null;
    try {
      data = (await res.json()) as Record<string, unknown>;
    } catch {
      /* ignore */
    }
    // Paywall: backend returns 402 with detail = locked report object.
    if (res.status === 402) {
      const raw =
        data && typeof data.detail === "object" && data.detail !== null
          ? (data.detail as Record<string, unknown>)
          : data;
      const locked: LockedReport = {
        locked: true,
        message:
          typeof raw?.message === "string" && raw.message
            ? raw.message
            : "Not enough credits to unlock this report.",
        input:
          raw?.input && typeof raw.input === "object"
            ? (raw.input as Record<string, string>)
            : {},
        total_results:
          typeof raw?.total_results === "number" ? raw.total_results : 0,
        results: Array.isArray(raw?.results)
          ? (raw.results as PlatformResult[])
          : [],
        agent_summary: null,
        required_credits:
          typeof raw?.required_credits === "number"
            ? raw.required_credits
            : includeSummary
              ? 30
              : 20,
        current_credits:
          typeof raw?.current_credits === "number" ? raw.current_credits : 0,
      };
      throw new PaywallError(locked);
    }
    if (res.status === 401) {
      const detail =
        (data?.detail as string) ||
        (data?.message as string) ||
        "Please log in to run Deep Internet Analysis.";
      throw new UnauthorizedError(detail);
    }
    const detail =
      (data?.detail as string) ||
      (data?.message as string) ||
      `Server error (${res.status}). Please try again in a minute.`;
    throw new Error(detail);
  }

  const data = (await res.json()) as FootprintResponse;
  return {
    ...data,
    locked: false,
    results: Array.isArray(data.results) ? data.results : [],
    agent_summary:
      typeof data.agent_summary === "string" ? data.agent_summary : null,
    total_results:
      typeof data.total_results === "number"
        ? data.total_results
        : data.results?.length ?? 0,
  };
}

/** Pricing: 1 credit = ₹1. Report 20, AI mode +10, standalone re-summarize 10. */
export const REPORT_COST = 20;
export const AI_COST = 10;
export const RESUMMARIZE_COST = 10;

export function reportCost(includeSummary: boolean): number {
  return REPORT_COST + (includeSummary ? AI_COST : 0);
}

/**
 * Free Instagram-only preview (no login required). Always locked=true —
 * every result arrives masked (link "locked", partial titles) so the full
 * Deep Internet Analysis must be unlocked for 20 credits (₹20).
 */
export async function freeSearchFootprint(
  values: SearchFormValues,
  signal?: AbortSignal
): Promise<LockedReport> {
  const payload = buildSearchPayload(values);

  if (Object.keys(payload).length === 0) {
    throw new Error("Please fill at least one box to start search.");
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/free-search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new Error(
      "Could not connect to server. It may be waking up — please wait 30 seconds and try again."
    );
  }

  if (!res.ok) {
    let detail = "";
    try {
      const data = await res.json();
      detail = data?.detail || data?.message || "";
    } catch {
      /* ignore */
    }
    if (res.status === 422) {
      throw new Error(
        detail || "Please fill at least one box — name, phone, username or email."
      );
    }
    throw new Error(
      detail || `Server error (${res.status}). Please try again in a minute.`
    );
  }

  const data = (await res.json()) as FootprintResponse;
  return {
    locked: true,
    message: data.message || "Free Instagram preview.",
    input: data.input ?? {},
    total_results:
      typeof data.total_results === "number"
        ? data.total_results
        : (data.results?.length ?? 0),
    results: Array.isArray(data.results) ? data.results : [],
    agent_summary: null,
    required_credits:
      typeof data.required_credits === "number"
        ? data.required_credits
        : REPORT_COST,
    current_credits:
      typeof data.current_credits === "number" ? data.current_credits : 0,
  };
}

/**
 * Re-generate the AI summary without re-running the search.
 * POST /summarize { input, results } → { success, agent_summary }
 * Standalone re-summarize costs 10 credits (backend-enforced).
 */
export async function summarizeFootprint(
  input: Record<string, string>,
  results: PlatformResult[],
  signal?: AbortSignal
): Promise<string | null> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/summarize`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify({ input, results }),
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new Error(
      "Could not connect to server. It may be waking up — please wait 30 seconds and try again."
    );
  }

  if (!res.ok) {
    let detail = "";
    try {
      const data = await res.json();
      detail = data?.detail || data?.message || "";
    } catch {
      /* ignore */
    }
    if (res.status === 401) {
      throw new UnauthorizedError(
        detail || "Please log in again to make a summary."
      );
    }
    if (res.status === 402) {
      throw new Error(
        detail ||
          "Not enough credits for a summary (10 credits). Buy credits to continue."
      );
    }
    if (res.status === 502) {
      throw new Error(
        "Summary helper is resting right now. Please try again in a minute."
      );
    }
    throw new Error(
      detail || `Server error (${res.status}). Please try again in a minute.`
    );
  }

  const data = (await res.json()) as SummarizeResponse;
  return typeof data.agent_summary === "string" ? data.agent_summary : null;
}

export function validateForm(values: SearchFormValues): string | null {
  const filled = [
    values.name.trim(),
    values.city.trim(),
    values.phone.trim(),
    values.username.trim(),
    values.email.trim(),
  ].some(Boolean);

  if (!filled) return "Please fill at least one box — for example, your name or phone number.";

  if (values.email.trim()) {
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim());
    if (!ok) return "That email does not look correct. Please check it.";
  }

  if (values.phone.trim()) {
    const digits = values.phone.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
    if (digits.length < 10)
      return "Phone number should have at least 10 digits (e.g. 98765 43210).";
    if (digits.length > 11)
      return "That phone number looks too long. Please check it.";
  }

  return null;
}

/** Soft badge colours per platform — keeps UI trustworthy, not flashy. */
export function platformStyle(platform: string): string {
  const p = platform.toLowerCase();
  if (p.includes("instagram"))
    return "bg-pink-50 text-pink-700 ring-pink-200";
  if (p.includes("facebook"))
    return "bg-blue-50 text-blue-700 ring-blue-200";
  if (p.includes("linkedin")) return "bg-sky-50 text-sky-700 ring-sky-200";
  if (p.includes("twitter") || p.includes("/x"))
    return "bg-slate-100 text-slate-700 ring-slate-300";
  if (p.includes("github"))
    return "bg-zinc-100 text-zinc-800 ring-zinc-300";
  if (p.includes("youtube")) return "bg-red-50 text-red-700 ring-red-200";
  if (p.includes("tiktok")) return "bg-stone-100 text-stone-800 ring-stone-300";
  if (p.includes("naukri")) return "bg-indigo-50 text-indigo-700 ring-indigo-200";
  if (p.includes("justdial") || p.includes("indiamart") || p.includes("business"))
    return "bg-amber-50 text-amber-800 ring-amber-200";
  if (p.includes("whatsapp"))
    return "bg-green-50 text-green-700 ring-green-200";
  if (p.includes("paste")) return "bg-orange-50 text-orange-700 ring-orange-200";
  return "bg-teal-50 text-teal-700 ring-teal-200";
}

export function shortHost(link: string): string {
  try {
    return new URL(link).hostname.replace(/^www\./, "");
  } catch {
    return "link";
  }
}
