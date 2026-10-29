"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import type { Session } from "@supabase/supabase-js";
const supabase = createBrowserSupabaseClient();

export default function ProfileClient() {
  const [session, setSession] = useState<Session | null>(null); const [email, setEmail] = useState(""); const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false); const [busy, setBusy] = useState(false); const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => { if (!supabase) return; void supabase.auth.getSession().then(({ data }) => setSession(data.session)); const { data } = supabase.auth.onAuthStateChange((_, next) => setSession(next)); return () => data.subscription.unsubscribe(); }, []);
  const sendOtp = async () => { if (!supabase) return setNotice("Supabase is not configured."); if (!email.trim()) return setNotice("Enter an email to receive a sign-in code."); setBusy(true); try { const { error } = await supabase.auth.signInWithOtp({ email: email.trim() }); if (error) throw error; setNotice("Verification code sent. Check your inbox."); setOtpSent(true); setOtpCode(""); } catch (error) { setNotice(error instanceof Error ? error.message : "Could not send sign-in code."); } finally { setBusy(false); } };
  const verifyOtp = async () => { if (!supabase) return setNotice("Supabase is not configured."); if (!email.trim()) return setNotice("Enter the email that received the code."); if (!otpCode.trim()) return setNotice("Enter the verification code from your email."); setBusy(true); try { const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: otpCode.trim(), type: "email" }); if (error) throw error; setNotice("Signed in successfully."); setOtpSent(false); setOtpCode(""); } catch (error) { setNotice(error instanceof Error ? error.message : "Could not verify code."); } finally { setBusy(false); } };
  const signOut = async () => { if (!supabase) return; setBusy(true); try { const { error } = await supabase.auth.signOut(); if (error) throw error; setSession(null); setNotice("Signed out."); } catch (error) { setNotice(error instanceof Error ? error.message : "Could not sign out."); } finally { setBusy(false); } };

  return <main className="mx-auto max-w-7xl border-x border-[var(--border-subtle)] px-4 py-6 sm:px-6">
    <header className="mb-6 flex flex-col gap-4 border-b border-[var(--border-subtle)] pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="lab-kicker">Module 04 / account</p><h1 className="mt-3 text-3xl font-semibold tracking-[-.04em] sm:text-5xl">Research account</h1></div>
      <p className="max-w-md text-sm leading-6 text-[var(--ink-soft)]">Authenticate once to keep saved analyses associated with your workspace.</p>
    </header>
    <section className="grid border border-[var(--border-subtle)] lg:grid-cols-[.62fr_.38fr]">
      <div className="border-b border-[var(--border-subtle)] p-5 lg:border-b-0 lg:border-r sm:p-6">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4"><h2 className="font-mono text-xs uppercase tracking-wider">Identity</h2><span className={`font-mono text-[9px] uppercase ${session ? "text-[var(--accent)]" : "text-[var(--ink-soft)]"}`}>{session ? "Authenticated" : "Signed out"}</span></div>
        {session ? <div className="py-8"><p className="font-mono text-[10px] uppercase tracking-wider text-[var(--ink-soft)]">Active email</p><p className="mt-2 text-xl">{session.user.email ?? "User"}</p><button type="button" id="btn-profile-sign-out" className="mt-8 border border-[var(--border-subtle)] px-5 py-3 text-sm font-semibold hover:bg-[var(--surface-soft)] disabled:opacity-50" onClick={signOut} disabled={busy}>Sign out</button></div> :
          <div className="py-6"><label className="grid gap-2 font-mono text-[10px] uppercase tracking-wider text-[var(--ink-soft)]" htmlFor="input-profile-email">Email address<input id="input-profile-email" className="border border-[var(--border-subtle)] bg-[var(--surface)] px-4 py-3 font-sans text-sm normal-case tracking-normal text-[var(--ink)] outline-none placeholder:text-[var(--ink-soft)] focus:border-[var(--accent)]" type="email" placeholder="researcher@example.com" value={email} onChange={e => setEmail(e.target.value)} /></label>
            <button type="button" id="btn-profile-send-code" className="mt-3 bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--accent-contrast)] hover:bg-[var(--accent-strong)] disabled:opacity-50" onClick={sendOtp} disabled={busy}>Send verification code →</button>
            {otpSent && <div className="mt-6 border-t border-[var(--border-subtle)] pt-6"><label className="grid gap-2 font-mono text-[10px] uppercase tracking-wider text-[var(--ink-soft)]" htmlFor="input-profile-otp">Verification code<input id="input-profile-otp" className="border border-[var(--border-subtle)] bg-[var(--surface)] px-4 py-3 font-mono text-sm tracking-[.25em] text-[var(--ink)] outline-none focus:border-[var(--accent)]" inputMode="numeric" autoComplete="one-time-code" placeholder="000000" value={otpCode} onChange={e => setOtpCode(e.target.value)} /></label><button type="button" id="btn-profile-verify-code" className="mt-3 bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--accent-contrast)] disabled:opacity-50" onClick={verifyOtp} disabled={busy}>Verify and sign in →</button></div>}
          </div>}
        {notice && <p className="border-t border-[var(--border-subtle)] pt-4 text-sm text-[var(--ink-soft)]" role="status">{notice}</p>}
      </div>
      <aside className="bg-[var(--surface)] p-5 sm:p-6"><h2 className="font-mono text-xs uppercase tracking-wider text-[var(--ink-soft)]">Workspace access</h2><dl className="mt-6 border-l border-t border-[var(--border-subtle)]">
        {[["Archive","Saved analyses follow your account across devices."],["Restoration","Reopen complete sequence and comparison inputs."],["Access","Passwordless verification through your email."]].map(([term,copy]) => <div key={term} className="border-b border-r border-[var(--border-subtle)] p-4"><dt className="font-mono text-[10px] uppercase text-[var(--accent)]">{term}</dt><dd className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{copy}</dd></div>)}
      </dl><div className="mt-6 grid gap-2"><Link href="/history" id="link-profile-view-history" className="border border-[var(--border-subtle)] px-4 py-3 text-sm hover:bg-[var(--surface-soft)]">Open archive →</Link><Link href="/analyze" id="link-profile-open-analyzer" className="border border-[var(--border-subtle)] px-4 py-3 text-sm hover:bg-[var(--surface-soft)]">Open analyzer →</Link><Link href="/admin" id="link-profile-admin-dashboard" className="border-b border-[var(--border-subtle)] px-1 py-3 font-mono text-[10px] uppercase tracking-wider text-[var(--ink-soft)] hover:text-[var(--ink)]">Administrative query console</Link></div></aside>
    </section>
  </main>;
}
