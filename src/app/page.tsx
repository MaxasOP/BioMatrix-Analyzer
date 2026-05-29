"use client";

import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  analyzeSequence,
  detectMutations,
  detectSequenceType,
  normalizeForComparison,
  parseFasta,
  sanitizeSequence,
  summarizeMutations,
  validateSequence,
  type AnalysisResult,
  type Mutation,
  type MutationSummary,
} from "@/lib/analysis";
import HamsterLoader from "@/components/HamsterLoader";

type HistoryPayload = {
  analysis: AnalysisResult;
  mutationSummary?: MutationSummary | null;
  compareSequence?: string | null;
};

type HistoryItem = {
  id?: string;
  created_at?: string;
  sequence_preview: string;
  payload: HistoryPayload;
};

const SAMPLE_SEQUENCE =
  "ATGTTTGGGCTAGCTGATCGTACGTTACGATCGTATGCGGATCCGGAATTCATGAAATAGCTAGCGTAA";
const SAMPLE_COMPARE =
  "ATGTTTGGGCTAGCTGATCGTACGTTACGATCATATCGGATCCGGAATTCATGAAATAGCTAGCGTAA";

const DNA_BASES = ["A", "C", "G", "T"];
const RNA_BASES = ["A", "C", "G", "U"];

const randomBase = (bases: string[]) =>
  bases[Math.floor(Math.random() * bases.length)] ?? "A";

const generateRandomSequence = (length: number, type: "DNA" | "RNA") => {
  const bases = type === "RNA" ? RNA_BASES : DNA_BASES;
  return Array.from({ length }, () => randomBase(bases)).join("");
};

