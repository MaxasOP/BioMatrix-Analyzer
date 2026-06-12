"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import type { Session } from "@supabase/supabase-js";

const supabase = createBrowserSupabaseClient();

const cards = [
  {
    href: "/analyze",
    title: "Analyze",
    description: "Paste DNA/RNA, compare sequences, and get AI interpretation.",
  },
  {
    href: "/generator",
    title: "Generate",
    description: "Create test inputs and open them directly in the analyzer.",
  },
  {
    href: "/history",
    title: "History",
    description: "Restore saved analyses from your cloud workspace.",
  },
  {
    href: "/profile",
    title: "Profile",
    description: "Sign in to save your research or access a saved one.",
  },
];

export default function HomeClient() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    void supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data } = supabase.auth.onAuthStateChange((_, nextSession) => {
      setSession(nextSession);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const accountLabel = session ? "Open profile" : "Set up cloud profile";

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <section className="grid gap-8 rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-[0_18px_60px_rgba(0,0,0,0.12)] backdrop-blur-xl lg:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-6">
          <div>
            <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-6xl">
              Get your samples analyzed in seconds 
            </h1>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/analyze"
              id="btn-home-open-analyzer"
              className="inline-flex items-center justify-center rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_10px_26px_rgba(6,182,212,0.22)] transition duration-200 hover:-translate-y-0.5 hover:bg-cyan-400 active:translate-y-0.5 cursor-pointer"
            >
              Open analyzer
            </Link>
            <Link
              href="/profile"
              id="btn-home-cloud-profile"
              className="inline-flex items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--border-subtle)_90%,white)] bg-[color-mix(in_srgb,var(--surface)_92%,white)] px-5 py-3 text-sm font-semibold text-[var(--ink)] shadow-[0_10px_24px_rgba(0,0,0,0.12)] transition duration-200 hover:-translate-y-0.5 hover:bg-[var(--surface)] active:translate-y-0.5 cursor-pointer"
            >
              {accountLabel}
            </Link>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              id={`card-link-${card.title.toLowerCase()}`}
              className="group rounded-3xl border border-[color-mix(in_srgb,var(--border-subtle)_88%,white)] bg-[color-mix(in_srgb,var(--surface)_88%,white)] p-5 shadow-[0_12px_28px_rgba(0,0,0,0.10)] transition duration-200 hover:-translate-y-1 hover:border-[color-mix(in_srgb,var(--accent)_42%,white)] hover:bg-[var(--surface)] active:translate-y-0.5 cursor-pointer"
            >
              <h2 className="text-lg font-semibold text-[var(--ink)]">{card.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)] transition group-hover:text-[var(--ink)]">
                {card.description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
