"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import {
  analyzeSequence,
  detectMutations,
  detectSequenceType,
  normalizeForComparison,
  sanitizeSequence,
  summarizeMutations,
  validateSequence,
  type AnalysisResult,
  type Mutation,
  type MutationSummary,
} from "@/lib/analysis";
import HamsterLoader from "@/components/HamsterLoader";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import type { Session } from "@supabase/supabase-js";

const supabase = createBrowserSupabaseClient();

const formatAiResponse = (text: string) =>
  text
    .replace(/\r\n/g, "\n")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/^\s*\d+[.)]\s+/gm, "")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

function BusyOverlay({ label }: { label: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 px-6">
      <div className="flex max-w-md flex-col items-center gap-4 border border-[var(--border-subtle)] bg-[var(--paper)] p-8 text-center">
        <span className="scale-[0.7] origin-center">
          <HamsterLoader />
        </span>
        <div>
          <p className="text-lg font-semibold text-[var(--ink)]">{label}</p>
          <p className="mt-1 text-sm text-slate-300">
            Gemini can take a moment. Hold on dear Researcher...
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AnalyzeClient() {
  const searchParams = useSearchParams();
  const [sequence, setSequence] = useState("");
  const [compareSequence, setCompareSequence] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [mutations, setMutations] = useState<Mutation[]>([]);
  const [mutationSummary, setMutationSummary] = useState<MutationSummary | null>(null);
  const [aiText, setAiText] = useState("");
  const [status, setStatus] = useState<{
    type: "info" | "success" | "error";
    message: string;
  } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [initialQueryApplied, setInitialQueryApplied] = useState(false);

  const normalizedInput = useMemo(() => sanitizeSequence(sequence), [sequence]);
  const normalizedCompare = useMemo(
    () => sanitizeSequence(compareSequence),
    [compareSequence]
  );
  const detectedType = normalizedInput ? detectSequenceType(normalizedInput) : "DNA";
  const isBusy = isAnalyzing || aiLoading;

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

  useEffect(() => {
    if (initialQueryApplied) {
      return;
    }

    if (!searchParams) {
      setInitialQueryApplied(true);
      return;
    }

    const presetSequence = searchParams.get("sequence");
    const presetCompare = searchParams.get("compare");
    if (presetSequence) {
      setSequence(presetSequence);
    }
    if (presetCompare) {
      setCompareSequence(presetCompare);
    }

    if (presetSequence) {
      setStatus({ type: "info", message: "Loaded a sequence from the generator/history page." });
    }

    setInitialQueryApplied(true);
  }, [initialQueryApplied, searchParams]);

  const requestAiExplanation = useCallback(
    async (analysisResult: AnalysisResult, mutationSummaryValue: MutationSummary | null) => {
      setAiLoading(true);
      setAiText("");

      const sequencePreview =
        analysisResult.sequence.length > 2000
          ? `${analysisResult.sequence.slice(0, 2000)}...`
          : analysisResult.sequence;
      const summary = {
        sequenceType: analysisResult.sequenceType,
        length: analysisResult.length,
        gcPercentage: Number(analysisResult.gcPercentage.toFixed(2)),
        counts: analysisResult.counts,
        translationPreview: analysisResult.translation.split("-").slice(0, 18).join("-"),
        orfCount: analysisResult.orfs.length,
        restrictionSites: analysisResult.restrictionSites.filter(
          (site) => site.positions.length > 0
        ),
        mutationSummary: mutationSummaryValue,
      };

      const fetchGemini = async () => {
        const response = await fetch("/api/gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sequence: sequencePreview, summary }),
        });

        if (!response.ok) {
          const data = (await response.json().catch(() => null)) as
            | { error?: string; detail?: string }
            | null;
          throw new Error(data?.detail ?? data?.error ?? "Gemini request failed");
        }

        const data = (await response.json()) as { text?: string };
        return formatAiResponse(data.text ?? "No response returned.");
      };

      const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

      try {
        setAiText(await fetchGemini());
        setStatus({ type: "success", message: "AI summary is ready." });
      } catch (firstError) {
        const firstMessage =
          firstError instanceof Error ? firstError.message : "Gemini request failed.";
        setStatus({
          type: "info",
          message: "Gemini is busy. Retrying once to check if it comes back...",
        });
        await delay(1200);

        try {
          setAiText(await fetchGemini());
          setStatus({ type: "success", message: "AI summary is ready." });
        } catch (retryError) {
          setAiText("AI summary unavailable right now.");
          setStatus({
            type: "error",
            message:
              retryError instanceof Error ? retryError.message : firstMessage,
          });
        }
      } finally {
        setAiLoading(false);
      }
    },
    []
  );

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    const cleaned = sanitizeSequence(sequence);
    const type = detectSequenceType(cleaned);
    const validation = validateSequence(cleaned, type);

    if (!validation.valid) {
      setStatus({ type: "error", message: validation.errors[0] ?? "Invalid sequence." });
      setIsAnalyzing(false);
      return;
    }

    let compareCleaned = "";
    let mutationList: Mutation[] = [];
    let summary: MutationSummary | null = null;

    if (compareSequence.trim()) {
      compareCleaned = sanitizeSequence(compareSequence);
      const compareType = detectSequenceType(compareCleaned);
      const compareValidation = validateSequence(compareCleaned, compareType);
      if (!compareValidation.valid) {
        setStatus({
          type: "error",
          message: compareValidation.errors[0] ?? "Invalid comparison sequence.",
        });
        setIsAnalyzing(false);
        return;
      }
      mutationList = detectMutations(
        normalizeForComparison(cleaned),
        normalizeForComparison(compareCleaned)
      );
      summary = summarizeMutations(mutationList);
    }

    const result = analyzeSequence(cleaned, type);
    setAnalysis(result);
    setMutations(mutationList);
    setMutationSummary(summary);

    if (session?.access_token) {
      // Previously auto-saved here. Auto-save removed so users can choose what to store.
    }

    await requestAiExplanation(result, summary);
    setIsAnalyzing(false);
  };

  const saveAnalysis = async () => {
    if (!analysis) {
      setStatus({ type: "info", message: "Nothing to save yet. Run an analysis first." });
      return;
    }

    if (!session?.access_token) {
      setStatus({ type: "info", message: "Sign in to save analyses to the cloud." });
      return;
    }

    try {
      setIsSaving(true);
      setStatus({ type: "info", message: "Saving analysis..." });
      const res = await fetch("/api/history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          sequence_preview:
            analysis.sequence.length > 60 ? `${analysis.sequence.slice(0, 60)}...` : analysis.sequence,
          payload: {
            analysis,
            mutationSummary,
            compareSequence: compareSequence.trim() || null,
          },
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => null);
        throw new Error(text || "Save failed");
      }

      setStatus({ type: "success", message: "Saved to cloud history." });
    } catch (err) {
      setStatus({ type: "error", message: err instanceof Error ? err.message : "Save failed." });
    } finally {
      setIsSaving(false);
    }
  };

  const statusClass = status
    ? status.type === "error"
      ? "border-red-400/40 bg-red-500/10 text-red-200"
      : status.type === "success"
        ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
        : "border-[var(--border-subtle)] bg-[var(--surface)] text-slate-200"
    : "";

  return (
    <main className="mx-auto max-w-7xl border-x border-[var(--border-subtle)] px-4 py-6 sm:px-6">
      {isBusy && (
        <BusyOverlay label={isAnalyzing ? "Analyzing your sequence" : "Generating AI summary"} />
      )}

      <header className="mb-6 flex flex-col gap-4 border-b border-[var(--border-subtle)] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="lab-kicker">Module 01 / sequence analyzer</p><h1 className="mt-3 text-3xl font-semibold tracking-[-.04em] sm:text-5xl">Sequence workbench</h1></div>
        <p className="max-w-md text-sm leading-6 text-[var(--ink-soft)]">Paste a primary sequence. Add a reference only when you need positional mutation comparison.</p>
      </header>

      <section className="grid gap-0 border border-[var(--border-subtle)] lg:grid-cols-[1.35fr_.65fr]">
        <div className="grid gap-6">
          <div className="grid gap-3 border-b border-[var(--border-subtle)] bg-[var(--surface)] p-4 sm:p-6">
            <div className="flex items-center justify-between"><label className="font-mono text-xs font-medium uppercase tracking-wider text-[var(--ink)]" htmlFor="textarea-analyze-sequence">A / Primary sequence</label><span className="font-mono text-[10px] text-[var(--ink-soft)]">{normalizedInput ? detectedType : "UNSET"} · {normalizedInput.length} BP</span></div>
            <textarea
              id="textarea-analyze-sequence"
              className="min-h-[190px] w-full border border-[var(--border-subtle)] bg-[var(--surface)] p-4 font-mono text-sm leading-7 text-[var(--ink)] outline-none placeholder:text-[var(--ink-soft)] focus:border-[var(--accent)]"
              value={sequence}
              onChange={(event) => setSequence(event.target.value)}
              placeholder="Paste DNA/RNA or load a sequence from the generator"
            />
            <div className="mt-2 flex items-center justify-between"><label className="font-mono text-xs font-medium uppercase tracking-wider text-[var(--ink)]" htmlFor="textarea-analyze-compare">B / Comparison sequence <span className="text-[var(--ink-soft)]">— optional</span></label><span className="font-mono text-[10px] text-[var(--ink-soft)]">{normalizedCompare.length} BP</span></div>
            <textarea
              id="textarea-analyze-compare"
              className="min-h-[112px] w-full border border-[var(--border-subtle)] bg-[var(--surface)] p-4 font-mono text-sm leading-7 text-[var(--ink)] outline-none placeholder:text-[var(--ink-soft)] focus:border-[var(--accent)]"
              value={compareSequence}
              onChange={(event) => setCompareSequence(event.target.value)}
              placeholder="Paste a second sequence to detect mutations"
            />
            <div className="flex flex-wrap items-center gap-3 border-t border-[var(--border-subtle)] pt-4">
              <button
                type="button"
                id="btn-analyze-run"
                className="bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--accent-contrast)] hover:bg-[var(--accent-strong)] disabled:opacity-70"
                onClick={handleAnalyze}
                disabled={isBusy}
              >
                {isBusy ? (isAnalyzing ? "Analyzing..." : "Running AI...") : "Run analysis"}
              </button>
              {analysis && (
                <button
                  type="button"
                  id="btn-analyze-save"
                  className="border border-[var(--border-subtle)] px-5 py-3 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--surface-soft)] disabled:opacity-70"
                  onClick={saveAnalysis}
                  disabled={!session || isSaving}
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
              )}
              <Link
                href="/generator"
                id="link-analyze-open-generator"
                className="ml-auto border-b border-[var(--ink-soft)] py-2 text-sm text-[var(--ink-soft)] hover:text-[var(--ink)]"
              >
                Open generator
              </Link>
            </div>

            {status && (
              <div className={`border px-4 py-3 text-sm ${statusClass}`}>
                {status.message}
              </div>
            )}
          </div>

          <div className="grid gap-3 border-b border-[var(--border-subtle)] p-4 sm:p-6">
            <h2 className="font-mono text-xs uppercase tracking-wider text-[var(--ink-soft)]">Composition summary</h2>
            {analysis ? (
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    ["Type", analysis.sequenceType],
                    ["Length", `${analysis.length} bases`],
                    ["GC%", analysis.gcPercentage.toFixed(2)],
                    ["ORFs", String(analysis.orfs.length)],
                  ].map(([label, value]) => (
                    <div key={label} className="border-l border-[var(--border-subtle)] p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
                      <p className="mt-1 text-lg font-semibold text-[var(--ink)]">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(analysis.counts).map(([key, value]) => (
                    <span key={key} className="border border-[var(--border-subtle)] px-3 py-1 font-mono text-sm text-slate-200">
                      {key}: {value}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-[var(--ink-soft)]">Run analysis to see the sequence summary.</p>
            )}
          </div>

          <div className="grid gap-3 p-4 sm:p-6">
            <h2 className="font-mono text-xs uppercase tracking-wider text-[var(--ink-soft)]">Mutation register</h2>
            {mutationSummary ? (
              <div className="grid gap-3">
                <div className="flex flex-wrap gap-3 text-sm">
                  <span className="border border-[var(--border-subtle)] px-3 py-1 font-mono text-slate-200">Total: {mutationSummary.total}</span>
                  <span className="border border-[var(--border-subtle)] px-3 py-1 font-mono text-slate-200">Subs: {mutationSummary.substitutions}</span>
                  <span className="border border-[var(--border-subtle)] px-3 py-1 font-mono text-slate-200">Insertions: {mutationSummary.insertions}</span>
                  <span className="border border-[var(--border-subtle)] px-3 py-1 font-mono text-slate-200">Deletions: {mutationSummary.deletions}</span>
                </div>
                <div className="space-y-2">
                  {mutations.slice(0, 8).map((mutation) => (
                    <div
                      key={`${mutation.position}-${mutation.type}`}
                      className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] px-3 py-2 text-sm"
                    >
                      <span className="font-mono text-[var(--ink)]">
                        {mutation.ref} -&gt; {mutation.sample}
                      </span>
                      <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        {mutation.type} @ {mutation.position}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-[var(--ink-soft)]">Add a comparison sequence to reveal mutations.</p>
            )}
          </div>
        </div>

        <aside className="border-t border-[var(--border-subtle)] bg-[var(--surface)] p-4 lg:border-l lg:border-t-0 sm:p-6">
          <div className="grid gap-3 lg:sticky lg:top-24">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3"><h2 className="font-mono text-xs uppercase tracking-wider">Interpretation</h2><span className="font-mono text-[9px] text-[var(--accent)]">GEMINI / ASSISTED</span></div>
            <div className="min-h-[240px] text-sm text-slate-200">
              {aiLoading || isAnalyzing ? (
                <p className="py-10 text-center text-slate-300">Generating insight...</p>
              ) : aiText ? (
                <pre className="whitespace-pre-wrap font-sans leading-7 text-slate-200">{aiText}</pre>
              ) : (
                <p>Run analysis to generate a plain-language explanation.</p>
              )}
            </div>
            <p className="border-t border-[var(--border-subtle)] pt-4 font-mono text-[10px] leading-5 text-[var(--ink-soft)]">Generated interpretation is supplementary. Validate biological conclusions against appropriate reference data.</p>
          </div>
        </aside>
      </section>
    </main>
  );
}
