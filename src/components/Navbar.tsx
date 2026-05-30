"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Overview" },
  { href: "/analyze", label: "Analyze" },
  { href: "/generator", label: "Generate" },
  { href: "/history", label: "History" },
  { href: "/profile", label: "Profile" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // close mobile menu when navigation changes
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--paper)_82%,transparent)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300">
            <svg viewBox="0 0 64 64" className="h-6 w-6" fill="none" aria-hidden="true">
              <path d="M18 14c8 0 12 6 12 18s-4 18-12 18" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              <path d="M46 14c-8 0-12 6-12 18s4 18 12 18" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </span>
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">BioMatrix.AI</p>
            <p className="text-sm text-[var(--ink-soft)]">Quick Analyses</p>
          </div>
        </Link>

        <nav className="flex items-center gap-2 text-sm">
          {/* Desktop links */}
          <div className="hidden md:flex flex-wrap items-center justify-end gap-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full border px-4 py-2 transition ${
                  pathname === link.href
                    ? "border-[color-mix(in_srgb,var(--accent)_48%,transparent)] bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-[var(--ink)]"
                    : "border-[var(--border-subtle)] bg-[var(--surface-soft)] text-[var(--ink)] hover:bg-[color-mix(in_srgb,var(--surface-soft)_68%,var(--accent)_32%)]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden relative">
            <button
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((s) => !s)}
              className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-soft)] p-2 text-[var(--ink)]"
            >
              {menuOpen ? (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-soft)] p-2 shadow-lg z-50">
                <div className="flex flex-col gap-2">
                  {links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className={`block rounded-md px-3 py-2 text-sm transition ${
                        pathname === link.href
                          ? "bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-[var(--ink)]"
                          : "text-[var(--ink)] hover:bg-[color-mix(in_srgb,var(--surface-soft)_68%,var(--accent)_32%)]"
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}