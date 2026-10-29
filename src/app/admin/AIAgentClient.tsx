"use client";

import { useState, useEffect } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";

export default function AIAgentClient() {
  const supabase = createBrowserSupabaseClient();
  const [prompt, setPrompt] = useState("");
  const [sql, setSql] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      const email = data?.user?.email ?? "";
      const adminList = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "").split(",").map(e => e.trim().toLowerCase());
      setIsAdmin(adminList.includes(email.toLowerCase()));
    });
  }, [supabase]);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSql(null);
    setResult(null);
    try {
      const resp = await fetch("/api/ai-sql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setError(data.error ?? "Unknown error");
      } else {
        setSql(data.sql);
        setResult(data.result);
      }
    } catch (e: any) {
      setError(e.message ?? "Network error");
    } finally {
      setLoading(false);
    }
  };

if (isAdmin === null) {
    return (
      <main className="mx-auto max-w-7xl border-x border-[var(--border-subtle)] px-6 py-12">
        <section className="border border-[var(--border-subtle)] bg-[var(--surface)] p-8">
          <p className="font-mono text-xs uppercase tracking-wider text-[var(--ink-soft)]">Checking administrative access…</p>
        </section>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-7xl border-x border-[var(--border-subtle)] px-6 py-12">
        <section className="border border-[var(--border-subtle)] bg-[var(--surface)] p-8">
          <p className="font-mono text-xs uppercase tracking-wider text-red-300">Access denied</p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-200">Administrative query console</h2>
          <p className="mt-4 text-slate-300">This account is not included in the administrative access list.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl border-x border-[var(--border-subtle)] px-4 py-6 sm:px-6">
      <header className="mb-6 flex flex-col gap-4 border-b border-[var(--border-subtle)] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="lab-kicker">System / administration</p><h1 className="mt-3 text-3xl font-semibold tracking-[-.04em] sm:text-5xl">Data query console</h1></div>
        <p className="max-w-md text-sm leading-6 text-[var(--ink-soft)]">Translate a plain-language archive question into a read-only database query.</p>
      </header>
      <section className="grid border border-[var(--border-subtle)] lg:grid-cols-[.46fr_.54fr]">
        <div className="border-b border-[var(--border-subtle)] bg-[var(--surface)] p-5 lg:border-b-0 lg:border-r sm:p-6">
        <h2 className="font-mono text-xs uppercase tracking-wider text-[var(--ink-soft)]">Query request</h2>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <textarea
            className="mt-4 border border-[var(--border-subtle)] bg-[var(--surface)] p-4 text-[var(--ink)] placeholder:text-[var(--ink-soft)] focus:border-[var(--accent)] outline-none"
            rows={4}
            placeholder="e.g. Show the last 10 DNA analyses with GC% > 60"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            className="self-start bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--accent-contrast)] hover:bg-[var(--accent-strong)] disabled:opacity-70"
            disabled={loading || !prompt.trim()}
          >
            {loading ? "Generating…" : "Run query"}
          </button>
        </form>
        {error && (
          <p className="mt-4 text-red-400">Error: {error}</p>
        )}
        </div>
        <div className="p-5 sm:p-6">
        <h2 className="font-mono text-xs uppercase tracking-wider text-[var(--ink-soft)]">Read-only output</h2>
        {sql && (
          <div className="mt-5">
            <h3 className="font-mono text-[10px] uppercase tracking-wider text-[var(--accent)]">Generated SQL</h3>
            <pre className="mt-2 border border-[var(--border-subtle)] bg-[var(--surface)] p-4 font-mono text-sm text-[var(--ink)] overflow-x-auto">{sql}</pre>
          </div>
        )}
        {result && (
          <div className="mt-6">
            <h3 className="font-mono text-[10px] uppercase tracking-wider text-[var(--accent)]">Result</h3>
            <pre className="mt-2 border border-[var(--border-subtle)] bg-[var(--surface)] p-4 font-mono text-sm text-[var(--ink)] overflow-x-auto">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
        {!sql && !result && <p className="mt-5 text-sm text-[var(--ink-soft)]">Query output will appear here.</p>}
        </div>
      </section>
    </main>
  );
}
