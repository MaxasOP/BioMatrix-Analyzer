export type SequenceType = "DNA" | "RNA";

export type OrfResult = {
  frame: number;
  start: number;
  end: number;
  length: number;
  sequence: string;
};

export type RestrictionSite = {
  enzyme: string;
  recognition: string;
  positions: number[];
};

export type AnalysisResult = {
  sequence: string;
  sequenceType: SequenceType;
  length: number;
  gcPercentage: number;
  counts: Record<string, number>;
  transcript: string | null;
  complement: string | null;
  backTranscription: string | null;
  translation: string;
  orfs: OrfResult[];
  restrictionSites: RestrictionSite[];
};

export type Mutation = {
  position: number;
  ref: string;
  sample: string;
  type: "substitution" | "insertion" | "deletion";
};

export type MutationSummary = {
  total: number;
  substitutions: number;
  insertions: number;
  deletions: number;
};

const DNA_NUCLEOTIDES = ["A", "C", "G", "T"];
const RNA_NUCLEOTIDES = ["A", "C", "G", "U"];
const STOP_CODONS = new Set(["TAA", "TAG", "TGA"]);

const CODON_TABLE: Record<string, string> = {
  TTT: "Phe",
  TTC: "Phe",
  TTA: "Leu",
  TTG: "Leu",
  TCT: "Ser",
  TCC: "Ser",
  TCA: "Ser",
  TCG: "Ser",
  TAT: "Tyr",
  TAC: "Tyr",
  TAA: "Stop",
  TAG: "Stop",
  TGT: "Cys",
  TGC: "Cys",
  TGA: "Stop",
  TGG: "Trp",
  CTT: "Leu",
  CTC: "Leu",
  CTA: "Leu",
  CTG: "Leu",
  CCT: "Pro",
  CCC: "Pro",
  CCA: "Pro",
  CCG: "Pro",
  CAT: "His",
  CAC: "His",
  CAA: "Gln",
  CAG: "Gln",
  CGT: "Arg",
  CGC: "Arg",
  CGA: "Arg",
  CGG: "Arg",
  ATT: "Ile",
  ATC: "Ile",
  ATA: "Ile",
  ATG: "Met",
  ACT: "Thr",
  ACC: "Thr",
  ACA: "Thr",
  ACG: "Thr",
  AAT: "Asn",
  AAC: "Asn",
  AAA: "Lys",
  AAG: "Lys",
  AGT: "Ser",
  AGC: "Ser",
  AGA: "Arg",
  AGG: "Arg",
  GTT: "Val",
  GTC: "Val",
  GTA: "Val",
  GTG: "Val",
  GCT: "Ala",
  GCC: "Ala",
  GCA: "Ala",
  GCG: "Ala",
  GAT: "Asp",
  GAC: "Asp",
  GAA: "Glu",
  GAG: "Glu",
  GGT: "Gly",
  GGC: "Gly",
  GGA: "Gly",
  GGG: "Gly",
};

const RESTRICTION_ENZYMES = [
  { name: "EcoRI", site: "GAATTC" },
  { name: "BamHI", site: "GGATCC" },
  { name: "HindIII", site: "AAGCTT" },
  { name: "NotI", site: "GCGGCCGC" },
  { name: "XhoI", site: "CTCGAG" },
  { name: "PstI", site: "CTGCAG" },
];

export function sanitizeSequence(raw: string, removeWhitespace = true): string {
  if (!raw) {
    return "";
  }
  const cleaned = raw.trim().toUpperCase();
  return removeWhitespace ? cleaned.replace(/\s+/g, "") : cleaned;
}

export function parseFasta(raw: string): string {
  if (!raw) {
    return "";
  }
  const lines = raw.split(/\r?\n/);
  const parts: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith(">") || trimmed.startsWith(";")) {
      continue;
    }
    parts.push(trimmed.replace(/\s+/g, ""));
  }
  return parts.join("").toUpperCase();
}

export function detectSequenceType(sequence: string): SequenceType {
  return sequence.toUpperCase().includes("U") ? "RNA" : "DNA";
}

export function validateSequence(sequence: string, type: SequenceType) {
  const errors: string[] = [];
  const invalidPositions: number[] = [];

  if (!sequence || sequence.length === 0) {
    errors.push("Sequence cannot be empty.");
    return { valid: false, errors, invalidPositions };
  }

  const allowed = new Set(type === "DNA" ? DNA_NUCLEOTIDES : RNA_NUCLEOTIDES);
  for (let i = 0; i < sequence.length; i += 1) {
    const current = sequence[i];
    if (!allowed.has(current)) {
      invalidPositions.push(i + 1);
    }
  }

  if (invalidPositions.length > 0) {
    const preview = invalidPositions.slice(0, 12).join(", ");
    errors.push(`Invalid ${type} nucleotide(s) at position(s): ${preview}`);
  }

  return { valid: errors.length === 0, errors, invalidPositions };
}

