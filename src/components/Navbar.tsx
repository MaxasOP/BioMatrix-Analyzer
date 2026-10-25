"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import BioMatrixMark from "@/components/BioMatrixMark";

const links = [
  { href: "/", label: "Index", code: "00" }, { href: "/analyze", label: "Analyzer", code: "01" },
  { href: "/generator", label: "Generator", code: "02" }, { href: "/history", label: "Archive", code: "03" },
  { href: "/profile", label: "Account", code: "04" },
];
export default function Navbar() {
  const pathname = usePathname(); const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => setMenuOpen(false), [pathname]);
  return <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-[var(--paper)]">
    <div className="mx-auto flex h-16 max-w-7xl items-stretch justify-between px-4 sm:px-6">
      <Link href="/" id="nav-logo-link" className="flex items-center gap-3 border-x border-[var(--border-subtle)] px-4">
        <BioMatrixMark className="h-9 w-9 text-white" />
        <span><strong className="block text-sm tracking-[-0.02em]">BIOMATRIX</strong><small className="block font-mono text-[9px] tracking-[.18em] text-[var(--ink-soft)]">SEQUENCE LAB</small></span>
      </Link>
      <nav className="hidden items-stretch md:flex" aria-label="Primary navigation">{links.map(link => { const active = pathname === link.href; return <Link key={link.href} href={link.href} id={`nav-link-${link.label.toLowerCase()}`} className={`flex min-w-24 flex-col justify-center border-r border-[var(--border-subtle)] px-4 text-xs ${active ? "bg-[var(--accent)] text-[#0b0e0d]" : "text-[var(--ink-soft)] hover:bg-[var(--surface-soft)] hover:text-[var(--ink)]"}`}><span className="font-mono text-[9px] opacity-60">{link.code}</span><span>{link.label}</span></Link>})}</nav>
      <button type="button" id="nav-mobile-toggle" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen(v => !v)} className="my-3 border border-[var(--border-subtle)] px-3 font-mono text-xs md:hidden">{menuOpen ? "CLOSE" : "MENU"}</button>
    </div>
    {menuOpen && <nav className="border-t border-[var(--border-subtle)] bg-[var(--paper)] p-3 md:hidden">{links.map(link => <Link key={link.href} href={link.href} className={`flex justify-between border-b border-[var(--border-subtle)] px-3 py-3 text-sm ${pathname === link.href ? "text-[var(--accent)]" : "text-[var(--ink-soft)]"}`}><span>{link.label}</span><span className="font-mono text-xs">{link.code}</span></Link>)}</nav>}
  </header>;
}
