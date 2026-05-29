"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type ThemeMode = "dark" | "light";

const links = [
  { href: "/", label: "Overview" },
  { href: "/analyze", label: "Analyze" },
  { href: "/generator", label: "Generate" },
  { href: "/history", label: "History" },
  { href: "/profile", label: "Profile" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [theme, setTheme] = useState<ThemeMode>("dark");

  useEffect(() => {
    try {
      const savedTheme = window.localStorage.getItem("bio-matrix-theme");
      const preferredTheme =
        savedTheme === "light" || savedTheme === "dark"
          ? savedTheme
          : window.matchMedia?.("(prefers-color-scheme: light)").matches
            ? "light"
            : "dark";
      setTheme(preferredTheme);
      document.documentElement.dataset.theme = preferredTheme;
      document.documentElement.style.colorScheme = preferredTheme;
    } catch {
      setTheme("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme: ThemeMode = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;

    try {
      window.localStorage.setItem("bio-matrix-theme", nextTheme);
    } catch {
      // Ignore storage issues.
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[color-mix(in_srgb,var(--paper)_78%,transparent)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300">
            <svg viewBox="0 0 64 64" className="h-6 w-6" fill="none" aria-hidden="true">
              <path d="M18 14c8 0 12 6 12 18s-4 18-12 18" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              <path d="M46 14c-8 0-12 6-12 18s4 18 12 18" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </span>
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">BioMatrix AI</p>
            <p className="text-sm text-[var(--ink-soft)]">Sequence intelligence platform</p>
          </div>
        </Link>

        <nav className="flex flex-wrap items-center justify-end gap-2 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-full border px-4 py-2 transition ${
                pathname === link.href
                  ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-200"
                  : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-slate-200 transition hover:bg-white/10"
          >
            {theme === "dark" ? "Light" : "Dark"}
          </button>
        </nav>
      </div>
    </header>
  );
}