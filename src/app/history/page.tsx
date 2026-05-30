"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { getAuthRedirectUrl } from "@/lib/auth-redirect";
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
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

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

  const signIn = async () => {
    if (!supabase) {
      setNotice("Supabase is not configured.");
      return;
    }

    if (!email.trim()) {
      setNotice("Enter an email to receive a sign-in link.");
      return;
    }

    setBusy(true);
    try {
      const emailRedirectTo = getAuthRedirectUrl("/history");
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: emailRedirectTo ? { emailRedirectTo } : undefined,
      });
      if (error) throw error;
      setNotice("Sign-in link sent. Check your inbox.");
      setEmail("");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <section className="grid gap-6 rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-[0_18px_60px_rgba(0,0,0,0.12)] backdrop-blur-xl">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">History</p>
          <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">Cloud history</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--ink-soft)]">
            You can view and access your saved analyses here. 
          </p>
        </div>

        {session ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-slate-200">
            Signed in as {session.user.email ?? "user"}
          </div>
        ) : (
          <div className="grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-5 sm:grid-cols-[1fr_auto]">
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
              onClick={signIn}
              disabled={busy}
            >
              Send sign-in link
            </button>
          </div>
        )}

        {notice && <p className="text-sm text-[var(--ink-soft)]">{notice}</p>}

        {history.length === 0 ? (
          <p className="text-sm text-[var(--ink-soft)]">No saved analyses yet.</p>
        ) : (
          <div className="grid gap-3">
            {history.map((item) => (
              <div key={item.id ?? item.sequence_preview} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-100">
                      {item.payload.analysis.sequenceType} · {item.payload.analysis.length} bases · GC {item.payload.analysis.gcPercentage.toFixed(1)}%
                    </p>
                    <p className="text-xs text-slate-400">
                      {item.created_at ? new Date(item.created_at).toLocaleString() : "Local"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/analyze?sequence=${encodeURIComponent(item.payload.analysis.sequence)}${item.payload.compareSequence ? `&compare=${encodeURIComponent(item.payload.compareSequence)}` : ""}`}
                      className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-400/20"
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
                  </div>
                </div>
                <p className="mt-3 font-mono text-xs text-slate-300">{item.sequence_preview}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Link href="/profile" className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10">
            Open profile
          </Link>
          <Link href="/" className="rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
            Back to overview
          </Link>
        </div>
      </section>
    </main>
  );
}