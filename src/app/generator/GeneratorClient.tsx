"use client";
import { useMemo, useState } from "react";
import Link from "next/link";

const DNA_BASES = ["A", "C", "G", "T"];
const RNA_BASES = ["A", "C", "G", "U"];
const randomBase = (bases: string[]) => bases[Math.floor(Math.random() * bases.length)] ?? "A";
const generateRandomSequence = (length: number, type: "DNA" | "RNA") => Array.from({ length }, () => randomBase(type === "RNA" ? RNA_BASES : DNA_BASES)).join("");

export default function GeneratorClient() {
  const [generatorType, setGeneratorType] = useState<"DNA" | "RNA">("DNA");
  const [generatorLength, setGeneratorLength] = useState(120);
  const [generated, setGenerated] = useState("");
  const summary = useMemo(() => ({ length: generated.length, type: generatorType }), [generated.length, generatorType]);
  const handleGenerate = () => setGenerated(generateRandomSequence(Math.min(2000, Math.max(15, Math.round(generatorLength))), generatorType));

  return <main className="mx-auto max-w-7xl border-x border-[var(--border-subtle)] px-4 py-6 sm:px-6">
    <header className="mb-6 flex flex-col gap-4 border-b border-[var(--border-subtle)] pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="lab-kicker">Module 02 / sequence generator</p><h1 className="mt-3 text-3xl font-semibold tracking-[-.04em] sm:text-5xl">Build a test sequence</h1></div>
      <p className="max-w-md text-sm leading-6 text-[var(--ink-soft)]">Create a controlled DNA or RNA input for validating the analyzer workflow.</p>
    </header>

    <section className="grid border border-[var(--border-subtle)] lg:grid-cols-[.42fr_.58fr]">
      <div className="border-b border-[var(--border-subtle)] bg-[var(--surface)] p-5 lg:border-b-0 lg:border-r sm:p-6">
        <h2 className="font-mono text-xs uppercase tracking-wider text-[var(--ink-soft)]">Generation parameters</h2>
        <div className="mt-6 grid gap-5">
          <label className="grid gap-2 font-mono text-[10px] uppercase tracking-wider text-[var(--ink-soft)]" htmlFor="select-generator-type">Molecule type
            <select id="select-generator-type" className="border border-[var(--border-subtle)] bg-[var(--surface)] px-4 py-3 font-sans text-sm normal-case tracking-normal text-[var(--ink)] outline-none focus:border-[var(--accent)]" value={generatorType} onChange={e => setGeneratorType(e.target.value as "DNA" | "RNA")}><option value="DNA">DNA</option><option value="RNA">RNA</option></select>
          </label>
          <label className="grid gap-2 font-mono text-[10px] uppercase tracking-wider text-[var(--ink-soft)]" htmlFor="input-generator-length">Sequence length / bases
            <input id="input-generator-length" className="border border-[var(--border-subtle)] bg-[var(--surface)] px-4 py-3 font-mono text-sm tracking-normal text-[var(--ink)] outline-none focus:border-[var(--accent)]" type="number" min={15} max={2000} value={generatorLength} onChange={e => setGeneratorLength(Number(e.target.value) || 15)} />
          </label>
          <div className="grid grid-cols-2 border-l border-t border-[var(--border-subtle)]">
            <div className="border-b border-r border-[var(--border-subtle)] p-4"><p className="font-mono text-[9px] uppercase text-[var(--ink-soft)]">Minimum</p><p className="mt-1 font-mono">15 bp</p></div>
            <div className="border-b border-r border-[var(--border-subtle)] p-4"><p className="font-mono text-[9px] uppercase text-[var(--ink-soft)]">Maximum</p><p className="mt-1 font-mono">2,000 bp</p></div>
          </div>
          <button type="button" id="btn-generator-submit" className="bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--accent-contrast)] hover:bg-[var(--accent-strong)]" onClick={handleGenerate}>Generate sequence →</button>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
          <div><h2 className="font-mono text-xs uppercase tracking-wider">Sequence output</h2><p className="mt-1 font-mono text-[10px] text-[var(--ink-soft)]">{summary.type} · {summary.length} BP</p></div>
          <div className="flex gap-2"><button type="button" id="btn-generator-copy" className="border border-[var(--border-subtle)] px-4 py-2 text-xs font-semibold hover:bg-[var(--surface-soft)] disabled:opacity-40" disabled={!generated} onClick={async () => generated && navigator.clipboard.writeText(generated)}>Copy</button><Link href={generated ? `/analyze?sequence=${encodeURIComponent(generated)}` : "/analyze"} id="link-generator-open-analyzer" className="border border-[var(--accent)] px-4 py-2 text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--accent-contrast)]">Open in analyzer →</Link></div>
        </div>
        <pre className="mt-5 min-h-[280px] max-h-[420px] overflow-auto border border-[var(--border-subtle)] bg-[var(--surface)] p-5 font-mono text-sm leading-7 text-[var(--ink)] whitespace-pre-wrap break-all">{generated || "Awaiting generation parameters…"}</pre>
        <div className="mt-4 flex justify-between font-mono text-[9px] uppercase tracking-wider text-[var(--ink-soft)]"><span>Randomized input</span><span>No biological claim</span></div>
      </div>
    </section>
  </main>;
}
