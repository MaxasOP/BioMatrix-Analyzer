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
      <main className="mx-auto max-w-4xl px-6 py-12">
        <section className="rounded-[32px] bg-white/5 border border-white/10 p-8 shadow-[0_18px_60px_rgba(0,0,0,0.12)] backdrop-blur-xl">
          <p className="text-slate-300">Checking admin permissions…</p>
        </section>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12">
        <section className="rounded-[32px] bg-white/5 border border-white/10 p-8 shadow-[0_18px_60px_rgba(0,0,0,0.12)] backdrop-blur-xl">
          <h2 className="text-xl font-semibold text-slate-200">Access Denied</h2>
          <p className="mt-4 text-slate-300">You do not have permission to use the AI‑SQL admin dashboard.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <section className="rounded-[32px] bg-white/5 border border-white/10 p-8 shadow-[0_18px_60px_rgba(0,0,0,0.12)] backdrop-blur-xl">
        <h1 className="text-3xl font-semibold mb-4 text-slate-100">AI‑SQL Agent</h1>
        <p className="mb-6 text-slate-300">Ask natural‑language questions about your analysis data; the AI generates a safe SELECT statement and returns matching rows.</p>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <textarea
            className="rounded-xl border border-white/10 bg-slate-950/60 p-4 text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 outline-none transition"
            rows={4}
            placeholder="e.g. Show the last 10 DNA analyses with GC% > 60"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            className="self-start rounded-full bg-cyan-500 px-6 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-70"
            disabled={loading || !prompt.trim()}
          >
            {loading ? "Generating…" : "Run query"}
          </button>
        </form>
        {error && (
          <p className="mt-4 text-red-400">Error: {error}</p>
        )}
        {sql && (
          <div className="mt-6">
            <h2 className="text-xl font-medium text-slate-200">Generated SQL</h2>
            <pre className="mt-2 rounded-md bg-slate-900/70 p-4 text-sm text-slate-100 overflow-x-auto">{sql}</pre>
          </div>
        )}
        {result && (
          <div className="mt-6">
            <h2 className="text-xl font-medium text-slate-200">Result</h2>
            <pre className="mt-2 rounded-md bg-slate-900/70 p-4 text-sm text-slate-100 overflow-x-auto">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </section>
    </main>
  );
}
