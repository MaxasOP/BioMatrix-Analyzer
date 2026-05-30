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
            <svg viewBox="0 0 1024 1024" className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="BioMatrix logo">
              <path d="M515.2 200c70.4-28.8 129.6-33.6 211.2-8 60.8 19.2 91.2 44.8 120 97.6 6.4 11.2 30.4 59.2 33.6 67.2 28.8 57.6 24 100.8-3.2 169.6-12.8 32-14.4 35.2-17.6 46.4-14.4 52.8-67.2 99.2-120 124.8-4.8 3.2-9.6 4.8-17.6 9.6-3.2 1.6-3.2 1.6-4.8 3.2-35.2 17.6-56 25.6-89.6 27.2-64 4.8-216-80-256-153.6-40-75.2-33.6-225.6 8-273.6 36.8-48 88-91.2 136-110.4z m11.2 30.4c-41.6 17.6-89.6 56-126.4 100.8-32 36.8-38.4 174.4-3.2 238.4 33.6 62.4 172.8 140.8 225.6 136 28.8-1.6 46.4-8 78.4-24 3.2-1.6 3.2-1.6 4.8-3.2 8-4.8 12.8-6.4 19.2-9.6 46.4-20.8 92.8-62.4 104-104 3.2-12.8 4.8-17.6 19.2-51.2 25.6-60.8 28.8-96 4.8-142.4-4.8-9.6-27.2-56-33.6-67.2-25.6-46.4-48-65.6-100.8-83.2-76.8-20.8-128-16-192 9.6z" fill="#050D42" />
              <path d="M612.8 464m-112 0a112 112 0 1 0 224 0 112 112 0 1 0-224 0Z" fill="#2F4BFF" />
              <path d="M382.4 587.2l3.2 16c-9.6 1.6-20.8 4.8-32 9.6-22.4 9.6-49.6 30.4-70.4 56-17.6 20.8-20.8 94.4-1.6 129.6 17.6 33.6 96 76.8 124.8 75.2 16-1.6 25.6-4.8 43.2-12.8 1.6 0 1.6 0 3.2-1.6 4.8-1.6 8-3.2 9.6-4.8 25.6-11.2 51.2-33.6 57.6-56 1.6-8 3.2-9.6 9.6-27.2 9.6-22.4 12.8-35.2 11.2-51.2l16-1.6c1.6 19.2-1.6 33.6-12.8 59.2-6.4 17.6-8 19.2-9.6 25.6-8 28.8-36.8 54.4-65.6 67.2-3.2 1.6-4.8 3.2-9.6 4.8-1.6 0-1.6 0-3.2 1.6-19.2 9.6-30.4 14.4-49.6 14.4-35.2 3.2-118.4-43.2-139.2-83.2-22.4-40-17.6-121.6 3.2-148.8 22.4-27.2 49.6-49.6 76.8-59.2 12.8-8 24-11.2 35.2-12.8z" fill="#050D42" />
              <path d="M404.8 736m-48 0a48 48 0 1 0 96 0 48 48 0 1 0-96 0Z" fill="#2F4BFF" />
              <path d="M185.6 144c24-9.6 44.8-11.2 72-3.2 20.8 6.4 32 16 41.6 33.6l11.2 22.4c9.6 20.8 8 35.2-1.6 59.2-3.2 11.2-4.8 12.8-4.8 16-4.8 17.6-24 35.2-41.6 43.2-1.6 0-3.2 1.6-6.4 3.2-1.6 0-1.6 0-1.6 1.6-12.8 6.4-19.2 8-30.4 9.6-22.4 1.6-75.2-27.2-88-52.8-14.4-25.6-11.2-76.8 3.2-94.4 12.8-17.6 28.8-32 46.4-38.4z m4.8 16c-12.8 4.8-28.8 17.6-41.6 33.6-9.6 11.2-11.2 56-1.6 76.8 11.2 19.2 56 44.8 73.6 43.2 9.6 0 14.4-3.2 25.6-8 1.6 0 1.6 0 1.6-1.6 3.2-1.6 4.8-1.6 6.4-3.2 14.4-6.4 30.4-20.8 33.6-32 1.6-4.8 1.6-6.4 6.4-17.6 8-19.2 9.6-30.4 1.6-44.8l-11.2-22.4c-8-14.4-14.4-20.8-32-25.6-24-8-41.6-8-62.4 1.6z" fill="#050D42" />
              <path d="M228.8 232m-24 0a24 24 0 1 0 48 0 24 24 0 1 0-48 0Z" fill="#2F4BFF" />
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
              <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-[color-mix(in_srgb,var(--border-subtle)_75%,white)] bg-[color-mix(in_srgb,var(--paper-deep)_92%,black)] p-2 shadow-[0_18px_50px_rgba(0,0,0,0.45)] z-50">
                <div className="flex flex-col gap-2">
                  {links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className={`block rounded-xl px-3 py-2 text-sm transition ${
                        pathname === link.href
                          ? "bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] text-[var(--ink)]"
                          : "text-[var(--ink)] hover:bg-[color-mix(in_srgb,var(--surface-soft)_35%,white)]"
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