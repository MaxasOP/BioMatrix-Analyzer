"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import type { Session } from "@supabase/supabase-js";

const supabase = createBrowserSupabaseClient();

export default function ProfileClient() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    void supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_, nextSession) => setSession(nextSession));
    return () => data.subscription.unsubscribe();
  }, []);

  const sendOtp = async () => {
    if (!supabase) {
      setNotice("Supabase is not configured.");
      return;
    }

    if (!email.trim()) {
      setNotice("Enter an email to receive a sign-in code.");
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
      });
      if (error) throw error;
      setNotice("Verification code sent. Check your inbox.");
      setOtpSent(true);
      setOtpCode("");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not send sign-in code.");
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async () => {
    if (!supabase) {
      setNotice("Supabase is not configured.");
      return;
    }

    if (!email.trim()) {
      setNotice("Enter the email that received the code.");
      return;
    }

    if (!otpCode.trim()) {
      setNotice("Enter the verification code from your email.");
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otpCode.trim(),
        type: "email",
      });
      if (error) throw error;
      setNotice("Signed in successfully.");
      setOtpSent(false);
      setOtpCode("");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not verify code.");
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    if (!supabase) return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setSession(null);
      setNotice("Signed out.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not sign out.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <section className="grid gap-6 rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-[0_18px_60px_rgba(0,0,0,0.12)] backdrop-blur-xl">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">Profile</p>
          <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">User profile</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--ink-soft)]">
            Sign in to keep your analyses separate and save work to the cloud.
          </p>
        </div>

        {session ? (
          <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-slate-200">
              Signed in as {session.user.email ?? "user"}
            </p>
            <button
              type="button"
              id="btn-profile-sign-out"
              className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10 disabled:opacity-70 cursor-pointer"
              onClick={signOut}
              disabled={busy}
            >
              Sign out
            </button>
          </div>
        ) : (
          <div className="grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <input
                id="input-profile-email"
                className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-400"
                type="email"
                placeholder="john@example.com"
                aria-label="Email address"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <button
                type="button"
                id="btn-profile-send-code"
                className="rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-70 cursor-pointer"
                onClick={sendOtp}
                disabled={busy}
              >
                Send code
              </button>
            </div>

            {otpSent && (
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <input
                  id="input-profile-otp"
                  className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-400"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="Enter the 6-digit code"
                  aria-label="OTP verification code"
                  value={otpCode}
                  onChange={(event) => setOtpCode(event.target.value)}
                />
                <button
                  type="button"
                  id="btn-profile-verify-code"
                  className="rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-70 cursor-pointer"
                  onClick={verifyOtp}
                  disabled={busy}
                >
                  Verify code
                </button>
              </div>
            )}
          </div>
        )}

        {notice && <p className="text-sm text-[var(--ink-soft)]">{notice}</p>}

        <div className="grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
          <p>Cloud profile :</p>
          <p>• Saved analyses stay attached to your account.</p>
          <p>• History can be restored on another device.</p>
          <p>• Secure and reliable workspace.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/history"
            id="link-profile-view-history"
            className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
          >
            View history
          </Link>
          <Link
            href="/analyze"
            id="link-profile-open-analyzer"
            className="rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            Open analyzer
          </Link>
          // Admin Dashboard link (added per request)
          <Link
            href="/admin"
            id="link-profile-admin-dashboard"
            className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
          >
            Admin Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
