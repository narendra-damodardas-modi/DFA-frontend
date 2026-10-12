export interface AuthUser {
  id: number;
  username: string;
  email: string;
  created_at: string;
  credits: number;
}

export interface AuthResponse {
  success: boolean;
  access_token: string;
  token_type: string;
  user: AuthUser;
}

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "https://dfa-9ha3.onrender.com";

const TOKEN_KEY = "token";
const USER_KEY = "user";

/* ---------- localStorage helpers ---------- */

export function saveToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function saveUser(user: AuthUser): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function clearAuth(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/** Headers for authenticated calls. Pass extra headers via `extra`. */
export function authHeaders(
  extra: Record<string, string> = {}
): Record<string, string> {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/** Guard helper — returns token or null (caller redirects to /login). */
export function requireAuth(): string | null {
  return getToken();
}

/* ---------- API calls ---------- */

function extractDetail(data: unknown, fallback: string): string {
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (typeof d.detail === "string" && d.detail) return d.detail;
    if (typeof d.message === "string" && d.message) return d.message;
  }
  return fallback;
}

async function handleAuthResponse(res: Response): Promise<AuthResponse> {
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    const fallback =
      res.status === 401
        ? "Invalid credentials"
        : `Request failed (${res.status}). Please try again.`;
    throw new Error(extractDetail(data, fallback));
  }
  return data as AuthResponse;
}

export async function signupRequest(input: {
  username: string;
  email: string;
  password: string;
}): Promise<AuthResponse> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    throw new Error(
      "Could not connect to server. It may be waking up — please wait 30 seconds and try again."
    );
  }
  return handleAuthResponse(res);
}

export async function loginRequest(input: {
  identifier?: string;
  username?: string;
  email?: string;
  password: string;
}): Promise<AuthResponse> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    throw new Error(
      "Could not connect to server. It may be waking up — please wait 30 seconds and try again."
    );
  }
  return handleAuthResponse(res);
}

export async function fetchMe(token?: string): Promise<AuthUser> {
  const t = token ?? getToken();
  if (!t) throw new Error("Not logged in. Please log in again.");
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${t}` },
    });
  } catch {
    throw new Error(
      "Could not connect to server. It may be waking up — please wait 30 seconds and try again."
    );
  }
  if (!res.ok) {
    let detail = "Session expired. Please log in again.";
    try {
      const data = await res.json();
      detail = extractDetail(data, detail);
    } catch {
      /* ignore */
    }
    const err = new Error(detail) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return (await res.json()) as AuthUser;
}

/** Persist login (token + user) after signup/login success. */
export function persistAuth(auth: AuthResponse): void {
  saveToken(auth.access_token);
  saveUser(auth.user);
}

/* ---------- Email OTP + forgot password ---------- */

export interface OtpResponse {
  success: boolean;
  message: string;
  dev_otp?: string | null;
}

async function handleOtpResponse(res: Response): Promise<OtpResponse> {
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    throw new Error(extractDetail(data, `Request failed (${res.status}). Please try again.`));
  }
  return data as OtpResponse;
}

async function postOtp(path: string, body: Record<string, string>): Promise<OtpResponse> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(
      "Could not connect to server. It may be waking up — please wait 30 seconds and try again."
    );
  }
  return handleOtpResponse(res);
}

/** Step 1 of signup — validates details and emails a 6-digit OTP (email is mandatory). */
export function requestSignupOtp(input: { username: string; email: string; password: string }) {
  return postOtp("/auth/request-signup-otp", input);
}

/** Step 2 of signup — verifies OTP and creates the account (returns AuthResponse). */
export async function verifySignupOtp(input: {
  username: string;
  email: string;
  password: string;
  otp: string;
}): Promise<AuthResponse> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/auth/verify-signup-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    throw new Error(
      "Could not connect to server. It may be waking up — please wait 30 seconds and try again."
    );
  }
  return handleAuthResponse(res);
}

/** Forgot password — sends a 6-digit reset OTP to the email. */
export function forgotPasswordRequest(email: string) {
  return postOtp("/auth/forgot-password", { email });
}

/** Reset password with the OTP from email. */
export async function resetPasswordRequest(input: {
  email: string;
  otp: string;
  new_password: string;
}): Promise<{ success: boolean; message: string }> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
    throw new Error(extractDetail(data, `Request failed (${res.status}). Please try again.`));
  }
  return data as { success: boolean; message: string };
}
