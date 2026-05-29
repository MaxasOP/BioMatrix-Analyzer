"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

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

type ThemeMode = "dark" | "light";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-6 backdrop-blur-md">
      <div className="flex max-w-md flex-col items-center gap-4 rounded-[28px] border border-white/10 bg-slate-950/85 p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <span className="scale-[0.7] origin-center">
          <HamsterLoader />
        </span>
        <div>
          <p className="text-lg font-semibold text-slate-100">{label}</p>
          <p className="mt-1 text-sm text-slate-300">
            Gemini can take a moment. The app will retry once if needed.
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
  const [session, setSession] = useState<Session | null>(null);
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [initialQueryApplied, setInitialQueryApplied] = useState(false);

  const normalizedInput = useMemo(() => sanitizeSequence(sequence), [sequence]);
  const normalizedCompare = useMemo(
    () => sanitizeSequence(compareSequence),
    [compareSequence]
  );
  const detectedType = normalizedInput ? detectSequenceType(normalizedInput) : "DNA";
  const isBusy = isAnalyzing || aiLoading;

  useEffect(() => {
    try {
      const savedTheme = window.localStorage.getItem("bio-matrix-theme");
      const nextTheme: ThemeMode =
        savedTheme === "light" || savedTheme === "dark"
          ? savedTheme
          : window.matchMedia?.("(prefers-color-scheme: light)").matches
            ? "light"
            : "dark";
      setTheme(nextTheme);
      document.documentElement.dataset.theme = nextTheme;
      document.documentElement.style.colorScheme = nextTheme;
    } catch {
      // ignore
    }

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
      void fetch("/api/history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          sequence_preview:
            result.sequence.length > 60 ? `${result.sequence.slice(0, 60)}...` : result.sequence,
          payload: {
            analysis: result,
            mutationSummary: summary,
            compareSequence: compareCleaned || null,
          },
        }),
      });
    }

    await requestAiExplanation(result, summary);
    setIsAnalyzing(false);
  };

  const statusClass = status
    ? status.type === "error"
      ? theme === "dark"
        ? "border-red-400/40 bg-red-500/10 text-red-200"
        : "border-red-200 bg-red-50 text-red-700"
      : status.type === "success"
        ? theme === "dark"
          ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
          : "border-emerald-200 bg-emerald-50 text-emerald-700"
        : theme === "dark"
          ? "border-white/10 bg-white/5 text-slate-200"
          : "border-slate-200 bg-white text-slate-700"
    : "";

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      {isBusy && (
        <BusyOverlay label={isAnalyzing ? "Analyzing your sequence" : "Generating AI summary"} />
      )}

      <section className="grid gap-6 rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-[0_18px_60px_rgba(0,0,0,0.12)] backdrop-blur-xl lg:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">Analyze</p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">
              Focused sequence analysis
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--ink-soft)]">
              This page is only for analysis so the workflow stays clean. You can paste a
              sequence, compare it, and let Gemini explain the result.
            </p>
          </div>

          <div className="grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-5">
            <label className="text-sm font-medium text-slate-300">Primary sequence</label>
            <textarea
              className="min-h-[180px] w-full rounded-2xl border border-white/10 bg-slate-950/60 p-4 font-mono text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-400"
              value={sequence}
              onChange={(event) => setSequence(event.target.value)}
              placeholder="Paste DNA/RNA or load a sequence from the generator"
            />
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
              <span>Detected: {normalizedInput ? detectedType : "N/A"}</span>
              <span>Length: {normalizedInput.length} bases</span>
            </div>
            <label className="text-sm font-medium text-slate-300">Comparison sequence</label>
            <textarea
              className="min-h-[120px] w-full rounded-2xl border border-white/10 bg-slate-950/60 p-4 font-mono text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-400"
              value={compareSequence}
              onChange={(event) => setCompareSequence(event.target.value)}
              placeholder="Paste a second sequence to detect mutations"
            />
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
              <span>Comparison length: {normalizedCompare.length} bases</span>
              <span>Comparison uses T/U normalization</span>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-70"
                onClick={handleAnalyze}
                disabled={isBusy}
              >
                {isBusy ? (isAnalyzing ? "Analyzing..." : "Running AI...") : "Run analysis"}
              </button>
              <a
                href="/generator"
                className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
              >
                Open generator
              </a>
            </div>

            {status && (
              <div className={`rounded-2xl border px-4 py-3 text-sm ${statusClass}`}>
                {status.message}
              </div>
            )}
          </div>

          <div className="grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-xl font-semibold">Summary</h2>
            {analysis ? (
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    ["Type", analysis.sequenceType],
                    ["Length", `${analysis.length} bases`],
                    ["GC%", analysis.gcPercentage.toFixed(2)],
                    ["ORFs", String(analysis.orfs.length)],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
                      <p className="mt-1 text-lg font-semibold text-slate-100">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(analysis.counts).map(([key, value]) => (
                    <span key={key} className="rounded-full bg-white/5 px-3 py-1 text-sm text-slate-200">
                      {key}: {value}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-[var(--ink-soft)]">Run analysis to see the sequence summary.</p>
            )}
          </div>

          <div className="grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-xl font-semibold">Mutation details</h2>
            {mutationSummary ? (
              <div className="grid gap-3">
                <div className="flex flex-wrap gap-3 text-sm">
                  <span className="rounded-full bg-white/5 px-3 py-1 text-slate-200">Total: {mutationSummary.total}</span>
                  <span className="rounded-full bg-white/5 px-3 py-1 text-slate-200">Subs: {mutationSummary.substitutions}</span>
                  <span className="rounded-full bg-white/5 px-3 py-1 text-slate-200">Insertions: {mutationSummary.insertions}</span>
                  <span className="rounded-full bg-white/5 px-3 py-1 text-slate-200">Deletions: {mutationSummary.deletions}</span>
                </div>
                <div className="space-y-2">
                  {mutations.slice(0, 8).map((mutation) => (
                    <div
                      key={`${mutation.position}-${mutation.type}`}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                    >
                      <span className="font-mono text-slate-100">
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

        <aside className="grid gap-6 lg:sticky lg:top-6">
          <div className="grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-xl font-semibold">AI summary</h2>
            <div className="min-h-[180px] rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-200">
              {aiLoading || isAnalyzing ? (
                <p className="py-10 text-center text-slate-300">Generating insight...</p>
              ) : aiText ? (
                <pre className="whitespace-pre-wrap font-sans leading-7 text-slate-200">{aiText}</pre>
              ) : (
                <p>Run analysis to generate a plain-language explanation.</p>
              )}
            </div>
            <p className="text-sm text-[var(--ink-soft)]">
              The AI call retries once automatically if Gemini is busy.
            </p>
          </div>

          <div className="grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-xl font-semibold">Why this page is simpler</h2>
            <p className="text-sm leading-6 text-[var(--ink-soft)]">
              This page only focuses on analysis and AI interpretation. Generator,
              history, and profile live on their own pages so the workflow is easier to
              scan.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}