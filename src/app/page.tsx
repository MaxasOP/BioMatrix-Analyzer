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

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const handleAnalyze = async () => {
    const cleaned = sanitizeSequence(sequence);
    const type = detectSequenceType(cleaned);
    const validation = validateSequence(cleaned, type);

    if (!validation.valid) {
      setStatus({
        type: "error",
        message: validation.errors[0] ?? "Invalid sequence.",
      });
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
  };

  const handleExplain = async () => {
    if (!analysis) {
      setStatus({
        type: "error",
        message: "Run an analysis before requesting an AI explanation.",
      });
      return;
    }

    setAiLoading(true);
    setAiText("");

    const sequencePreview =
      analysis.sequence.length > 2000
        ? `${analysis.sequence.slice(0, 2000)}...`
        : analysis.sequence;
    const summary = {
      sequenceType: analysis.sequenceType,
      length: analysis.length,
      gcPercentage: Number(analysis.gcPercentage.toFixed(2)),
      counts: analysis.counts,
      translationPreview: analysis.translation.split("-").slice(0, 18).join("-"),
      orfCount: analysis.orfs.length,
      restrictionSites: analysis.restrictionSites.filter(
        (site) => site.positions.length > 0
      ),
      mutationSummary,
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
      setAiText(data.text ?? "No response returned.");
    } catch {
      setStatus({
        type: "error",
        message:
          "Gemini request failed. Check the server error details, API key, model name, and usage limits.",
      });
    } finally {
      setAiLoading(false);
    }
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

  const handleClear = () => {
    setSequence("");
    setCompareSequence("");
    setAnalysis(null);
    setMutations([]);
    setMutationSummary(null);
    setAiText("");
    setStatus(null);
  };

  const statusClass = status
    ? status.type === "error"
      ? "bg-red-50 text-red-700 border-red-200"
      : status.type === "success"
        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
        : "bg-slate-100 text-slate-700 border-slate-200"
    : "";

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-60" />
      <div className="pointer-events-none absolute -top-32 left-10 h-72 w-72 rounded-full bg-[var(--glow)] blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-40 h-72 w-72 rounded-full bg-[color-mix(in_srgb,var(--accent-cold)_40%,white)] blur-3xl" />

      <header className="relative mx-auto max-w-6xl px-6 pt-12 pb-6">
        <div className="flex flex-col gap-6">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--accent-strong)]">
            BioMatrix AI
          </p>
          <div className="flex flex-col gap-4">
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
              Sequence intelligence for students, labs, and research
            </h1>
            <p className="max-w-2xl text-base text-[var(--ink-soft)] sm:text-lg">
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
                className="rounded-full border border-slate-200 bg-white/70 px-4 py-1 text-slate-700"
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
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--accent-strong)]">
                  Sequence Lab
                </p>
                <h2 className="text-2xl font-semibold">
                  Analyze a sequence
                </h2>
              </div>
              <div className="rounded-full border border-slate-200 bg-white/70 px-4 py-1 text-xs uppercase tracking-[0.2em] text-slate-600">
                Detected: {normalizedInput ? detectedType : "N/A"}
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <label className="text-sm font-medium text-[var(--ink-soft)]">
                Primary sequence
              </label>
              <textarea
                className="min-h-[140px] w-full rounded-2xl border border-slate-200 bg-white/80 p-4 font-mono text-sm text-slate-800 outline-none transition focus:border-[var(--accent)]"
                placeholder="Paste DNA/RNA, FASTA, or upload a file"
                value={sequence}
                onChange={(event) => setSequence(event.target.value)}
              />
              <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-[var(--ink-soft)]">
                <span>Length: {normalizedInput.length} bases</span>
                <span>Allowed: A, C, G, T, U</span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <label className="rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-slate-600">
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
                  className="rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-slate-600"
                  onClick={handleLoadSample}
                >
                  Load sample
                </button>
                <button
                  type="button"
                  className="rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-slate-600"
                  onClick={handleClear}
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[0_16px_40px_rgba(14,165,164,0.35)] transition hover:bg-[var(--accent-strong)]"
                onClick={handleAnalyze}
              >
                Run analysis
              </button>
              <button
                type="button"
                className="rounded-full border border-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--accent-strong)] transition hover:bg-[var(--glow)]"
                onClick={handleExplain}
                disabled={aiLoading}
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
            <h3 className="text-lg font-semibold">Analysis summary</h3>
            {analysis ? (
              <div className="mt-4 grid gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white/70 p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Type
                    </p>
                    <p className="text-lg font-semibold">
                      {analysis.sequenceType}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/70 p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Length
                    </p>
                    <p className="text-lg font-semibold">
                      {analysis.length} bases
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/70 p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      GC%
                    </p>
                    <p className="text-lg font-semibold">
                      {analysis.gcPercentage.toFixed(2)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/70 p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
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
                      className="rounded-full bg-slate-100 px-3 py-1 text-sm"
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
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      RNA transcript
                    </p>
                    <p className="mt-1 font-mono break-words">
                      {analysis.transcript}
                    </p>
                  </div>
                )}
                {analysis.complement && (
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Complement
                    </p>
                    <p className="mt-1 font-mono break-words">
                      {analysis.complement}
                    </p>
                  </div>
                )}
                {analysis.backTranscription && (
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      DNA back-transcription
                    </p>
                    <p className="mt-1 font-mono break-words">
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
            <p className="text-sm text-[var(--ink-soft)]">
              Frame 1 translation using the standard genetic code.
            </p>
            <div className="mt-3 rounded-2xl border border-slate-200 bg-white/70 p-3 font-mono text-xs leading-relaxed text-slate-700">
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
                  <p className="text-[var(--ink-soft)]">
                    No ORFs detected in the current reading frames.
                  </p>
                )}
                {analysis.orfs.slice(0, 5).map((orf, index) => (
                  <div
                    key={`${orf.start}-${orf.end}-${index}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-100 bg-white/70 px-3 py-2"
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
                    className="flex flex-col gap-1 rounded-2xl border border-slate-100 bg-white/70 px-3 py-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{site.enzyme}</span>
                      <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        {site.recognition}
                      </span>
                    </div>
                    <span className="text-xs text-slate-600">
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
            <div className="mt-3 min-h-[120px] rounded-2xl border border-slate-200 bg-white/70 p-4 text-sm text-slate-700">
              {aiLoading
                ? "Generating insight..."
                : aiText ||
                  "Run analysis and click Explain with AI to generate a summary."}
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
            {history.length === 0 ? (
              <p className="mt-4 text-sm text-[var(--ink-soft)]">
                No saved analyses yet.
              </p>
            ) : (
              <div className="mt-3 grid gap-2 text-sm">
                {history.slice(0, 6).map((item) => (
                  <div
                    key={item.id ?? item.sequence_preview}
                    className="rounded-2xl border border-slate-100 bg-white/70 px-3 py-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold">
                        {item.payload.analysis.sequenceType} |{" "}
                        {item.payload.analysis.length} bases | GC{" "}
                        {item.payload.analysis.gcPercentage.toFixed(1)}%
                      </span>
                      <span className="text-xs text-slate-500">
                        {item.created_at
                          ? new Date(item.created_at).toLocaleString()
                          : "Local"}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-xs text-slate-600">
                      {item.sequence_preview}
                    </p>
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
