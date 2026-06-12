"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const DNA_BASES = ["A", "C", "G", "T"];
const RNA_BASES = ["A", "C", "G", "U"];

const randomBase = (bases: string[]) => bases[Math.floor(Math.random() * bases.length)] ?? "A";

const generateRandomSequence = (length: number, type: "DNA" | "RNA") => {
  const bases = type === "RNA" ? RNA_BASES : DNA_BASES;
  return Array.from({ length }, () => randomBase(bases)).join("");
};

export default function GeneratorClient() {
  const [generatorType, setGeneratorType] = useState<"DNA" | "RNA">("DNA");
  const [generatorLength, setGeneratorLength] = useState(120);
  const [generated, setGenerated] = useState("");

  const summary = useMemo(
    () => ({
      length: generated.length,
      type: generatorType,
    }),
    [generated.length, generatorType]
  );

  const handleGenerate = () => {
    const sanitizedLength = Math.min(2000, Math.max(15, Math.round(generatorLength)));
    setGenerated(generateRandomSequence(sanitizedLength, generatorType));
  };

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <section className="grid gap-6 rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-[0_18px_60px_rgba(0,0,0,0.12)] backdrop-blur-xl">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">Generate</p>
          <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">Sequence generator</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--ink-soft)]">
            Create a clean DNA or RNA sequence, then copy it or jump straight to the analyzer.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <label className="grid gap-2 text-sm text-slate-300" htmlFor="select-generator-type">
            Type
            <select
              id="select-generator-type"
              className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
              value={generatorType}
              onChange={(event) => setGeneratorType(event.target.value as "DNA" | "RNA")}
            >
              <option value="DNA">DNA</option>
              <option value="RNA">RNA</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm text-slate-300" htmlFor="input-generator-length">
            Length
            <input
              id="input-generator-length"
              className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
              type="number"
              min={15}
              max={2000}
              value={generatorLength}
              onChange={(event) => setGeneratorLength(Number(event.target.value) || 15)}
            />
          </label>
          <button
            type="button"
            id="btn-generator-submit"
            className="self-end rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 cursor-pointer"
            onClick={handleGenerate}
          >
            Generate
          </button>
        </div>

        <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Generated sequence</p>
              <p className="text-sm text-[var(--ink-soft)]">
                {summary.length} bases · {summary.type}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                id="btn-generator-copy"
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10 cursor-pointer"
                onClick={async () => {
                  if (generated) {
                     await navigator.clipboard.writeText(generated);
                  }
                }}
              >
                Copy
              </button>
              <Link
                href={generated ? `/analyze?sequence=${encodeURIComponent(generated)}` : "/analyze"}
                id="link-generator-open-analyzer"
                className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/20"
              >
                Open in analyzer
              </Link>
            </div>
          </div>

          <pre className="max-h-72 overflow-auto rounded-2xl border border-white/10 bg-slate-950/60 p-4 font-mono text-sm leading-6 text-slate-100 whitespace-pre-wrap">
            {generated || "Generate a sequence to see it here."}
          </pre>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/analyze"
            id="link-generator-go-analyzer"
            className="rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            Go to analyzer
          </Link>
          <Link
            href="/"
            id="link-generator-back-overview"
            className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
          >
            Back to overview
          </Link>
        </div>
      </section>
    </main>
  );
}
