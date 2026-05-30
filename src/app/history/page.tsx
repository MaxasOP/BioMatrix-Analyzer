"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import type { Session } from "@supabase/supabase-js";

type HistoryPayload = {
  analysis: {
    sequenceType: string;
    length: number;
    gcPercentage: number;
    sequence: string;
  };
  compareSequence?: string | null;
};

type HistoryItem = {
  id?: string;
  created_at?: string;
  sequence_preview: string;
  payload: HistoryPayload;
};

const supabase = createBrowserSupabaseClient();

export default function HistoryPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<HistoryItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadHistory = useCallback(async (currentSession?: Session | null) => {
    if (!supabase || !currentSession) {
      setHistory([]);
      return;
    }

    const response = await fetch("/api/history", {
      headers: { Authorization: `Bearer ${currentSession.access_token}` },
    });

    if (!response.ok) {
      // try to surface server error body to the browser console to aid debugging
      const text = await response.text().catch(() => null);
      console.error("/api/history failed", response.status, text);
      throw new Error(text || "History unavailable");
    }

    const data = (await response.json()) as { items?: HistoryItem[] };
    setHistory(Array.isArray(data.items) ? data.items : []);
  }, []);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      void loadHistory(data.session);
    });

    const { data } = supabase.auth.onAuthStateChange((_, nextSession) => {
      setSession(nextSession);
      void loadHistory(nextSession);
    });

    return () => data.subscription.unsubscribe();
  }, [loadHistory]);

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
      setNotice(error instanceof Error ? error.message : "Could not sign in.");
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
      setNotice("Enter the email address that received the code.");
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

  const openDeleteDialog = (item: HistoryItem) => {
    setNotice(null);
    setDeleteTarget(item);
  };

  const closeDeleteDialog = () => {
    if (deleting) {
      return;
    }
    setDeleteTarget(null);
  };

  const deleteHistoryItem = async () => {
    if (!supabase) {
      setNotice("Supabase is not configured.");
      return;
    }

    if (!session?.access_token) {
      setNotice("Sign in to delete cloud history.");
      return;
    }

    if (!deleteTarget?.id) {
      setNotice("This saved item cannot be deleted because it has no id.");
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch("/api/history", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ id: deleteTarget.id }),
      });

      const responseBody = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(responseBody?.error ?? "Delete failed");
      }

      setHistory((current) => current.filter((item) => item.id !== deleteTarget.id));
      setNotice("Saved analysis deleted.");
      setDeleteTarget(null);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Delete failed.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <section className="grid gap-6 rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.12)] backdrop-blur-xl sm:rounded-[32px] sm:p-8">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">History</p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-5xl">Cloud history</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--ink-soft)] sm:text-base">
            You can view and access your saved analyses here. 
          </p>
        </div>

        {session ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-slate-200">
            Signed in as {session.user.email ?? "user"}
          </div>
        ) : (
          <div className="grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-5">
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <input
                className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-400"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <button
                type="button"
                className="rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-70"
                onClick={sendOtp}
                disabled={busy}
              >
                Send code
              </button>
            </div>

            {otpSent && (
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <input
                  className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-400"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="Enter the 6-digit code"
                  value={otpCode}
                  onChange={(event) => setOtpCode(event.target.value)}
                />
                <button
                  type="button"
                  className="rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-70"
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

        {history.length === 0 ? (
          <p className="text-sm text-[var(--ink-soft)]">No saved analyses yet.</p>
        ) : (
          <div className="grid gap-3">
            {history.map((item) => (
              <div key={item.id ?? item.sequence_preview} className="rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-100">
                      {item.payload.analysis.sequenceType} · {item.payload.analysis.length} bases · GC {item.payload.analysis.gcPercentage.toFixed(1)}%
                    </p>
                    <p className="text-xs text-slate-400">
                      {item.created_at ? new Date(item.created_at).toLocaleString() : "Local"}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-3 sm:flex sm:flex-wrap sm:justify-end">
                    <Link
                      href={`/analyze?sequence=${encodeURIComponent(item.payload.analysis.sequence)}${item.payload.compareSequence ? `&compare=${encodeURIComponent(item.payload.compareSequence)}` : ""}`}
                      className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-center text-xs font-semibold text-cyan-200 transition hover:bg-cyan-400/20"
                    >
                      Restore in analyzer
                    </Link>
                    <button
                      type="button"
                      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
                      onClick={async () => {
                        await navigator.clipboard.writeText(item.payload.analysis.sequence);
                        setNotice("Sequence copied to clipboard.");
                      }}
                    >
                      Copy
                    </button>
                    {item.id ? (
                      <button
                        type="button"
                        className="rounded-full border border-red-400/30 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-200 transition hover:bg-red-500/20"
                        onClick={() => openDeleteDialog(item)}
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>
                </div>
                <p className="mt-3 break-all font-mono text-[11px] leading-5 text-slate-300 sm:text-xs">
                  {item.sequence_preview}
                </p>
              </div>
            ))}
          </div>
        )}

        {deleteTarget && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-history-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-6 backdrop-blur-sm"
            onClick={closeDeleteDialog}
          >
            <div
              className="w-full max-w-lg rounded-[28px] border border-white/10 bg-[var(--paper)] p-5 text-[var(--ink)] shadow-[0_24px_80px_rgba(0,0,0,0.4)] sm:p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <p className="text-xs uppercase tracking-[0.35em] text-red-400">Delete saved analysis</p>
              <h2 id="delete-history-title" className="mt-3 text-2xl font-semibold">
                Remove this item from cloud history?
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">
                This action permanently deletes the saved analysis from your cloud history. You can still keep the local sequence if you have it copied elsewhere.
              </p>
              <div className="mt-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-4 text-sm text-[var(--ink)]">
                <p className="font-semibold">
                  {deleteTarget.payload.analysis.sequenceType} · {deleteTarget.payload.analysis.length} bases · GC {deleteTarget.payload.analysis.gcPercentage.toFixed(1)}%
                </p>
                <p className="mt-1 font-mono text-xs text-[var(--ink-soft)]">{deleteTarget.sequence_preview}</p>
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
                <button
                  type="button"
                  className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface)] px-5 py-3 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--surface-soft)]"
                  onClick={closeDeleteDialog}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="rounded-full bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-70"
                  onClick={deleteHistoryItem}
                  disabled={deleting}
                >
                  {deleting ? "Deleting..." : "Delete permanently"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link href="/profile" className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-center text-sm font-semibold text-slate-100 transition hover:bg-white/10">
            Open profile
          </Link>
          <Link href="/" className="rounded-full bg-cyan-500 px-5 py-3 text-center text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
            Back to overview
          </Link>
        </div>
      </section>
    </main>
  );
}