export function analyzeSequence(sequence: string, type?: SequenceType): AnalysisResult {
  const normalized = sanitizeSequence(sequence);
  const finalType = type ?? detectSequenceType(normalized);
  const counts = countNucleotides(normalized, finalType);
  const gcPercentage = computeGcPercentage(normalized);
  const transcript = finalType === "DNA" ? transcribe(normalized) : null;
  const complement = finalType === "DNA" ? complementSequence(normalized) : null;
  const backTranscription = finalType === "RNA" ? backTranscribe(normalized) : null;
  const translation = translateSequence(normalized, finalType);
  const orfs = findOrfs(normalized, finalType);
  const restrictionSites = findRestrictionSites(normalized, finalType);

  return {
    sequence: normalized,
    sequenceType: finalType,
    length: normalized.length,
    gcPercentage,
    counts,
    transcript,
    complement,
    backTranscription,
    translation,
    orfs,
    restrictionSites,
  };
}

export function detectMutations(reference: string, sample: string): Mutation[] {
  const ref = sanitizeSequence(reference);
  const samp = sanitizeSequence(sample);
  const maxLength = Math.max(ref.length, samp.length);
  const mutations: Mutation[] = [];

  for (let i = 0; i < maxLength; i += 1) {
    const refChar = ref[i];
    const sampleChar = samp[i];
    if (refChar === sampleChar) {
      continue;
    }
    if (!refChar) {
      mutations.push({
        position: i + 1,
        ref: "-",
        sample: sampleChar ?? "-",
        type: "insertion",
      });
      continue;
    }
    if (!sampleChar) {
      mutations.push({
        position: i + 1,
        ref: refChar,
        sample: "-",
        type: "deletion",
      });
      continue;
    }
    mutations.push({
      position: i + 1,
      ref: refChar,
      sample: sampleChar,
      type: "substitution",
    });
  }

  return mutations;
}

export function summarizeMutations(mutations: Mutation[]): MutationSummary {
  const summary: MutationSummary = {
    total: mutations.length,
    substitutions: 0,
    insertions: 0,
    deletions: 0,
  };

  for (const mutation of mutations) {
    if (mutation.type === "substitution") {
      summary.substitutions += 1;
    } else if (mutation.type === "insertion") {
      summary.insertions += 1;
    } else {
      summary.deletions += 1;
    }
  }

  return summary;
}

export function normalizeForComparison(sequence: string) {
  return sequence.replace(/U/g, "T");
}

function countNucleotides(sequence: string, type: SequenceType) {
  const template = type === "DNA" ? DNA_NUCLEOTIDES : RNA_NUCLEOTIDES;
  const counts: Record<string, number> = {};
  for (const letter of template) {
    counts[letter] = 0;
  }
  for (let i = 0; i < sequence.length; i += 1) {
    const current = sequence[i];
    if (counts[current] !== undefined) {
      counts[current] += 1;
    }
  }
  return counts;
}

function computeGcPercentage(sequence: string) {
  if (!sequence) {
    return 0;
  }
  let gc = 0;
  for (let i = 0; i < sequence.length; i += 1) {
    const current = sequence[i];
    if (current === "G" || current === "C") {
      gc += 1;
    }
  }
  return (gc / sequence.length) * 100;
}

function transcribe(sequence: string) {
  return sequence.replace(/T/g, "U");
}

function backTranscribe(sequence: string) {
  return sequence.replace(/U/g, "T");
}

function complementSequence(sequence: string) {
  const mapping: Record<string, string> = {
    A: "T",
    T: "A",
    C: "G",
    G: "C",
  };
  let result = "";
  for (let i = 0; i < sequence.length; i += 1) {
    result += mapping[sequence[i]] ?? "?";
  }
  return result;
}

function normalizeForTranslation(sequence: string, type: SequenceType) {
  return type === "RNA" ? backTranscribe(sequence) : sequence;
}

function translateSequence(sequence: string, type: SequenceType) {
  const dna = normalizeForTranslation(sequence, type);
  const amino: string[] = [];
  for (let i = 0; i + 2 < dna.length; i += 3) {
    const codon = dna.slice(i, i + 3);
    amino.push(CODON_TABLE[codon] ?? "X");
  }
  return amino.join("-");
}

function findOrfs(sequence: string, type: SequenceType): OrfResult[] {
  const dna = normalizeForTranslation(sequence, type);
  const orfs: OrfResult[] = [];

  for (let frame = 0; frame < 3; frame += 1) {
    let i = frame;
    while (i + 2 < dna.length) {
      const codon = dna.slice(i, i + 3);
      if (codon === "ATG") {
        let j = i + 3;
        let foundStop = false;
        while (j + 2 < dna.length) {
          const nextCodon = dna.slice(j, j + 3);
          if (STOP_CODONS.has(nextCodon)) {
            const start = i + 1;
            const end = j + 3;
            const length = Math.max(0, (end - i) / 3 - 1);
            orfs.push({
              frame: frame + 1,
              start,
              end,
              length,
              sequence: dna.slice(i, end),
            });
            i = j + 3;
            foundStop = true;
            break;
          }
          j += 3;
        }
        if (!foundStop) {
          i += 3;
        }
      } else {
        i += 3;
      }
    }
  }

  return orfs;
}

function findRestrictionSites(sequence: string, type: SequenceType): RestrictionSite[] {
  const dna = normalizeForTranslation(sequence, type);
  return RESTRICTION_ENZYMES.map((enzyme) => {
    const positions: number[] = [];
    let idx = dna.indexOf(enzyme.site);
    while (idx !== -1) {
      positions.push(idx + 1);
      idx = dna.indexOf(enzyme.site, idx + 1);
    }
    return {
      enzyme: enzyme.name,
      recognition: enzyme.site,
      positions,
    };
  });
}
