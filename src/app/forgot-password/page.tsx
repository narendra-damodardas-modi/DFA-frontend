"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { forgotPasswordRequest, resetPasswordRequest } from "@/lib/auth";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [step, setStep] = useState<"email" | "reset">("email");
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    setInfo(null);
    const em = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      setError("Please enter your registered email address.");
      return;
    }
    setLoading(true);
    try {
      const res = await forgotPasswordRequest(em);
      setStep("reset");
      setInfo(
        res.dev_otp
          ? `${res.message} Test code: ${res.dev_otp}`
          : res.message || "OTP sent. Check your inbox and spam."
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not send OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const reset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (otp.trim().length < 4) {
      setError("Please enter the 6-digit code from your email.");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirm) {
      setError("Passwords do not match. Please type them again.");
      return;
    }
    setLoading(true);
    try {
      const res = await resetPasswordRequest({
        email: email.trim(),
        otp: otp.trim(),
        new_password: newPassword,
      });
      setInfo(`${res.message} Redirecting to login…`);
      setTimeout(() => router.replace("/login"), 1500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Reset failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full rounded-2xl border border-slate-200 bg-slate-50/60 py-3.5 pl-11 pr-4 text-[15px] text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100";

  return (
    <div className="min-h-screen bg-[#f6f7fb]">
      <div className="relative overflow-hidden">
        <div className="dot-grid pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[42rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-200/60 via-violet-200/50 to-amber-100/60 blur-3xl" />
        <main className="relative mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-10">
          <div className="mb-6 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md">
              <ShieldCheck size={24} />
            </span>
            <h1 className="mt-4 text-[26px] font-black tracking-tight text-slate-900">
              Forgot password?
            </h1>
            <p className="mt-1 text-[14px] text-slate-500">
              {step === "email"
                ? "Enter your email — we will send a reset code."
                : `Code sent to ${email.trim()}. Enter it + new password.`}
            </p>
          </div>

          <section className="rounded-[28px] border border-white/60 bg-white p-6 shadow-[0_20px_60px_-20px_rgba(79,70,229,0.25)] sm:p-7">
            {step === "email" ? (
              <form onSubmit={sendOtp} className="space-y-4" noValidate>
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-[14px] font-semibold text-slate-800"
                  >
                    Registered email
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <Mail size={18} />
                    </span>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@gmail.com"
                      value={email}
                      disabled={loading}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>

                {info && (
                  <p className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-[13.5px] font-medium leading-snug text-green-700">
                    {info}
                  </p>
                )}
                {error && (
                  <p
                    role="alert"
                    className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13.5px] font-medium leading-snug text-red-700"
                  >
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-indigo-600 to-indigo-700 px-6 py-4 text-[16px] font-bold text-white shadow-[0_12px_30px_-8px_rgba(79,70,229,0.6)] transition hover:from-indigo-500 hover:to-indigo-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Sending code…
                    </>
                  ) : (
                    <>
                      <Mail size={19} />
                      Send reset code
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={reset} className="space-y-4" noValidate>
                <div>
                  <label
                    htmlFor="otp"
                    className="mb-1.5 block text-[14px] font-semibold text-slate-800"
                  >
                    Reset code
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <KeyRound size={18} />
                    </span>
                    <input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="6-digit code"
                      maxLength={10}
                      value={otp}
                      disabled={loading}
                      onChange={(e) =>
                        setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      className={`${inputCls} tracking-[0.4em] text-center font-bold`}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="newPassword"
                    className="mb-1.5 block text-[14px] font-semibold text-slate-800"
                  >
                    New password
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <Lock size={18} />
                    </span>
                    <input
                      id="newPassword"
                      type="password"
                      autoComplete="new-password"
                      placeholder="Minimum 6 characters"
                      value={newPassword}
                      disabled={loading}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirm"
                    className="mb-1.5 block text-[14px] font-semibold text-slate-800"
                  >
                    Confirm new password
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <Lock size={18} />
                    </span>
                    <input
                      id="confirm"
                      type="password"
                      autoComplete="new-password"
                      placeholder="Type password again"
                      value={confirm}
                      disabled={loading}
                      onChange={(e) => setConfirm(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>

                {info && (
                  <p className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-[13.5px] font-medium leading-snug text-green-700">
                    {info}
                  </p>
                )}
                {error && (
                  <p
                    role="alert"
                    className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13.5px] font-medium leading-snug text-red-700"
                  >
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-indigo-600 to-indigo-700 px-6 py-4 text-[16px] font-bold text-white shadow-[0_12px_30px_-8px_rgba(79,70,229,0.6)] transition hover:from-indigo-500 hover:to-indigo-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Resetting…
                    </>
                  ) : (
                    <>
                      <Lock size={19} />
                      Reset password
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-[13.5px]">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      setStep("email");
                      setError(null);
                      setInfo(null);
                    }}
                    className="font-bold text-slate-500 hover:underline disabled:opacity-50"
                  >
                    ← Change email
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => sendOtp()}
                    className="font-bold text-indigo-600 hover:underline disabled:opacity-50"
                  >
                    Resend code
                  </button>
                </div>
              </form>
            )}

            <p className="mt-5 text-center text-[13.5px] text-slate-500">
              Remember it?{" "}
              <Link
                href="/login"
                className="font-bold text-indigo-600 hover:underline"
              >
                Log in
              </Link>
            </p>
          </section>

          <p className="mt-6 text-center text-[12.5px] font-bold text-slate-500">
            Public data only • Built for India 🇮🇳
          </p>
        </main>
      </div>
    </div>
  );
}
