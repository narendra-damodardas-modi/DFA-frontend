"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  AtSign,
  Globe2,
  LayoutDashboard,
  Lock,
  Mail,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  User,
  Zap,
} from "lucide-react";
import { getToken } from "@/lib/auth";

const THINGS = [
  {
    icon: <User size={18} />,
    title: "Search by name",
    text: "Type a full name and see public profiles and mentions.",
  },
  {
    icon: <Phone size={18} />,
    title: "Search by phone",
    text: "Enter a 10-digit mobile number to find public listings.",
  },
  {
    icon: <AtSign size={18} />,
    title: "Search by username",
    text: "Find Instagram, X, Facebook and other public handles.",
  },
  {
    icon: <Mail size={18} />,
    title: "Search by email",
    text: "Check where an email address appears on public sites.",
  },
  {
    icon: <MapPin size={18} />,
    title: "Add a city",
    text: "Add a city to get better, more correct results.",
  },
  {
    icon: <LayoutDashboard size={18} />,
    title: "Results in simple cards",
    text: "Results are grouped by website, with an Open link button.",
  },
];

export default function LandingPage() {
  // Lazy init from localStorage — avoids a sync setState inside an effect.
  const [loggedIn] = useState<boolean>(() => getToken() !== null);

  return (
    <div className="min-h-screen bg-[#f6f7fb]">
      {/* ---------- Header ---------- */}
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md">
            <ShieldCheck size={21} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-extrabold leading-tight text-slate-900">
              Digital Footprint Finder
            </p>
            <p className="text-[12px] font-medium text-slate-500">
              Made for India 🇮🇳 • Free to use
            </p>
          </div>
          {loggedIn ? (
            <Link
              href="/dashboard"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-[12.5px] font-bold text-white transition hover:bg-indigo-700"
            >
              <LayoutDashboard size={14} /> Dashboard
            </Link>
          ) : (
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href="/login"
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[12.5px] font-bold text-slate-600 transition hover:bg-slate-50"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-slate-900 px-4 py-2 text-[12.5px] font-bold text-white transition hover:bg-indigo-700"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </header>

      <div className="relative overflow-hidden">
        <div className="dot-grid pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[42rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-200/60 via-violet-200/50 to-amber-100/60 blur-3xl" />
        <main className="relative mx-auto max-w-2xl px-4 pb-14 pt-8 sm:pt-10">
          {/* ---------- Hero ---------- */}
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200/80 bg-white px-3.5 py-1.5 text-[12px] font-bold text-indigo-700 shadow-sm">
              <Sparkles size={13} /> 100% public data • Safe &amp; private
            </span>
            <h1 className="mx-auto mt-4 max-w-md text-[30px] font-black leading-[1.15] tracking-tight text-slate-900 sm:text-[38px]">
              See what the internet knows{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                about you
              </span>
            </h1>
            <p className="mx-auto mt-2.5 max-w-md text-[14.5px] leading-relaxed text-slate-600">
              Type your name, phone number, or username. We&apos;ll show your
              public photos, profiles &amp; mentions — in simple words.
            </p>
            <div className="mt-5 flex flex-col justify-center gap-2.5 sm:flex-row">
              {loggedIn ? (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-indigo-600 to-indigo-700 px-6 py-3.5 text-[15.5px] font-bold text-white shadow-[0_12px_30px_-8px_rgba(79,70,229,0.6)] transition hover:from-indigo-500 hover:to-indigo-700"
                >
                  <LayoutDashboard size={18} /> Open my dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/signup"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-indigo-600 to-indigo-700 px-6 py-3.5 text-[15.5px] font-bold text-white shadow-[0_12px_30px_-8px_rgba(79,70,229,0.6)] transition hover:from-indigo-500 hover:to-indigo-700"
                  >
                    Get started — it&apos;s free <ArrowRight size={18} />
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-[15.5px] font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    I already have an account
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Trust row */}
          <div className="mt-6 grid grid-cols-3 gap-2">
            {[
              { icon: <Lock size={15} />, t: "Private", s: "We never save details" },
              { icon: <Globe2 size={15} />, t: "Public only", s: "No private data" },
              { icon: <Zap size={15} />, t: "Fast", s: "Results in seconds" },
            ].map((c) => (
              <div
                key={c.t}
                className="rounded-2xl border border-white/70 bg-white/80 px-2 py-3 text-center shadow-sm backdrop-blur"
              >
                <span className="mx-auto mb-1.5 flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  {c.icon}
                </span>
                <p className="text-[12.5px] font-bold text-slate-800">{c.t}</p>
                <p className="text-[11px] text-slate-500">{c.s}</p>
              </div>
            ))}
          </div>

          {/* ---------- Things you can do ---------- */}
          <section className="mt-6 rounded-[28px] border border-white/60 bg-white p-5 shadow-[0_20px_60px_-20px_rgba(79,70,229,0.25)] sm:p-7">
            <h2 className="flex items-center gap-2 text-[17px] font-bold text-slate-900">
              <Search size={18} className="text-indigo-600" />
              Things you can do here
            </h2>
            <p className="mt-1 text-[13.5px] text-slate-500">
              One free account gives you all of these:
            </p>
            <ul className="mt-4 space-y-3">
              {THINGS.map((item) => (
                <li
                  key={item.title}
                  className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                    {item.icon}
                  </span>
                  <div>
                    <p className="text-[14px] font-bold text-slate-800">
                      {item.title}
                    </p>
                    <p className="text-[13px] leading-snug text-slate-500">
                      {item.text}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <Link
              href={loggedIn ? "/dashboard" : "/signup"}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-indigo-600 to-indigo-700 px-6 py-4 text-[16px] font-bold text-white shadow-[0_12px_30px_-8px_rgba(79,70,229,0.6)] transition hover:from-indigo-500 hover:to-indigo-700"
            >
              {loggedIn ? (
                <>
                  <LayoutDashboard size={19} /> Go to dashboard
                </>
              ) : (
                <>
                  Try it now — free <ArrowRight size={19} />
                </>
              )}
            </Link>
            {!loggedIn && (
              <p className="mt-3 text-center text-[13px] text-slate-500">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-bold text-indigo-600 hover:underline"
                >
                  Log in
                </Link>
              </p>
            )}
          </section>

          {/* ---------- How it works ---------- */}
          <section className="mt-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
            <h2 className="text-[16px] font-extrabold text-slate-900">
              How does this work? 🤔
            </h2>
            <ol className="mt-3 space-y-3">
              {[
                ["1", "Create a free account", "Sign up with a username, email and password."],
                ["2", "Type any detail", "Name, mobile number, username or email — even one is enough."],
                ["3", "See simple cards", "Each card shows where it was found + a button to open it."],
              ].map(([n, t, s]) => (
                <li key={n} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[13px] font-extrabold text-indigo-700">
                    {n}
                  </span>
                  <div>
                    <p className="text-[14px] font-bold text-slate-800">{t}</p>
                    <p className="text-[13px] text-slate-500">{s}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

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
    </div>
  );
}
