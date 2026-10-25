"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import type { Session } from "@supabase/supabase-js";
const supabase = createBrowserSupabaseClient();
const bases = "ATGCGTACCTGAATCGGCTTAGCA".split("");
export default function HomeClient() {
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => { if (!supabase) return; void supabase.auth.getSession().then(({ data }) => setSession(data.session)); const { data } = supabase.auth.onAuthStateChange((_, next) => setSession(next)); return () => data.subscription.unsubscribe(); }, []);
  return <main>
    <section className="mx-auto grid max-w-7xl border-x border-[var(--border-subtle)] lg:grid-cols-[1.15fr_.85fr]">
      <div className="flex min-h-[510px] flex-col justify-between border-b border-[var(--border-subtle)] p-6 sm:p-10 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between font-mono text-[10px] tracking-[.14em] text-[var(--ink-soft)]"><span>SEQUENCE WORKSTATION / V1.0</span><span>DNA · RNA</span></div>
        <div className="py-16"><p className="lab-kicker">Analysis without the black box</p><h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-[.94] tracking-[-.055em] sm:text-7xl">Inspect the sequence.<br/><span className="text-[var(--ink-soft)]">Read the evidence.</span></h1><p className="mt-7 max-w-xl text-base leading-7 text-[var(--ink-soft)]">Calculate composition, translate codons, locate open reading frames and compare mutations from one focused workspace.</p></div>
        <div className="flex flex-wrap items-center gap-4"><Link href="/analyze" id="btn-home-open-analyzer" className="bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[#0b0e0d] hover:bg-[var(--accent-strong)]">Start an analysis →</Link><Link href="/generator" className="border-b border-[var(--ink-soft)] py-2 text-sm text-[var(--ink-soft)] hover:text-[var(--ink)]">Generate a test sequence</Link></div>
      </div>
      <div className="bg-[var(--surface)] p-6 sm:p-10"><div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4"><span className="lab-kicker">Example specimen</span><span className="font-mono text-[10px] text-[var(--ink-soft)]">BM–0248</span></div><div className="sequence-strip my-7 px-5 py-4" aria-label="Example DNA sequence">{bases.map((base, i) => <span key={i} className={`base-${base.toLowerCase()}`}>{base}</span>)}</div>
        <dl className="grid grid-cols-2 border-l border-t border-[var(--border-subtle)]">{[["Molecule","DNA"],["Length","248 bp"],["GC content","51.6%"],["Open frames","03"]].map(([term, value]) => <div key={term} className="border-b border-r border-[var(--border-subtle)] p-4"><dt className="font-mono text-[10px] uppercase tracking-wider text-[var(--ink-soft)]">{term}</dt><dd className="mt-2 text-2xl font-medium">{value}</dd></div>)}</dl>
        <div className="mt-7"><p className="font-mono text-[10px] uppercase tracking-wider text-[var(--ink-soft)]">Translation preview</p><p className="mt-3 break-all font-mono text-sm leading-7 text-[var(--ink)]">MET–ARG–THR–LEU–ASN–ARG–LEU–ALA</p></div>
      </div>
    </section>
    <section className="mx-auto grid max-w-7xl border-x border-b border-[var(--border-subtle)] md:grid-cols-3">{[
      ["01 / ANALYZE","Sequence → evidence","Base counts, GC content, transcription, translation, ORFs and restriction sites.","/analyze"],
      ["02 / COMPARE","Variation → mutation","Compare a reference and sample with substitutions, insertions and deletions made explicit.","/analyze"],
      ["03 / ARCHIVE","Result → record","Save authenticated runs and restore the complete analysis when you need it.",session ? "/history" : "/profile"],
    ].map(([label,title,copy,href]) => <Link href={href} key={label} className="group border-b border-[var(--border-subtle)] p-6 last:border-b-0 hover:bg-[var(--surface-soft)] md:border-b-0 md:border-r md:last:border-r-0 sm:p-8"><p className="font-mono text-[10px] text-[var(--accent)]">{label}</p><h2 className="mt-7 text-xl font-medium">{title}</h2><p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">{copy}</p><span className="mt-8 block text-sm group-hover:text-[var(--accent)]">Open module →</span></Link>)}</section>
  </main>;
}
