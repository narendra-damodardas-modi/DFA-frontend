"use client";

import { AtSign, Loader2, Mail, MapPin, Phone, Search, User } from "lucide-react";
import type { SearchFormValues } from "@/lib/api";

interface Props {
  values: SearchFormValues;
  onChange: (patch: Partial<SearchFormValues>) => void;
  onSubmit: () => void;
  onFillExample: () => void;
  onClear: () => void;
  loading: boolean;
  formError: string | null;
}

function Field({
  id,
  label,
  hint,
  optional,
  icon,
  children,
}: {
  id: string;
  label: string;
  hint: string;
  optional?: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 flex items-center justify-between text-[14px] font-semibold text-slate-800"
      >
        <span>{label}</span>
        {optional && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
            Optional
          </span>
        )}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </span>
        {children}
      </div>
      <p className="mt-1 text-[12.5px] leading-snug text-slate-500">{hint}</p>
    </div>
  );
}

const inputCls =
  "w-full rounded-2xl border border-slate-200 bg-slate-50/60 py-3.5 pl-11 pr-4 text-[15px] text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100";

export default function SearchForm({
  values,
  onChange,
  onSubmit,
  onFillExample,
  onClear,
  loading,
  formError,
}: Props) {
  return (
    <section
      aria-label="Search details"
      className="rounded-[28px] border border-white/60 bg-white p-5 shadow-[0_20px_60px_-20px_rgba(79,70,229,0.25)] sm:p-7"
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[17px] font-bold text-slate-900">
            Enter your details
          </h2>
          <p className="mt-0.5 text-[13.5px] text-slate-500">
            Fill <span className="font-semibold text-slate-700">at least 1 box</span>.
            More details = better results.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={onFillExample}
            disabled={loading}
            className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-[12.5px] font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-50"
          >
            Try example
          </button>
          <button
            type="button"
            onClick={onClear}
            disabled={loading}
            className="rounded-full border border-slate-200 px-3 py-1.5 text-[12.5px] font-semibold text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Clear
          </button>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="space-y-4"
        noValidate
      >
        <Field
          id="name"
          label="Full Name"
          hint="e.g. Rahul Sharma"
          icon={<User size={18} />}
        >
          <input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="Your full name"
            value={values.name}
            disabled={loading}
            onChange={(e) => onChange({ name: e.target.value })}
            className={inputCls}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            id="city"
            label="City"
            hint="e.g. Hyderabad"
            optional
            icon={<MapPin size={18} />}
          >
            <input
              id="city"
              type="text"
              autoComplete="address-level2"
              placeholder="Your city"
              value={values.city}
              disabled={loading}
              onChange={(e) => onChange({ city: e.target.value })}
              className={inputCls}
            />
          </Field>

          <Field
            id="phone"
            label="Phone Number"
            hint="10-digit mobile, e.g. 98765 43210"
            icon={<Phone size={18} />}
          >
            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="98765 43210"
              value={values.phone}
              disabled={loading}
              onChange={(e) => onChange({ phone: e.target.value })}
              className={inputCls}
            />
          </Field>
        </div>

        <Field
          id="username"
          label="Username"
          hint="Instagram / X / Facebook name, e.g. rahul.sharma"
          icon={<AtSign size={18} />}
        >
          <input
            id="username"
            type="text"
            autoComplete="username"
            placeholder="@username"
            value={values.username}
            disabled={loading}
            onChange={(e) => onChange({ username: e.target.value })}
            className={inputCls}
          />
        </Field>

        <Field
          id="email"
          label="Email"
          hint="e.g. rahul@gmail.com"
          icon={<Mail size={18} />}
        >
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@gmail.com"
            value={values.email}
            disabled={loading}
            onChange={(e) => onChange({ email: e.target.value })}
            className={inputCls}
          />
        </Field>

        {formError && (
          <p
            role="alert"
            className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13.5px] font-medium leading-snug text-amber-800"
          >
            {formError}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="group flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-b from-indigo-600 to-indigo-700 px-6 py-4 text-[16.5px] font-bold text-white shadow-[0_12px_30px_-8px_rgba(79,70,229,0.6)] transition hover:from-indigo-500 hover:to-indigo-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 disabled:shadow-none"
        >
          {loading ? (
            <>
              <Loader2 size={21} className="animate-spin" />
              Searching… please wait
            </>
          ) : (
            <>
              <Search
                size={20}
                className="transition-transform group-hover:scale-110"
              />
              Search Digital Footprint
            </>
          )}
        </button>
        <p className="text-center text-[12.5px] text-slate-400">
          🔒 We never save your details. Search is private to your phone.
        </p>
      </form>
    </section>
  );
}