function AppLogo() {
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 shadow-[0_0_0_6px_rgba(34,211,238,0.06)]">
      <svg viewBox="0 0 64 64" className="h-8 w-8 text-cyan-300" fill="none" aria-hidden="true">
        <path
          d="M18 14c8 0 12 6 12 18s-4 18-12 18"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M46 14c-8 0-12 6-12 18s4 18 12 18"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M22 22h20M20 32h24M22 42h20"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

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

export default function Home() {
  const [sequence, setSequence] = useState("");
  const [compareSequence, setCompareSequence] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [mutations, setMutations] = useState<Mutation[]>([]);
  const [mutationSummary, setMutationSummary] =
    useState<MutationSummary | null>(null);
  const [status, setStatus] = useState<
    { type: "info" | "success" | "error"; message: string } | null
  >(null);
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [generatorType, setGeneratorType] = useState<"DNA" | "RNA">("DNA");
  const [generatorLength, setGeneratorLength] = useState(120);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyMode, setHistoryMode] = useState<"remote" | "local">(
    "remote"
  );

  const normalizedInput = useMemo(
    () => sanitizeSequence(sequence),
    [sequence]
  );
  const normalizedCompare = useMemo(
    () => sanitizeSequence(compareSequence),
    [compareSequence]
  );
  const detectedType = normalizedInput
    ? detectSequenceType(normalizedInput)
    : "DNA";

  const loadHistory = useCallback(async () => {
    try {
      const response = await fetch("/api/history");
      if (!response.ok) {
        throw new Error("History unavailable");
      }
      const data = (await response.json()) as { items?: HistoryItem[] };
      if (Array.isArray(data.items)) {
        setHistory(data.items);
        setHistoryMode("remote");
      }
    } catch {
      setHistoryMode("local");
    }
  }, []);

  const handleRestoreHistory = (item: HistoryItem) => {
    const payload = item.payload;
    setSequence(payload.analysis.sequence);
    setCompareSequence(payload.compareSequence ?? "");
    setAnalysis(payload.analysis);
    setMutations([]);
    setMutationSummary(payload.mutationSummary ?? null);
    setAiText("");
    setStatus({
      type: "success",
      message: "Loaded a saved analysis from cloud history.",
    });
  };

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

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
        translationPreview: analysisResult.translation
          .split("-")
          .slice(0, 18)
          .join("-"),
        orfCount: analysisResult.orfs.length,
        restrictionSites: analysisResult.restrictionSites.filter(
          (site) => site.positions.length > 0
        ),
        mutationSummary: mutationSummaryValue,
      };

      try {
        const response = await fetch("/api/gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sequence: sequencePreview, summary }),
        });

        if (!response.ok) {
          const data = (await response.json().catch(() => null)) as
            | { error?: string; detail?: string; modelName?: string }
            | null;
          const serverMessage =
            data?.detail ?? data?.error ?? "Gemini request failed";
          throw new Error(serverMessage);
        }

        const data = (await response.json()) as { text?: string };
        setAiText(formatAiResponse(data.text ?? "No response returned."));
      } catch (error) {
        const detail = error instanceof Error ? error.message : "Gemini request failed.";
        setAiText("AI summary unavailable right now.");
        setStatus({
          type: "error",
          message: detail,
        });
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
      setStatus({
        type: "error",
        message: validation.errors[0] ?? "Invalid sequence.",
      });
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
          message:
            compareValidation.errors[0] ?? "Invalid comparison sequence.",
        });
        setIsAnalyzing(false);
        return;
      }
      const refForDiff = normalizeForComparison(cleaned);
      const sampleForDiff = normalizeForComparison(compareCleaned);
      mutationList = detectMutations(refForDiff, sampleForDiff);
      summary = summarizeMutations(mutationList);
    }

    const result = analyzeSequence(cleaned, type);
    setAnalysis(result);
    setMutations(mutationList);
    setMutationSummary(summary);
    setAiText("");
    setStatus({
      type: "success",
      message: `Analyzed ${result.sequenceType} sequence (${result.length} bases).`,
    });

    const payload: HistoryPayload = {
      analysis: result,
      mutationSummary: summary,
      compareSequence: compareCleaned || null,
    };
    const preview =
      result.sequence.length > 60
        ? `${result.sequence.slice(0, 60)}...`
        : result.sequence;
    const tempId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `local-${Date.now()}`;
    const tempItem: HistoryItem = {
      id: tempId,
      created_at: new Date().toISOString(),
      sequence_preview: preview,
      payload,
    };

    setHistory((prev) => [tempItem, ...prev].slice(0, 20));

    void (async () => {
      try {
        const response = await fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sequence_preview: preview,
            payload,
          }),
        });

        if (!response.ok) {
          throw new Error("History save failed");
        }

        const data = (await response.json()) as { item?: HistoryItem };
        if (data.item) {
          setHistory((prev) =>
            [data.item as HistoryItem, ...prev.filter((item) => item.id !== tempId)]
              .slice(0, 20)
          );
          setHistoryMode("remote");
        }
      } catch {
        setHistoryMode("local");
      }
    })();

    try {
      await requestAiExplanation(result, summary);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExplain = async () => {
    if (!analysis) {
      setStatus({
        type: "error",
        message: "Run an analysis before requesting an AI explanation.",
      });
      return;
    }

    await requestAiExplanation(analysis, mutationSummary);
  };

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const text = await file.text();
    const parsed = parseFasta(text);
    setSequence(parsed);
  };

  const handleLoadSample = () => {
    setSequence(SAMPLE_SEQUENCE);
    setCompareSequence(SAMPLE_COMPARE);
    setStatus({
      type: "info",
      message: "Sample sequences loaded.",
    });
  };

  const handleGenerateInput = () => {
    const sanitizedLength = Math.min(2000, Math.max(15, Math.round(generatorLength)));
    const generated = generateRandomSequence(sanitizedLength, generatorType);
    setSequence(generated);
    setCompareSequence("");
    setAnalysis(null);
    setMutations([]);
    setMutationSummary(null);
    setAiText("");
    setStatus({
      type: "info",
      message: `${generatorType} input generated (${sanitizedLength} bases).`,
    });
  };

  const handleClear = () => {
    setSequence("");
    setCompareSequence("");
    setAnalysis(null);
    setMutations([]);
    setMutationSummary(null);
    setAiText("");
    setStatus(null);
    setIsAnalyzing(false);
    setAiLoading(false);
  };

  const isBusy = isAnalyzing || aiLoading;

  const statusClass = status
    ? status.type === "error"
      ? "border-red-400/40 bg-red-500/10 text-red-200"
      : status.type === "success"
        ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
        : "border-white/10 bg-white/5 text-slate-200"
    : "";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(14,165,164,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.14),transparent_22%),linear-gradient(180deg,#040814_0%,#08101d_48%,#0b1324_100%)] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-60" />
      <div className="pointer-events-none absolute -top-32 left-10 h-72 w-72 rounded-full bg-[rgba(14,165,164,0.25)] blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-40 h-72 w-72 rounded-full bg-[rgba(59,130,246,0.18)] blur-3xl" />

      <header className="relative mx-auto max-w-6xl px-6 pt-12 pb-6">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-5">
            <AppLogo />
            <div>
              <p className="text-sm uppercase tracking-[0.38em] text-cyan-300">
                BioMatrix AI
              </p>
              <h1 className="mt-1 text-5xl font-semibold leading-none sm:text-6xl">
                BioMatrix AI
              </h1>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <h2 className="max-w-3xl text-2xl font-medium leading-tight text-slate-200 sm:text-3xl">
              Sequence intelligence for students, labs, and research
            </h2>
            <p className="max-w-2xl text-base text-slate-300 sm:text-lg">
              Run DNA or RNA analyses, detect mutations, find ORFs, locate
              restriction sites, and generate plain-language explanations with
              Gemini. Supabase keeps analysis history ready for collaboration.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            {[
              "DNA/RNA validation",
              "Protein translation",
              "Mutation detection",
              "ORF finder",
              "AI bio assistant",
            ].map((label) => (
              <span
                key={label}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-1 text-slate-200"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </header>

      <main className="relative mx-auto grid max-w-6xl gap-8 px-6 pb-16 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="grid gap-6">
          <div className="glass-card p-6 animate-fade-up">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">
                  Quick start
                </p>
                <h2 className="text-2xl font-semibold">
                  What to paste and what you get back
                </h2>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
                Beginner friendly
              </span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-cyan-200">1. Paste a sequence</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Use DNA or RNA text, or upload a FASTA file. This is for checking
                  what the sequence contains.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-cyan-200">2. Add a comparison</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Only fill the second box if you want mutation differences between
                  two sequences.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-cyan-200">3. Read the output</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  The app explains GC%, ORFs, protein translation, restriction sites,
                  and a plain-language AI summary automatically.
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 animate-fade-up">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">
                  Generate input
                </p>
                <h2 className="text-2xl font-semibold">
                  Create a sequence instantly
                </h2>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
                Useful for testing
              </span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <label className="grid gap-2 text-sm text-slate-300">
                Type
                <select
                  className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                  value={generatorType}
                  onChange={(event) =>
                    setGeneratorType(event.target.value as "DNA" | "RNA")
                  }
                >
                  <option value="DNA">DNA</option>
                  <option value="RNA">RNA</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm text-slate-300">
                Length
                <input
                  className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                  type="number"
                  min={15}
                  max={2000}
                  step={1}
                  value={generatorLength}
                  onChange={(event) =>
                    setGeneratorLength(Number(event.target.value) || 15)
                  }
                />
              </label>
              <button
                type="button"
                className="self-end rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/30 transition hover:bg-cyan-400"
                onClick={handleGenerateInput}
              >
                Generate
              </button>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Generates a clean sequence you can use to test the analyzer, ORF finder,
              translation, and AI summary without needing to paste data first.
            </p>
          </div>

          <div className="glass-card p-6 animate-fade-up">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">
                  Sequence Lab
                </p>
                <h2 className="text-2xl font-semibold">
                  Analyze a sequence
                </h2>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
                Detected: {normalizedInput ? detectedType : "N/A"}
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <label className="text-sm font-medium text-slate-300">
                Primary sequence
              </label>
              <textarea
                className="min-h-[140px] w-full rounded-2xl border border-white/10 bg-slate-950/60 p-4 font-mono text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
                placeholder="Paste DNA/RNA, FASTA, or upload a file"
                value={sequence}
                onChange={(event) => setSequence(event.target.value)}
              />
              <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-300">
                <span>Length: {normalizedInput.length} bases</span>
                <span>Allowed: A, C, G, T, U</span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <label className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-slate-200">
                  Upload FASTA
                  <input
                    className="hidden"
                    type="file"
                    accept=".txt,.fa,.fasta"
                    onChange={handleFileUpload}
                  />
                </label>
                <button
                  type="button"
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-slate-200"
                  onClick={handleLoadSample}
                >
                  Load sample
                </button>
                <button
                  type="button"
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-slate-200"
                  onClick={handleClear}
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                className="rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/30 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-80"
                onClick={handleAnalyze}
                disabled={isBusy}
              >
                {isBusy ? (
                  <span className="flex items-center gap-3">
                    <span className="scale-[0.22] origin-center">
                      <HamsterLoader />
                    </span>
                    <span>{isAnalyzing ? "Analyzing..." : "Running AI..."}</span>
                  </span>
                ) : (
                  "Run analysis"
                )}
              </button>
              <button
                type="button"
                className="rounded-full border border-cyan-400/50 px-6 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-70"
                onClick={handleExplain}
                disabled={isBusy || aiLoading}
              >
                {aiLoading ? "Asking Gemini..." : "Explain with AI"}
              </button>
            </div>

            {status && (
              <div
                className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${statusClass}`}
              >
                {status.message}
              </div>
            )}
          </div>

          <div className="glass-card p-6 animate-fade-up">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">Mutation detection</h3>
                <p className="text-sm text-[var(--ink-soft)]">
                  Compare the primary sequence against a sample to find
                  substitutions, insertions, and deletions.
                </p>
              </div>
              <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-600">
                Optional
              </span>
            </div>

            <div className="mt-4 grid gap-3">
              <label className="text-sm font-medium text-[var(--ink-soft)]">
                Sample sequence
              </label>
              <textarea
                className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white/80 p-4 font-mono text-sm text-slate-800 outline-none transition focus:border-[var(--accent)]"
                placeholder="Paste the sequence you want to compare"
                value={compareSequence}
                onChange={(event) => setCompareSequence(event.target.value)}
              />
              <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-[var(--ink-soft)]">
                <span>Length: {normalizedCompare.length} bases</span>
                <span>Comparison uses T/U normalization</span>
              </div>
            </div>

            {mutationSummary ? (
              <div className="mt-4 grid gap-3">
                <div className="flex flex-wrap gap-3 text-sm">
                  <span className="rounded-full bg-slate-100 px-3 py-1">
                    Total: {mutationSummary.total}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1">
                    Subs: {mutationSummary.substitutions}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1">
                    Insertions: {mutationSummary.insertions}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1">
                    Deletions: {mutationSummary.deletions}
                  </span>
                </div>
                <div className="max-h-40 space-y-2 overflow-auto pr-2 text-sm">
                  {mutations.slice(0, 8).map((mutation) => (
                    <div
                      key={`${mutation.position}-${mutation.type}`}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-100 bg-white/70 px-3 py-2"
                    >
                      <span className="font-mono">
                        {mutation.ref} -&gt; {mutation.sample}
                      </span>
                      <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        {mutation.type} @ {mutation.position}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-[var(--ink-soft)]">
                Add a sample sequence to reveal mutations.
              </p>
            )}
          </div>
        </section>

        <section className="grid gap-6">
          <div className="glass-card p-6 animate-fade-up">
            <h3 className="text-lg font-semibold">How to understand the results</h3>
            <div className="mt-4 grid gap-3 text-sm text-slate-300">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-semibold text-slate-100">GC%</p>
                <p className="mt-1 leading-6">
                  Tells you how much of the sequence is made of G and C. Higher GC can
                  affect stability and melting behavior.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-semibold text-slate-100">ORFs</p>
                <p className="mt-1 leading-6">
                  Shows possible protein-coding regions. Useful if you want to know
                  whether the sequence could make a protein.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-semibold text-slate-100">Restriction sites</p>
                <p className="mt-1 leading-6">
                  Helps in cloning and lab work by showing where enzymes cut the DNA.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-semibold text-slate-100">AI summary</p>
                <p className="mt-1 leading-6">
                  Gives a simple explanation in everyday language so a non-specialist
                  can understand the sequence faster.
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 animate-fade-up">
            <h3 className="text-lg font-semibold">Analysis summary</h3>
            {analysis ? (
              <div className="mt-4 grid gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Type
                    </p>
                    <p className="text-lg font-semibold">
                      {analysis.sequenceType}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Length
                    </p>
                    <p className="text-lg font-semibold">
                      {analysis.length} bases
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      GC%
                    </p>
                    <p className="text-lg font-semibold">
                      {analysis.gcPercentage.toFixed(2)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      ORFs
                    </p>
                    <p className="text-lg font-semibold">
                      {analysis.orfs.length}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(analysis.counts).map(([key, value]) => (
                    <span
                      key={key}
                      className="rounded-full bg-white/5 px-3 py-1 text-sm text-slate-200"
                    >
                      {key}: {value}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-[var(--ink-soft)]">
                Run an analysis to view stats and derived sequences.
              </p>
            )}
          </div>

          <div className="glass-card p-6 animate-fade-up">
            <h3 className="text-lg font-semibold">Transcription</h3>
            {analysis ? (
              <div className="mt-3 grid gap-3 text-sm">
                {analysis.transcript && (
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      RNA transcript
                    </p>
                    <p className="mt-1 font-mono break-words text-slate-100">
                      {analysis.transcript}
                    </p>
                  </div>
                )}
                {analysis.complement && (
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Complement
                    </p>
                    <p className="mt-1 font-mono break-words text-slate-100">
                      {analysis.complement}
                    </p>
                  </div>
                )}
                {analysis.backTranscription && (
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      DNA back-transcription
                    </p>
                    <p className="mt-1 font-mono break-words text-slate-100">
                      {analysis.backTranscription}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-4 text-sm text-[var(--ink-soft)]">
                Transcription results appear after analysis.
              </p>
            )}
          </div>

          <div className="glass-card p-6 animate-fade-up">
            <h3 className="text-lg font-semibold">Protein translation</h3>
            <p className="text-sm text-slate-300">
              Frame 1 translation using the standard genetic code.
            </p>
            <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-3 font-mono text-xs leading-relaxed text-slate-200 whitespace-pre-wrap">
              {analysis
                ? analysis.translation || "No translation available."
                : "Run analysis to translate the sequence."}
            </div>
          </div>

          <div className="glass-card p-6 animate-fade-up">
            <h3 className="text-lg font-semibold">ORF finder</h3>
            {analysis ? (
              <div className="mt-3 grid gap-2 text-sm">
                {analysis.orfs.length === 0 && (
                  <p className="text-slate-300">
                    No ORFs detected in the current reading frames.
                  </p>
                )}
                {analysis.orfs.slice(0, 5).map((orf, index) => (
                  <div
                    key={`${orf.start}-${orf.end}-${index}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2"
                  >
                    <span>
                      Frame {orf.frame} | {orf.start} - {orf.end}
                    </span>
                    <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      {orf.length} aa
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-[var(--ink-soft)]">
                ORFs appear after analysis.
              </p>
            )}
          </div>

          <div className="glass-card p-6 animate-fade-up">
            <h3 className="text-lg font-semibold">Restriction enzymes</h3>
            {analysis ? (
              <div className="mt-3 grid gap-2 text-sm">
                {analysis.restrictionSites.map((site) => (
                  <div
                    key={site.enzyme}
                    className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-white/5 px-3 py-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{site.enzyme}</span>
                      <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        {site.recognition}
                      </span>
                    </div>
                    <span className="text-xs text-slate-300">
                      {site.positions.length > 0
                        ? `Positions: ${site.positions.join(", ")}`
                        : "No matches"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-[var(--ink-soft)]">
                Restriction enzyme matches appear after analysis.
              </p>
            )}
          </div>

          <div className="glass-card p-6 animate-fade-up">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">AI bio assistant</h3>
              <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-600">
                Gemini
              </span>
            </div>
            <p className="text-sm text-[var(--ink-soft)]">
              Ask Gemini for a plain-language interpretation and study guidance.
            </p>
            <div className="mt-3 min-h-[120px] rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
              {(aiLoading || isAnalyzing) ? (
                <div className="flex flex-col items-center justify-center gap-3 py-2 text-center">
                  <span className="scale-[0.3] origin-center">
                    <HamsterLoader />
                  </span>
                  <span>Generating insight...</span>
                </div>
              ) : aiText ? (
                <pre className="whitespace-pre-wrap font-sans leading-7 text-slate-200">
                  {aiText}
                </pre>
              ) : (
                <p>
                  Run analysis and the AI summary will begin automatically.
                </p>
              )}
            </div>
          </div>

          <div className="glass-card p-6 animate-fade-up">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-semibold">Analysis history</h3>
              <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-600">
                {historyMode === "remote"
                  ? "Supabase"
                  : "Local session"}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Saved analyses are useful because the same user can reopen them later,
              even from another browser or device, instead of losing the results after
              refresh.
            </p>
            {history.length === 0 ? (
              <p className="mt-4 text-sm text-[var(--ink-soft)]">
                No saved analyses yet.
              </p>
            ) : (
              <div className="mt-3 grid gap-2 text-sm">
                {history.slice(0, 6).map((item) => (
                  <div
                    key={item.id ?? item.sequence_preview}
                    className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold">
                        {item.payload.analysis.sequenceType} |{" "}
                        {item.payload.analysis.length} bases | GC{" "}
                        {item.payload.analysis.gcPercentage.toFixed(1)}%
                      </span>
                      <span className="text-xs text-slate-400">
                        {item.created_at
                          ? new Date(item.created_at).toLocaleString()
                          : "Local"}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-xs text-slate-300">
                      {item.sequence_preview}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="rounded-full border border-cyan-400/40 px-3 py-1 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-400/10"
                        onClick={() => handleRestoreHistory(item)}
                      >
                        Restore
                      </button>
                      <button
                        type="button"
                        className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:bg-white/5"
                        onClick={async () => {
                          await navigator.clipboard.writeText(item.payload.analysis.sequence);
                          setStatus({
                            type: "info",
                            message: "Saved sequence copied to clipboard.",
                          });
                        }}
                      >
                        Copy sequence
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
