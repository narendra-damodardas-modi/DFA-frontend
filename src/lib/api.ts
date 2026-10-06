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
  message: string;
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

export async function searchFootprint(
  values: SearchFormValues,
  signal?: AbortSignal
): Promise<FootprintResponse> {
  const payload = buildSearchPayload(values);

  if (Object.keys(payload).length === 0) {
    throw new Error("Please fill at least one box to start search.");
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/search`, {
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
    throw new Error(
      detail || `Server error (${res.status}). Please try again in a minute.`
    );
  }

  const data = (await res.json()) as FootprintResponse;
  return {
    ...data,
    results: Array.isArray(data.results) ? data.results : [],
    total_results:
      typeof data.total_results === "number"
        ? data.total_results
        : data.results?.length ?? 0,
  };
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
